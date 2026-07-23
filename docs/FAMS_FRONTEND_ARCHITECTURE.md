# Tài liệu kiến trúc và tính năng FAMS Frontend Web

> Phạm vi rà soát: toàn bộ mã nguồn trong `src/`, cấu hình root, dependency đã cài và hướng dẫn Next.js 16 đi kèm `node_modules`.  
> Thời điểm đánh giá: 23/07/2026.  
> Đây là tài liệu **as-built** (mô tả những gì thực sự có trong code), không phải thiết kế mong muốn.

## 1. Tóm tắt điều hành

FAMS Frontend là một ứng dụng Next.js App Router chủ yếu chạy logic nghiệp vụ ở client. Mã nguồn tổ chức theo domain dưới `src/features/{admin|customer}`, mỗi feature thường có `components`, `hooks`, `services`, `types`, `schemas`, `store` và `utils`.

Luồng phổ biến:

```text
Browser page
  → feature component
    → React Query hook (hoặc gọi service trực tiếp ở một số module)
      → feature service
        → Axios apiClient
          → /api/v1/*
            → Next.js rewrite
              → Backend http://localhost:8080/api/v1/*
```

Ứng dụng có nền tảng tốt về chia domain, type-safe form, API client tập trung và cache invalidation. Đợt chuẩn hóa đầu tiên đã làm xanh TypeScript, ESLint và production build; sửa proxy GET/POST, contract type chính và đưa attendance/check-in qua React Query. Tuy nhiên trạng thái hiện tại vẫn chưa production-ready vì:

- ESLint còn 209 cảnh báo cần xử lý dần, chủ yếu là `any`, biến không dùng và `<img>` chưa tối ưu.
- 102/327 file trong `src` đang rỗng; nhiều module chỉ là scaffold.
- Một số route nghiệp vụ vẫn là scaffold/placeholder nhưng đã được ẩn khỏi điều hướng chính; dashboard không còn hiển thị số liệu giả.
- Token được giữ trong `localStorage`; bảo vệ route/role chủ yếu ở client.
- Cùng một kiểu nghiệp vụ đang có nhiều implementation song song (role, notification store, settings route, server-state pattern).
- Đã có CI lint/typecheck/build và route loading/error/not-found chuẩn hóa; chưa có automated test hoặc deployment/container config.

## 2. Kiến trúc hệ thống

### 2.1 Các lớp thực tế

| Lớp | Vị trí | Trách nhiệm |
|---|---|---|
| Routing/composition | `src/app` | Khai báo URL, metadata, layout và ghép feature component |
| Layout/provider | `src/layouts`, `src/providers`, `src/lib/QueryProvider.tsx` | Shell dashboard, auth initialization, notification polling, Ant Design theme, Query Client |
| Feature UI | `src/features/**/components` | Form, table, modal, tab và tương tác người dùng |
| Server-state orchestration | `src/features/**/hooks`, `src/hooks` | Query/mutation, query key, cache invalidation, pagination/debounce |
| Domain API | `src/features/**/services` | Endpoint theo nghiệp vụ và mapping response envelope |
| HTTP/auth infrastructure | `src/services/api-client.ts`, `auth-token.service.ts` | Base URL, bearer token, refresh token, normalize lỗi, logout khi hết phiên |
| Client/global state | `src/stores`, một số feature `store(s)` | User/session đã hydrate, tenant đang chọn, notification UI state |
| Contract/validation | `types`, `schemas` | TypeScript contracts và Zod schemas |
| Shared presentation | `src/components` | Base UI, form adapters, table, map và guard |

Đây là **feature-based layered frontend**, chưa phải Clean Architecture nghiêm ngặt: component ở một số nơi gọi thẳng service, service đọc Zustand trực tiếp, domain admin/customer có import chéo, và nhiều type/API shape chưa thống nhất.

### 2.2 Runtime composition

```text
RootLayout
├── QueryProvider (TanStack Query)
└── TenantThemeProvider (Ant Design ConfigProvider)
    ├── Auth route group `(auth)` → auth layout → auth form
    ├── `/admin/*` → DashboardLayout → Sidebar + Header + page
    └── `/customer/*` → DashboardLayout → Sidebar + Header + page
                                      └── NotificationWatcher (poll 30 giây)
```

- `RootLayout` đặt ngôn ngữ tài liệu là `vi` và dùng system font stack để build/deploy không phụ thuộc tải font bên ngoài.
- `TenantThemeProvider` gọi tenant settings khi có `tenantId`, rồi đưa `brandPrimaryColor` vào Ant Design và CSS variable.
- Hai layout `/admin` và `/customer` dùng chung `DashboardLayout`.
- `DashboardLayout` hydrate auth từ `localStorage`; nếu chưa đăng nhập thì điều hướng `/login`.
- `RoleGuard` lọc UI theo `SystemRole`; backend vẫn phải là nơi thực thi authorization cuối cùng.

### 2.3 Server và client component

Các page đơn giản mặc định là Server Component và chỉ render feature component. Những page cần hook/router/store có `"use client"`. Phần lớn feature component là Client Component vì dùng form, Ant Design, Zustand và React Query.

Hiện không có server-side business data fetching, Server Action hoặc BFF Route Handler cho nghiệp vụ. Route Handler duy nhất là `GET /api/health`.

### 2.4 Multi-tenancy và phân quyền

- Role hệ thống: `PLATFORM_ADMIN`, `TENANT_ADMIN`, `HR_MANAGER`, `SITE_SUPERVISOR`, `EMPLOYEE`.
- Sau đăng nhập, frontend lấy `/auth/me`, `/roles/me`, decode JWT rồi tạo `AuthUser` gồm role, tenantId và permissions.
- Hầu hết endpoint customer nằm dưới `/tenants/{tenantId}/...`.
- Sidebar lọc menu theo role; một số page bọc `RoleGuard`.
- `hasPermission()` có trong auth store nhưng phần lớn UI hiện dùng role-level guard thay vì permission-level guard.
- `select-company` cũ đã bỏ dữ liệu giả và chuyển về dashboard. Hệ thống hiện vẫn chưa hỗ trợ chuyển tenant thật vì chưa có API membership/active-tenant.

## 3. Cấu trúc thư mục

```text
fams-front-web-project/
├── public/                         # Ảnh và static asset
├── docs/                           # Tài liệu as-built chính
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── (auth)/                 # /login, /register, reset, invite
│   │   ├── admin/                  # Khu vực Platform Admin
│   │   ├── customer/               # Khu vực tenant/customer
│   │   └── api/health/route.ts     # Health endpoint của frontend
│   ├── features/
│   │   ├── admin/                  # tenant, subscription, role, role-permission...
│   │   └── customer/               # auth, employee, workspace, site, attendance...
│   ├── components/                 # Shared UI/form/table/map/guard
│   ├── layouts/                    # Dashboard shell, header, sidebar
│   ├── providers/                  # Tenant theme
│   ├── services/                   # API client, token, user; một số stub
│   ├── stores/                     # Auth/tenant/global Zustand stores
│   ├── hooks/                      # Pagination, debounce, user search
│   ├── types/                      # API envelope và shared types
│   ├── config/                     # Menu; `env.ts` hiện rỗng
│   ├── constants/                  # Routes, app name, colors; một số stub
│   ├── schemas/                    # Shared schemas, hiện phần lớn rỗng
│   ├── lib/                        # Query provider, Firebase; nhiều file stub
│   ├── utils/                      # Formatting/mapping helpers
│   └── proxy.ts                    # Chỉ redirect GET link email; POST tiếp tục tới backend
├── next.config.ts                  # Backend rewrite
├── package.json / package-lock.json
├── tsconfig.json                   # strict, noEmit, alias @/*
├── eslint.config.mjs               # Next core-web-vitals + TypeScript
└── postcss.config.mjs              # Tailwind CSS v4
```

### 3.1 Feature modules

| Nhóm | Module | Trạng thái thực tế |
|---|---|---|
| Admin | `tenant` | Có API/UI cho list, create, update, settings, IP whitelist, trạng thái tenant |
| Admin | `subscription` | Có plan, limit và tenant subscription |
| Admin | `role`, `role-permission` | Đều có implementation, đang trùng phạm vi |
| Admin | `dashboard`, `report` | Phần lớn file rỗng; page dashboard dùng code trực tiếp, report là placeholder |
| Customer | `auth` | Email/password, Google, Firebase phone, reset password, TOTP, logout |
| Customer | `employee` | CRUD, import/export, invitation, role UI, Face ID revoke |
| Customer | `workspace` | Tree/list/detail, create/update, member add/transfer; remove mới có service |
| Customer | `site`, `geofence`, `shift`, `assignment` | Tích hợp API và UI trong trang chi tiết site |
| Customer | `checkin`, `attendance` | List/detail, summary/monthly/export qua typed React Query hooks |
| Customer | `notification` | List/bell/read state và polling; watcher dùng filter object đúng contract |
| Customer | `report` | Báo cáo Face ID enrollment đã có API/UI |
| Customer | `setting` | UI có thật nhưng dùng auth hooks; feature service/hook riêng đang rỗng |
| Customer | `random-check`, `violation` | Scaffold rỗng hoặc page placeholder; không còn xuất hiện trong menu |
| Customer | `dashboard` | Tổng quan theo vai trò, số nhân viên từ API và lối tắt nghiệp vụ |

### 3.2 Vấn đề tổ chức nổi bật

- `src/features/admin/role` và `role-permission` cùng thao tác `/roles`, `/permissions`.
- Có cả `notification/store` và `notification/stores`; bản `store` đang rỗng.
- Shared `types`, `schemas`, `lib`, `services` có nhiều file rỗng nhưng tên khiến người đọc tưởng đã triển khai.
- Hai route cấu hình tenant (`/customer/settings/tenant` và `/customer/tenant-settings`) bị chồng phạm vi.
- `src/lib/axios.ts` rỗng trong khi Axios thật nằm ở `src/services/api-client.ts`.

## 4. Môi trường và thư viện

### 4.1 Toolchain

| Thành phần | Version/config |
|---|---|
| Next.js | 16.2.9, App Router, Turbopack mặc định |
| React / React DOM | 19.2.4 |
| TypeScript | 5.x (`strict: true`, `noEmit: true`) |
| Node.js | Next 16 yêu cầu >= 20.9; máy kiểm tra dùng 24.18.0 |
| npm | Máy kiểm tra dùng 11.16.0 |
| ESLint | 9.x + `eslint-config-next` 16.2.9 |
| Styling | Tailwind CSS 4 + PostCSS + Ant Design 6.4.4 |

`package.json` chưa khai báo `engines` hoặc file quản lý version Node (`.nvmrc`, `.node-version`). Nên cố định Node 20 LTS hoặc 22 LTS cho local/CI để tránh “works on my machine”.

### 4.2 Dependency theo trách nhiệm

| Nhóm | Thư viện | Cách dùng |
|---|---|---|
| Server state | `@tanstack/react-query` | Query/mutation/cache invalidation; global retry tắt |
| Client state | `zustand` | Auth, tenant active, notification count/items |
| HTTP | `axios` | API client, bearer token, refresh queue, blob upload/export |
| Form | `react-hook-form`, `@hookform/resolvers`, `zod` | Form state và schema validation |
| UI | `antd`, `@ant-design/icons`, `lucide-react` | Table/modal/form/theme/icon |
| CSS | `tailwindcss`, `tailwind-merge`, `clsx` | Utility classes và class merge |
| Auth ngoài | `@react-oauth/google`, `firebase`, `jwt-decode` | Google ID token, Firebase SMS/ID token, đọc JWT claims |
| Map | `leaflet`, `react-leaflet` | Chọn vị trí và hiển thị geofence |
| Data viz | `recharts` | Đã cài nhưng dashboard chart feature hiện chưa triển khai |
| Date | `date-fns`; Ant Design kéo `dayjs` gián tiếp | `dayjs` đang được import trực tiếp nhưng không khai báo dependency trực tiếp |

Khuyến nghị thêm `dayjs` vào `dependencies` nếu tiếp tục import trực tiếp; không nên dựa vào transitive dependency của Ant Design.

### 4.3 Biến môi trường

| Biến | Mục đích | Bắt buộc khi nào |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Axios base URL, local hiện theo `/api/v1` | Mọi chức năng backend |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google OAuth Provider | Đăng nhập Google |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase app | Login/register bằng phone |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase auth domain | Login/register bằng phone |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase project | Login/register bằng phone |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase app ID | Login/register bằng phone |

Repository có `.env.example` chỉ chứa tên/placeholder. Các biến `NEXT_PUBLIC_*` là public ở browser bundle, không đặt client secret hoặc private key vào đây.

## 5. Routing và tính năng theo page

### 5.1 Auth/public

| Route | Page/component chính | Luồng backend | Trạng thái |
|---|---|---|---|
| `/` | server redirect | Không | Chuyển `/login` |
| `/login` | `LoginForm` | login → me → roles/me → store → dashboard | Có email, Google, TOTP |
| `/login/phone` | `PhoneLoginForm` | Firebase SMS → Firebase ID token → `/auth/otp/verify` | Có code; phụ thuộc Firebase config |
| `/register` | `RegisterForm` | email/phone register; phone dùng Firebase ID token | Có code |
| `/forgot-password` | `ForgotPasswordForm` | POST forgot password | Có code |
| `/reset-password` | `ResetPasswordForm` | POST reset password | Có code; proxy chỉ redirect GET nên POST đi tới backend |
| `/accept-invite?token=` | page tự orchestration | validate → accept → me → roles/me | Có code, logic page quá dày |

`src/proxy.ts` chuyển các link GET `/api/v1/invitations/accept?token=...` và `/api/v1/auth/reset-password?token=...` sang page tương ứng, giữ nguyên query string. Request không phải GET được `NextResponse.next()` để tiếp tục qua rewrite tới backend. Cách này tránh redirect nhầm POST và dùng đúng convention `proxy` của Next.js 16.

### 5.2 Platform Admin

| Route | UI chính | Service/API | Trạng thái |
|---|---|---|---|
| `/admin/dashboard` | Khu vực quản trị theo vai trò | Không | Không hiển thị số liệu giả; cần platform dashboard endpoint nếu bổ sung thống kê |
| `/admin/tenants` | `TenantListPage`, `CreateTenantModal` | tenant + user search + role/invite | Tích hợp backend |
| `/admin/tenants/[id]` | `TenantDetailPage` | tenant settings, IP, subscription | Tích hợp; thông tin cơ bản dựa vào Zustand active tenant |
| `/admin/plans` | `PlanListPage` | plan CRUD và limits | Tích hợp backend |
| `/admin/settings/roles` | `RoleManagementPage` | roles, permissions, user-role | Tích hợp nhưng trùng module `role` |
| `/admin/settings/roles/create` | `RoleForm` | role create + permission matrix | Có route song song với modal flow |
| `/admin/settings/roles/[id]` | `RoleForm` | role detail/update | Có route song song với modal flow |
| `/admin/reports` | placeholder card | Không | Chưa triển khai |

### 5.3 Customer/Tenant

| Route | UI chính | Service/API | Trạng thái |
|---|---|---|---|
| `/customer/dashboard` | Tổng quan theo vai trò, truy cập nhanh, nhân viên gần nhất | employee list | Tổng nhân viên lấy từ API; chưa có dashboard aggregate API riêng |
| `/customer/employees` | `EmployeeTabs` | employee + invitation | Tích hợp list, import/export, status, invite |
| `/customer/employees/create` | `EmployeeForm` | create employee | Tích hợp; back link dùng route customer chuẩn |
| `/customer/employees/[id]` | form + roles + Face ID tabs | employee detail/update, user-role, revoke face | Tích hợp; contract role assignment đã được đồng bộ |
| `/customer/workspaces` | `WorkspacePage` | workspace tree/members | Tích hợp một phần; remove chưa nối UI/hook |
| `/customer/sites` | `SitePage` | sites list/create/update | Tích hợp backend |
| `/customer/sites/create` | placeholder | Không | Chưa triển khai; tạo site thực tế dùng modal ở list page |
| `/customer/sites/[id]` | geofence + shift + assignment tabs | 4 feature services | Tích hợp backend |
| `/customer/attendance` | checkin/summary/monthly tabs | checkin + attendance + export | Tích hợp qua tenant-aware React Query hooks |
| `/customer/notifications` | `NotificationPage` | notifications/read/read-all | Tích hợp; watcher polling đúng service contract |
| `/customer/reports/face-id-enrollment` | report table | Face ID enrollment report | Tích hợp backend |
| `/customer/settings` | `ProfileSettingForm` | auth/me PATCH | Tích hợp backend |
| `/customer/settings/password` | `ChangePasswordForm` | auth/change-password | Tích hợp backend |
| `/customer/settings/totp` | `TotpSettingForm` | TOTP setup/verify/disable | Tích hợp backend |
| `/customer/settings/sessions` | `SessionManagement` | logout all | Chưa có API list/revoke từng session |
| `/customer/settings/tenant` | `TenantSettingsPage` | tenant settings | Tích hợp một phần |
| `/customer/tenant-settings` | tenant info/settings/IP tabs | tenant services | Tích hợp nhưng trùng route trên |
| `/customer/select-company` | redirect về dashboard | Không | Đã bỏ mock; chờ API memberships để hỗ trợ chuyển công ty thật |
| `/customer/random-checks` | placeholder | Không | Chưa triển khai |
| `/customer/violations` | placeholder | Không | Chưa triển khai |

## 6. Luồng API và chuyển nghiệp vụ thành giao diện

### 6.1 HTTP client chung

`src/services/api-client.ts` tạo Axios instance:

- `baseURL = NEXT_PUBLIC_API_URL`.
- Timeout 30 giây, JSON mặc định.
- Request interceptor đọc access token từ `localStorage`, gắn `Authorization: Bearer ...`.
- Response interceptor ưu tiên `userMessage` của backend cho toast.
- Khi 401, chỉ một request gọi refresh; các request 401 đồng thời vào queue rồi retry bằng token mới.
- Login/logout/refresh endpoint không tự refresh để tránh lặp vô hạn.
- Refresh thất bại sẽ xóa token, hiển thị message và chuyển `/login`.

Điểm cần lưu ý: refresh token trong `localStorage` giảm độ phức tạp nhưng tăng hậu quả nếu có XSS. Phương án an toàn hơn là refresh token trong `HttpOnly; Secure; SameSite` cookie và access token ngắn hạn chỉ giữ trong memory.

### 6.2 Ví dụ luồng đăng nhập

```text
/login
  → LoginForm
    → useLogin mutation
      → authService.login() → POST /auth/login
    → authService.getProfile() → GET /auth/me
    → rolePermissionService.getMyRoles() → GET /roles/me
    → authMapper (profile + JWT claims + roles)
    → auth store + localStorage
    → getDashboardRoute(role)
```

Nếu backend trả `totpRequired`, form chuyển sang bước nhập TOTP và gọi `POST /auth/login/totp`. Google login gửi Google ID token đến `POST /auth/login/google`. Phone login gửi SMS trực tiếp qua Firebase Client SDK, sau đó backend chỉ verify Firebase ID token.

### 6.3 Ví dụ luồng danh sách nhân viên

```text
/customer/employees
  → EmployeeTabs
    → EmployeeListPage
      → useEmployees(params)
        → employeeService.listEmployees(params)
          → GET /tenants/{tenantId}/employees
      → DataTable
```

Filter/pagination được giữ trên URL bởi `usePagination`; search được debounce; mutation create/update/status/import sẽ invalidate query key `employees` để tải lại danh sách.

### 6.4 Ví dụ luồng chi tiết công trình

```text
/customer/sites/{siteId}
  ├── useSiteDetailQuery → site detail + ActiveGeofenceCard
  ├── ShiftManagementTab → useShiftsQuery → shiftService
  ├── AssignmentManagementTab → useAssignments → assignmentService
  └── GeofenceHistoryTab → useGeofenceHistoryQuery → geofenceService
```

Create/update mutation invalidate cả collection query và site detail query. Đây là implementation server-state rõ nhất trong dự án.

### 6.5 Ví dụ luồng chấm công hiện tại

```text
/customer/attendance
  → Tabs
    ├── CheckinListTab → useCheckins → checkinService
    ├── AttendanceSummaryTab → useAttendanceSummary → attendanceService
    └── AttendanceMonthlyTab → useMonthlyAttendance/useAttendanceExport
                                  → attendanceService + tải Blob Excel
```

Các query key đều chứa `tenantId` và filter. Component nhận `data/isLoading/error` từ React Query thay vì tự gọi service trong `useEffect`; export vẫn là mutation riêng vì tạo tác vụ tải file theo hành động người dùng.

### 6.6 Thông báo

- Bell và trang notification gọi service theo filter object.
- Zustand giữ unread count/items cho phối hợp UI.
- `NotificationWatcher` poll 30 giây và toast khi ID mới xuất hiện.
- `websocket.service.ts` đang rỗng; hệ thống chưa có WebSocket/SSE thực tế.
- Watcher đã gọi đúng signature `{ page, size, unreadOnly }`; polling hiện vẫn dựa trên interval thay vì realtime transport.

## 7. Danh mục API frontend đang gọi

Các path dưới đây được nối với `NEXT_PUBLIC_API_URL` (local là `/api/v1`).

### 7.1 Authentication và user

| Method | Path | Mục đích |
|---|---|---|
| POST | `/auth/register` | Đăng ký email/phone |
| POST | `/auth/login` | Login email/password |
| POST | `/auth/login/totp` | Bước 2 TOTP |
| POST | `/auth/otp/verify` | Verify Firebase ID token |
| POST | `/auth/forgot-password` | Gửi reset link |
| POST | `/auth/reset-password` | Đặt mật khẩu mới |
| POST | `/auth/login/google` | Login bằng Google ID token |
| GET/PATCH | `/auth/me` | Lấy/cập nhật profile |
| POST | `/auth/logout` | Logout session hiện tại |
| POST | `/auth/logout/all` | Logout mọi thiết bị |
| POST | `/auth/change-password` | Đổi mật khẩu |
| POST | `/auth/totp/setup` | Tạo QR/setup token |
| POST | `/auth/totp/verify` | Bật TOTP |
| POST | `/auth/totp/disable` | Tắt TOTP |
| POST | `/auth/refresh-token` | Refresh token do interceptor gọi |
| GET | `/users` | Platform admin tìm user |

### 7.2 Employee và invitation

| Method | Path | Mục đích |
|---|---|---|
| GET/POST | `/tenants/{tenantId}/employees` | List/create employee |
| GET/PATCH | `/tenants/{tenantId}/employees/{id}` | Detail/update |
| PATCH | `/tenants/{tenantId}/employees/{id}/status` | Đổi trạng thái |
| GET | `/tenants/{tenantId}/employees/export` | Export Excel |
| POST | `/tenants/{tenantId}/employees/import` | Import Excel multipart |
| DELETE | `/tenants/{tenantId}/employees/{id}/face-id` | Revoke Face ID |
| GET/POST | `/tenants/{tenantId}/invitations` | List/send invite |
| DELETE | `/tenants/{tenantId}/invitations/{id}` | Hủy invite |
| GET | `/invitations/validate?token=...` | Validate public token |
| POST | `/invitations/accept` | Accept invite |

### 7.3 Workspace

| Method | Path | Mục đích |
|---|---|---|
| GET/POST | `/tenants/{tenantId}/workspaces` | List/create |
| GET | `/tenants/{tenantId}/workspaces/tree` | Cây phòng ban |
| GET/PUT | `/tenants/{tenantId}/workspaces/{workspaceId}` | Detail/update |
| GET/POST | `/tenants/{tenantId}/workspaces/{workspaceId}/members` | List/add member |
| POST | `/tenants/{tenantId}/workspaces/{workspaceId}/members/{memberId}/transfer` | Chuyển phòng ban |
| DELETE | `/tenants/{tenantId}/workspaces/{workspaceId}/members/{memberId}` | Xóa member; chưa nối hook/UI |

### 7.4 Site, geofence, shift và assignment

| Method | Path | Mục đích |
|---|---|---|
| GET/POST | `/tenants/{tenantId}/sites` | List/create site |
| GET/PUT | `/tenants/{tenantId}/sites/{siteId}` | Detail/update site |
| GET/POST | `/tenants/{tenantId}/sites/{siteId}/geofences` | History/create geofence |
| GET/PUT | `/tenants/{tenantId}/sites/{siteId}/geofences/active` | Active/update geofence |
| GET/POST | `/tenants/{tenantId}/sites/{siteId}/shifts` | List/create shift |
| PUT | `/tenants/{tenantId}/sites/{siteId}/shifts/{shiftId}` | Update shift |
| PUT | `/tenants/{tenantId}/sites/{siteId}/shifts/{shiftId}/ot-config` | Cấu hình OT |
| GET/POST | `/tenants/{tenantId}/sites/{siteId}/assignments` | List/create assignment |
| PUT/DELETE | `/tenants/{tenantId}/sites/{siteId}/assignments/{id}` | Update/cancel assignment |

### 7.5 Attendance, report và notification

| Method | Path | Mục đích |
|---|---|---|
| GET | `/tenants/{tenantId}/checkins` | List check-in/out |
| GET | `/tenants/{tenantId}/checkins/{id}/detail` | Evidence/detail |
| GET | `/tenants/{tenantId}/attendance` | Attendance summaries |
| GET | `/tenants/{tenantId}/attendance/monthly` | Bảng công tháng |
| GET | `/tenants/{tenantId}/reports/attendance/export` | Export Excel |
| GET | `/tenants/{tenantId}/reports/face-id/enrollment` | Face ID enrollment report |
| GET | `/tenants/{tenantId}/notifications` | List + unread count |
| PATCH | `/tenants/{tenantId}/notifications/{id}/read` | Mark read |
| PATCH | `/tenants/{tenantId}/notifications/read-all` | Mark all read |

### 7.6 Tenant, plan, role và permission

| Method | Path | Mục đích |
|---|---|---|
| GET/POST | `/tenants` | List/create tenant |
| PATCH | `/tenants/{id}` | Update tenant |
| GET/PATCH | `/tenants/{id}/settings` | Read/update tenant settings |
| GET/POST | `/tenants/{id}/ip-whitelists` | List/add IP |
| PATCH/DELETE | `/tenants/{id}/ip-whitelists/{entryId}` | Toggle/update/delete IP |
| POST | `/tenants/{id}/suspend` | Suspend |
| POST | `/tenants/{id}/reactivate` | Reactivate |
| POST | `/tenants/{id}/cancel` | Cancel |
| GET/POST/PATCH | `/tenants/{id}/subscription` | Read/assign/update subscription |
| GET/POST | `/plans` | List/create plan |
| PATCH | `/plans/{id}` | Update plan |
| GET/PATCH | `/plans/{id}/limits` | Read/update limits |
| GET/POST | `/roles` | List/create role |
| GET/PUT/DELETE | `/roles/{id}` | Detail/update/delete role |
| GET | `/permissions` | Permission matrix |
| GET | `/roles/me` | Role của user hiện tại |
| POST | `/user-roles` | Gán role |
| DELETE | `/user-roles/{id}` | Thu hồi role |

## 8. Quản lý state, cache và dữ liệu

### 8.1 Zustand

- `auth.store.ts`: user, access token mirror, auth initialization, TOTP pending, permission helper.
- `tenant.store.ts`: tenant đang xem ở màn Platform Admin; không persist.
- `notification/stores/notification.store.ts`: unread count, list và event bus.
- Nhiều global/feature store khác đang rỗng.

### 8.2 React Query

- Query Client: `refetchOnWindowFocus: false`, `retry: false` mặc định.
- Các mutation phần lớn invalidate collection/detail tương ứng.
- Attendance/check-in đã có query key chứa `tenantId`; các module khác chưa dùng một query-key factory toàn cục nên vẫn có nguy cơ cache chéo tenant khi bổ sung switch tenant thật.
- Tenant service đã bỏ fallback UUID và fail-fast khi thiếu tenant. Một số hook như `useIpWhitelists` vẫn cần `enabled` guard để không tạo query lỗi khi context chưa hydrate.

### 8.3 Pagination và response envelope

Backend được giả định trả:

```ts
type ApiResponse<T> = { success: boolean; message: string; data: T };
type PageResponse<T> = {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
};
```

Riêng notification có page response dùng `items` thay vì `content`. Sự khác biệt này được khai báo riêng nhưng làm tăng chi phí tích hợp. Nên chuẩn hóa contract từ backend hoặc map về một UI model chung tại service boundary.

## 9. Đánh giá ưu điểm

| Ưu điểm | Giá trị |
|---|---|
| Chia domain admin/customer rõ | Dễ tìm code theo nghiệp vụ và phân quyền |
| Page phần lớn mỏng | Routing tách khỏi feature UI ở các module hoàn thiện |
| API client tập trung | Bearer token, refresh queue và error message xử lý một chỗ |
| React Query mutation invalidation | Dữ liệu list/detail được làm mới sau thao tác |
| TypeScript strict + Zod/RHF | Nền tảng tốt để kiểm soát contract và form |
| Tenant-scoped URL | Ranh giới multi-tenant thể hiện rõ trong API |
| UI component dùng lại | Base input/select/modal/table và layout giảm lặp |
| Site detail composition tốt | Site/geofence/shift/assignment tách module nhưng ghép tự nhiên trên một page |
| Firebase được khởi tạo lazy | Thiếu config phone auth không làm crash toàn bộ auth page |
| Theme theo tenant | Backend settings có thể điều khiển Ant Design primary color |

## 10. Đánh giá nhược điểm và rủi ro

Các hạng mục đã xử lý trong đợt đầu:

- Sửa toàn bộ lỗi TypeScript đang chặn build; không dùng `as any` để che các contract được sửa.
- Sửa import shared response, notification signature, employee role/status và các type Ant Design/React Query liên quan.
- Thay `middleware.ts` bằng `proxy.ts`; chỉ redirect GET để POST reset-password/invitation tiếp tục tới backend.
- Bỏ tenant UUID fallback; dashboard không gọi employee API khi thiếu tenant context.
- Chuyển attendance/check-in sang tenant-aware React Query hooks.
- Thêm `.env.example`, script `typecheck`/`check` và GitHub Actions cho lint, typecheck, build.
- Bổ sung dashboard shell responsive, mobile drawer, skip link/focus state, route loading/error/not-found và trạng thái rỗng dùng chung.
- Xóa số liệu dashboard hard-code, luồng chọn công ty giả và ẩn các feature placeholder khỏi menu.
- Hợp nhất route cấu hình công ty về `/customer/settings/tenant`, nối đúng tenant hiện tại và đưa cấu hình hiển thị/IP whitelist vào cùng giao diện.

Các rủi ro còn mở:

| Mức | Vấn đề | Tác động | Khắc phục ngắn gọn |
|---|---|---|---|
| P0 | Token/refresh token ở localStorage | XSS có thể chiếm toàn bộ phiên | Chuyển refresh token sang HttpOnly cookie, CSP và sanitize |
| P0 | Authorization chính ở client | URL trực tiếp có thể vượt UI guard nếu backend lỏng | Backend enforce role/permission/tenant cho mọi endpoint |
| P1 | 102 file rỗng và feature giả | Hiểu sai mức hoàn thiện, tăng maintenance | Xóa stub không dùng hoặc ghi trạng thái/backlog rõ |
| P1 | Dashboard nền tảng chưa có API thống kê | Chưa có số liệu tổng quan cấp platform | Tạo dashboard API/service/hook; chỉ hiển thị số liệu đã xác thực |
| P1 | Admin dashboard thiếu API platform | Số liệu tổng quan chưa phản ánh nghiệp vụ | Tạo platform dashboard endpoint thay vì tenant employee API |
| P1 | Chưa có chuyển đổi multi-tenant thực | Người có nhiều membership chưa thể đổi công ty | API memberships, set active tenant, reset tenant-scoped cache |
| P1 | Role có hai implementation | Bug và contract drift | Chọn một module canonical, migrate rồi xóa module còn lại |
| P1 | Service pattern không nhất quán | Loading/error/cache khó kiểm soát | Mọi page dùng typed React Query hook; component không gọi service trực tiếp |
| P1 | Query key thiếu tenantId | Cache có thể lẫn dữ liệu | Key chuẩn: `[domain, tenantId, resourceId, params]` |
| P1 | Chưa có test suite | CI chỉ bắt lint/type/build, chưa bắt regression nghiệp vụ | Unit + component + E2E smoke rồi thêm test vào workflow |
| P2 | `dayjs` là dependency gián tiếp | Upgrade AntD có thể làm mất module | Khai báo trực tiếp hoặc chuyển hoàn toàn sang date-fns |
| P2 | 209 lint warnings, nhiều `any` | Contract vẫn có vùng mất type safety | Giảm warning theo feature; sau đó bật lại `no-explicit-any` thành error |
| P2 | Assets remote `<img>` | Chưa tối ưu kích thước và layout shift | Dùng `next/image`, cấu hình domains/loader hoặc lưu asset nội bộ |
| P2 | File `docker` rỗng, thiếu deployment config | Không có đường deploy lặp lại | Dockerfile/compose hoặc bỏ file gây hiểu nhầm |

## 11. Kết quả kiểm chứng kỹ thuật

Đã chạy trực tiếp trên repository:

| Lệnh | Kết quả |
|---|---|
| `npm ls --depth=0` | Pass; dependency tree đã cài hợp lệ |
| `npm run typecheck` | Pass; TypeScript strict không còn lỗi |
| `npm run lint` | Pass; 0 error, còn 209 warning |
| `npx next build --webpack` | Pass; compile, typecheck và sinh 34 route thành công. Turbopack bị giới hạn bind cổng phụ trong sandbox kiểm tra. |

Nhóm lỗi TypeScript đã được xử lý:

- Export type `StatusBadgeProps` không tồn tại.
- Ant Design prop/type thay đổi (`Select` boolean value, `Timeline` orientation, column alignment, DatePicker union).
- Attendance/checkin import sai module shared type.
- Employee response/UI không đồng bộ (`roles`, `createdAt`, optional role name).
- Pagination invitation dùng trường `email` không có trong `PaginationState`.
- Notification watcher gọi service sai signature.
- Workspace truyền `null` vào API yêu cầu `string | undefined`.
- Lucide icon dynamic indexing không type-safe.

Next.js không còn cảnh báo convention `middleware`; output build nhận diện `Proxy (Middleware)` đúng như tài liệu Next.js 16.

## 12. Kế hoạch khắc phục đề xuất

### Giai đoạn P0 — làm build xanh và đóng lỗ hổng phiên

- [x] Sửa lỗi module/type nền: shared response, `StatusBadgeProps`, notification signature.
- [x] Sửa toàn bộ lỗi TypeScript đang chặn build theo từng feature.
- [x] Đồng bộ contract frontend cho employee roles, tenant status, pagination và notification.
- [x] Tạo CI tối thiểu: `npm ci` → lint → typecheck → build.
- [ ] Chốt contract trên với backend/OpenAPI bằng integration test.
- [ ] Chuyển refresh token sang HttpOnly cookie nếu backend hỗ trợ; tối thiểu bổ sung CSP nghiêm ngặt và security review XSS.
- [ ] Xác nhận backend enforce tenant/role/permission cho mọi endpoint.
- [ ] Thêm và chạy login/refresh/logout smoke test.

Điều kiện hoàn tất P0: build/type/lint đã đạt; phần security backend và smoke test vẫn còn mở.

### Giai đoạn P1 — chuẩn hóa kiến trúc và hoàn thiện luồng chính

- [x] Áp dụng flow `page → component → typed hook → service → apiClient` cho attendance/check-in.
- [x] Thêm tenant-aware query keys cho attendance/check-in.
- [x] Xóa fallback tenant UUID.
- [x] Đổi `middleware.ts` → `proxy.ts` và chỉ redirect GET.
- [ ] Chuyển các module còn gọi service trực tiếp về typed React Query hooks.
- [ ] Chuẩn hóa query key có tenantId toàn dự án và clear cache khi switch tenant/logout.
- [ ] Hợp nhất `role` với `role-permission`; hợp nhất notification store và tenant settings route.
- [x] Xóa mock company selection; route cũ chuyển về dashboard.
- [x] Xóa số liệu dashboard giả; ẩn menu placeholder random-check/violation/report.
- [x] Thêm route `loading/error/not-found`.
- [ ] Tích hợp membership/active tenant thật khi backend cung cấp API.
- [ ] Làm dashboard API thống kê thật cho platform và tenant.

Điều kiện hoàn tất: không còn mock trên navigation production, không còn duplicate domain implementation, critical paths có component/integration test.

### Giai đoạn P2 — chất lượng, vận hành và hiệu năng

1. Dọn file rỗng, dead import và `any`; thêm barrel export có kiểm soát.
2. Bổ sung `engines`, `.nvmrc`, README deployment và Dockerfile nếu dùng container (`.env.example` đã có).
3. Chuẩn hóa date library; khai báo dependency trực tiếp.
4. Thêm observability: error reporting, request correlation ID, frontend metrics.
5. Tiếp tục tối ưu image, accessibility theo WCAG và bundle size; responsive shell/shared table/form đã có nền tảng.
6. Thêm E2E cho auth, tenant, employee, site/shift/assignment, attendance và role permission.

## 13. Quy ước đề xuất cho code mới

Mỗi feature mới chỉ tạo những lớp thực sự cần dùng:

```text
features/<scope>/<feature>/
├── components/
├── hooks/              # typed React Query hooks
├── services/           # HTTP only, không đọc Zustand trực tiếp
├── types/              # wire DTO + UI model nếu khác nhau
├── schemas/            # chỉ khi có validation
└── utils/              # mapper/formatter chỉ thuộc domain
```

Quy tắc:

- Page chỉ compose layout/guard/feature component.
- Service nhận `tenantId` tường minh; không đọc store và không có fallback.
- Query key luôn chứa tenant context.
- UI không tự parse response envelope.
- Mutation phải định nghĩa invalidation/optimistic update rõ ràng.
- Không tạo file placeholder rỗng.
- Mọi route mới cần loading, empty, error và permission state.
- Mọi API mới cần type, happy-path test và error-path test.

## 14. Checklist onboarding

1. Đọc `README.md` và tài liệu này.
2. Dùng Node >= 20.9 và `npm ci`.
3. Tạo `.env.local` với API/Google/Firebase config cần thiết.
4. Chạy backend tại `localhost:8080` nếu dùng rewrite local.
5. Chạy `npm run dev`, mở `/login`.
6. Trước khi gửi thay đổi: lint, typecheck, test và build.
7. Không dùng `CAUTRUCWEB.md`/`TAILIEU.md` làm nguồn duy nhất vì chúng mô tả cấu trúc cũ.

## 15. Kết luận

Dự án đã có skeleton tốt cho một portal multi-tenant và một số feature quan trọng đã nối backend tương đối đầy đủ, đặc biệt là auth, tenant, employee, site/geofence/shift/assignment và subscription. Nút thắt hiện tại không phải thiếu UI library hay thiếu cấu trúc thư mục, mà là **độ nhất quán và tính hoàn thiện**: contract drift, duplicate module, stub rỗng và khoảng trống kiểm thử tự động.

Nền build/type/lint đã xanh nên có thể tiếp tục phát triển có kiểm soát. Trước khi mở rộng các feature lớn, vẫn cần ưu tiên security phiên đăng nhập và authorization backend, bổ sung smoke test, triển khai API thống kê/chuyển tenant thật và hợp nhất các domain trùng lặp; đây là các rủi ro còn có thể gây sai dữ liệu hoặc regression nghiệp vụ.
