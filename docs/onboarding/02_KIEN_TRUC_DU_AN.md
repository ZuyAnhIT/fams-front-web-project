# 02. Kiến trúc dự án FAMS Frontend

> Kết luận ngắn: dự án là frontend Next.js 16 App Router theo hướng **feature-based modular frontend**, chạy phần lớn nghiệp vụ ở Client Components. Luồng chuẩn đang hình thành là `page → feature component → React Query hook → service → apiClient → backend`. Zustand giữ session/client state; React Query giữ server state. Kiến trúc hợp lý để phát triển tiếp, nhưng chưa đồng nhất hoàn toàn giữa các feature.

## 1. Bối cảnh hệ thống

FAMS là portal quản lý chấm công thực địa đa công ty (multi-tenant), gồm hai không gian:

- **Platform Admin** (`/admin/*`): công ty, subscription/plan, role và permission cấp nền tảng.
- **Customer/Tenant** (`/customer/*`): nhân viên, phòng ban, công trình, vùng chấm công, ca, phân công, check-in, bảng công, Face ID, notification và thiết lập.

Frontend không chứa backend nghiệp vụ. Ngoại trừ `GET /api/health`, các request `/api/v1/*` được Axios gửi từ browser và Next.js rewrite tới backend local tại `http://localhost:8080/api/*`.

```text
Người dùng / Browser
        │
        ▼
Next.js 16 App Router
  page/layout + Client Components
        │
        ├── React Query: server state/cache/mutation
        ├── Zustand: auth/tenant/notification client state
        └── Axios apiClient: token + refresh + error normalization
                 │
                 ▼
          /api/v1/* trên frontend origin
                 │ next.config.ts rewrite
                 ▼
         Backend FAMS :8080/api/v1/*
                 │
                 ├── database/object storage (thuộc backend)
                 ├── Firebase token verification
                 └── authorization/tenant enforcement bắt buộc
```

## 2. Các lớp kiến trúc và trách nhiệm

| Lớp | Vị trí | Trách nhiệm | Không nên làm |
|---|---|---|---|
| Routing/composition | `src/app` | URL, metadata, route layout, page composition, error/loading | Nhồi toàn bộ CRUD và API orchestration vào page |
| Feature presentation | `src/features/**/components` | UI và interaction gắn với một nghiệp vụ | Gọi Axios trực tiếp, dùng contract `any` không kiểm soát |
| Application/data hooks | `src/features/**/hooks` | Query key, fetch lifecycle, mutation, cache invalidation | Chứa JSX hoặc tự dựng URL HTTP |
| Domain/API service | `src/features/**/services` | Endpoint, method, params/payload, unwrap response | Hiển thị toast hoặc điều khiển modal/router |
| Validation | `src/features/**/schemas` | Zod schema và type form suy ra từ schema | Lặp lại type form bằng tay nếu có thể infer |
| Contract/type | `src/features/**/types` | Request, response, domain type | Chứa runtime side effect |
| Mapping/helper | `src/features/**/utils` | Chuẩn hoá shape/format nghiệp vụ | Truy cập UI hoặc network |
| Shared UI | `src/components` | Primitive và pattern dùng từ hai feature trở lên | Sở hữu business rule riêng của employee/site/... |
| Cross-cutting infrastructure | `src/services`, `lib`, `providers`, `stores` | HTTP, token, query provider, Firebase, theme, global store | Sao chép service nghiệp vụ cụ thể |

## 3. App Router và ranh giới Server/Client

Theo tài liệu Next.js 16.2.9 đi kèm dự án:

- `page.tsx` và `layout.tsx` mặc định là Server Components.
- Component cần state, event, effect, custom hook, `localStorage` hoặc browser API phải nằm dưới boundary `"use client"`.
- Route group `(auth)`/`(personal)` không tạo segment URL.
- Dynamic params trong Next.js 16 là Promise; trang employee detail hiện dùng React `use(params)` đúng kiểu mới.
- `middleware.ts` đã được đổi tên thành `proxy.ts` từ Next.js 16. Dự án đang dùng đúng convention này.

Hiện trạng render:

```text
RootLayout (Server)
└── QueryProvider (Client)
    └── TenantThemeProvider (Client)
        ├── AuthLayout (Server) → form Client
        └── admin/customer layout (Server)
            └── DashboardLayout (Client)
                ├── Sidebar/Header/MobileNav
                ├── Page/feature Client Components
                └── NotificationWatcher
```

Vì `QueryProvider` và `TenantThemeProvider` nằm gần root và đều là Client Components, phần lớn cây tương tác được hydrate ở browser. Đây là lựa chọn thực dụng cho portal quản trị, nhưng cần chú ý kích thước client bundle. Khi bổ sung trang chỉ đọc hoặc phần tĩnh, nên giữ page/layout ở server và đặt `"use client"` tại component tương tác nhỏ nhất có thể.

## 4. Luồng dữ liệu chuẩn

### 4.1 Đọc dữ liệu

```text
URL → page.tsx
       │ render
       ▼
FeaturePage/Tab
       │ gọi hook với tenantId + filter/page/sort
       ▼
useQuery(queryKey, queryFn)
       │ cache miss / stale / refetch
       ▼
featureService.method(...)
       │
       ▼
apiClient.get(...)
       │ Authorization: Bearer <access-token>
       ▼
Backend → ApiResponse<PageResponse<T>>
       │ unwrap tại service
       ▼
React Query cache → component rerender → DataTable/form
```

Ví dụ tốt: `AttendanceSummaryTab → useAttendanceSummaries → attendanceService.listSummaries → GET /tenants/{tenantId}/attendance`. Query key chứa `tenantId` và params, vì vậy dữ liệu của tenant/filter khác nhau không dùng chung cache.

### 4.2 Ghi dữ liệu

```text
Người dùng submit form
  → React Hook Form chạy Zod resolver
  → component gọi mutate/mutateAsync(payload)
  → useMutation gọi service
  → apiClient POST/PUT/PATCH/DELETE
  → backend validate + authorize + persist
  → hook onSuccess invalidate query key liên quan
  → React Query refetch
  → UI nhận dữ liệu mới
```

Toast, đóng modal và điều hướng nên do component xử lý; invalidation do hook xử lý; HTTP contract do service xử lý.

## 5. Quản lý state

### 5.1 Server state: TanStack React Query

`QueryProvider` tạo một `QueryClient` trên mỗi phiên browser với:

- `refetchOnWindowFocus: false`.
- `retry: false` mặc định; một vài query override riêng.
- Query/mutation được khai báo trong hook của feature.
- Sau mutation, hook gọi `invalidateQueries` để đồng bộ lại dữ liệu backend.

Quy tắc quan trọng cho multi-tenant:

```ts
[featureName, tenantId, resourceScope, filters]
```

`checkinKeys` và `attendanceKeys` làm đúng. `siteKeys`, `shiftKeys`, `geofenceKeys`, `assignmentKeys` hiện **không chứa tenantId**; nếu chuyển tenant trong cùng phiên, cache có thể va chạm khi ID/phạm vi trùng. Đây là khoản nợ kiến trúc cần ưu tiên sửa trước khi hoàn thiện multi-tenant switching.

### 5.2 Client/global state: Zustand

| Store thật | Dữ liệu | Persist |
|---|---|---|
| `src/stores/auth.store.ts` | user, role, permissions, tenantId, accessToken, auth flags | user + token được ghi thủ công vào `localStorage` |
| `src/stores/tenant.store.ts` | `activeTenant` dùng ở một số màn admin | Không |
| `features/customer/notification/stores/notification.store.ts` | list, unread count, event bus | Không |

Các `store/*.ts` rỗng trong nhiều feature không tham gia runtime. Không nên import nhầm chúng.

### 5.3 Local component state và URL state

- Modal open/close, selected record, filter tạm thời: `useState` tại component.
- `usePagination` đồng bộ page/size/search/sort với query string ở một số màn hình.
- Một số feature khác vẫn quản lý page/filter hoàn toàn trong `useState`; hành vi back/forward và chia sẻ URL vì vậy chưa đồng nhất.

## 6. HTTP, token và xử lý lỗi

`src/services/api-client.ts` là Axios instance duy nhất đang dùng thực tế:

1. `baseURL = NEXT_PUBLIC_API_URL`, timeout 30 giây.
2. Request interceptor đọc `fams_access_token` từ `localStorage` và gắn bearer token.
3. Response interceptor đổi `data.userMessage` thành `data.message` để các call site hiển thị tiếng Việt.
4. Khi nhận 401, chỉ request đầu gọi `/auth/refresh-token`; các request 401 đồng thời xếp hàng.
5. Refresh thành công: lưu cả access/refresh token mới, giải phóng queue và retry request gốc.
6. Refresh thất bại/không có token: xoá token, báo hết phiên, điều hướng `/login`.
7. Login/logout/refresh không tự refresh để tránh vòng lặp.

Rủi ro:

- Access và refresh token nằm trong `localStorage`, nên XSS có thể lấy cả hai. Nếu backend cho phép, kiến trúc production nên chuyển refresh token sang `HttpOnly; Secure; SameSite` cookie và giữ access token ngắn hạn trong memory.
- `DashboardLayout` chỉ kiểm tra state phía client. Đây là UX guard, không phải biên bảo mật.
- Backend phải enforce token, tenant, role, permission, ownership cho mọi endpoint.

## 7. Authentication, tenant và authorization

### 7.1 Authentication

Sau login thành công, UI không chỉ dùng response token mà còn:

1. Tạm lưu token để gọi `/auth/me`.
2. Gọi `/roles/me`.
3. `authMapper.toAuthUser()` giải JWT để lấy `isPlatformAdmin`, `tenantId`, role hiện tại.
4. Chọn membership trùng `tenantId`, không union permission của mọi tenant.
5. Lưu `AuthUser` vào Zustand/localStorage.
6. `resolvePostLoginRoute()` đưa platform admin tới admin dashboard; user không có tenant tới select-company; còn lại tới customer dashboard.

Email/số điện thoại + password, Google, Firebase phone OTP login và TOTP đều hội tụ về quá trình tạo `AuthUser` này.

### 7.2 Tenant context

Tenant hiện tại chủ yếu lấy từ `useAuthStore().user.tenantId`. Có hai cách truyền vào service đang cùng tồn tại:

- Cách rõ ràng: component → hook → service nhận `tenantId` argument (`attendance`, `site`, `shift`).
- Cách ẩn: service tự gọi `useAuthStore.getState()` (`employee`, `notification`, một phần role).

Cách truyền rõ ràng dễ test và tránh coupling hơn. Nên chuẩn hoá theo hướng đó.

### 7.3 RBAC trong frontend

Có ba tầng UI:

- `SIDEBAR_MENU.allowedRoles`: ẩn menu không phù hợp role.
- `RoleGuard.allowedRoles`: hiển thị 403 nếu truy cập page sai role.
- `hasPermission("resource:action")`: ẩn/disable nút create/update/delete.

Đây chỉ là kiểm soát giao diện. API vẫn phải từ chối request trái phép, kể cả người dùng gọi trực tiếp bằng DevTools/cURL.

## 8. UI architecture và design system

- Ant Design cung cấp table, modal, form control, tabs, message, theme token.
- `src/components/ui/Base*` bọc Ant Design để chuẩn hoá prop/style.
- `Form*` nối `react-hook-form` với Base UI.
- `DataTable`, `ListHeader`, `DetailHeader`, `ContentCard` là pattern cấp trang.
- Tailwind CSS dùng cho layout/spacing/responsive; `cn()` kết hợp `clsx` và `tailwind-merge`.
- `TenantThemeProvider` lấy tenant settings, inject `--brand-primary`, đồng thời cấu hình token Ant Design.

Điểm cần lưu ý: hiện có nhiều style inline/Tailwind dài trong feature component. Khi cùng pattern xuất hiện từ hai lần trở lên, nên nâng lên shared component thay vì tiếp tục copy.

## 9. Tích hợp đặc biệt

### Firebase Phone Auth

- Chỉ route đăng nhập nhanh `/login/phone` dùng Firebase SDK để gửi/xác minh OTP.
- Sau khi xác minh, client gửi Firebase ID token tới `POST /auth/otp/verify`.
- Firebase khởi tạo lazy; thiếu config không làm crash toàn bộ trang, chỉ lỗi khi người dùng thực hiện phone auth.

Đăng ký bằng số điện thoại là luồng khác: backend gửi OTP qua `POST /auth/register/send-otp`, sau đó frontend gửi `otpCode` vào `POST /auth/register`; không dùng Firebase ID token.

### Google OAuth

- `GoogleOAuthProvider` nằm trong auth layout.
- Google credential/ID token được gửi tới backend `/auth/login/google` để đổi thành token FAMS.

### Leaflet/geofence

- Map là browser-only, được bao qua client/dynamic component.
- Site detail kết hợp active geofence, history và editor; geofence mutation invalidate cả geofence cache lẫn site detail.

### Notification

- `NotificationWatcher` nằm trong dashboard shell, poll mỗi 30 giây.
- Store Zustand giữ unread count/items; watcher hiển thị toast khi latest ID thay đổi.
- `websocket.service.ts` đang rỗng, vì vậy hiện chưa có realtime socket thật.

## 10. Chất lượng, lỗi và fallback

- Root và từng vùng admin/customer có `loading.tsx`, `error.tsx`.
- Có `global-error.tsx`, `not-found.tsx`.
- React Query expose `isLoading/isError`; phần lớn component mới xử lý loading/empty, nhưng error handling giữa feature chưa đồng nhất.
- Axios chỉ normalize error message; toast nghiệp vụ thường được component tự hiển thị.
- CI chạy `npm ci → lint → typecheck → build` trên Node 20.
- Đã có Playwright E2E cho bốn nhóm auth trong `tests/e2e/auth.spec.ts`; các feature khác vẫn chưa có test tự động tương ứng.

## 11. Những bất nhất kiến trúc phải biết

| Hiện trạng | Tác động | Hướng chuẩn hoá |
|---|---|---|
| `admin/role` và `admin/role-permission` cùng quản lý `/roles`, `/permissions` | Hai model/hook/service cạnh tranh, dễ sửa một nơi quên nơi kia | Chọn một module canonical; migrate route cũ rồi xoá bản còn lại |
| `notification/store` và `notification/stores` | Import nhầm file rỗng | Giữ một thư mục `store/` hoặc `stores/`, cập nhật toàn bộ import |
| `src/lib/axios.ts` rỗng trong khi client ở `src/services/api-client.ts` | Người mới tìm nhầm | Xoá stub hoặc export rõ từ canonical file |
| Feature scaffolds rỗng hàng loạt | Tưởng feature đã tồn tại | Xoá file rỗng; dùng issue/backlog để biểu diễn kế hoạch |
| Response service lúc trả `ApiResponse<T>`, lúc trả trực tiếp `T` | Component phải nhớ nhiều shape (`data.data` so với `data`) | Quy ước service luôn unwrap về domain `T/PageResponse<T>` |
| Tenant có lúc truyền explicit, có lúc đọc store trong service | Coupling/test khó | Hook/service nhận tenantId rõ ràng |
| Một số query key thiếu tenantId | Cache leak/collision khi switch tenant | TenantId là phần bắt buộc của mọi tenant-scoped key |
| Page có nơi rất mỏng, có nơi orchestration dày | Khó test/tái sử dụng | Page chỉ compose; workflow lớn chuyển vào feature component/hook |
| Route settings tenant cũ và canonical cùng tồn tại | Người mới không biết route đúng | Giữ redirect ngắn hạn, dùng `/customer/settings/tenant` duy nhất trong code |

## 12. Kiến trúc mục tiêu nên giữ khi phát triển tiếp

```text
app/<route>/page.tsx
  └── FeaturePage.tsx
      ├── shared UI / feature child components
      ├── useFeatureQuery({ tenantId, filters })
      └── useFeatureMutation()
          └── featureService (typed, unwrap response)
              └── apiClient

types + schema + mapper đặt cạnh feature
server state = React Query
client-only state = local state hoặc Zustand khi thực sự cross-page
authorization cuối cùng = backend
```

Không thêm một abstraction mới chỉ vì có một call site. Lớp mới phải có trách nhiệm rõ, giảm coupling hoặc chuẩn hoá hành vi đang lặp lại.
