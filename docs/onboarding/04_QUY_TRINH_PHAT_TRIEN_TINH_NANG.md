# 04. Quy trình phát triển một tính năng

> Mục tiêu của quy trình này là ngăn tình trạng “màn hình chạy được nhưng sai nghiệp vụ hoặc không khớp feature khác”. Thứ tự đúng là chốt nghiệp vụ và contract trước, sau đó mới dựng types/service/hook/UI.

## 1. Cổng đầu vào: xác định tính năng có đủ điều kiện làm chưa

Trước khi code, phải trả lời được:

- Actor nào sử dụng: platform admin, tenant admin, HR, supervisor hay employee?
- Tenant scope là gì? User có thể thao tác tenant nào?
- Dữ liệu đầu vào, đầu ra và trạng thái nghiệp vụ là gì?
- Ai được xem/tạo/sửa/xoá/duyệt? Permission string chính xác là gì?
- Feature phụ thuộc employee/site/shift/assignment nào?
- Backend endpoint đã có hay phải phát triển song song?
- Loading, empty, validation, lỗi, retry và permission denied hiển thị thế nào?
- Sau mutation, màn hình/query nào phải cập nhật?
- Có upload/download, map, OAuth/Firebase hoặc browser API không?

Nếu câu trả lời nghiệp vụ chưa rõ, không “đoán rồi hard-code”. Ghi decision/open question và xác nhận với BA/PO/backend trước khi khoá UI.

## 2. Bước 1 – khảo sát hiện trạng và phạm vi ảnh hưởng

### 2.1 Đọc bắt buộc

1. `AGENTS.md`.
2. Tài liệu Next.js tương ứng trong `node_modules/next/dist/docs/` trước khi dùng/sửa convention Next.js.
3. Bộ tài liệu trong `docs/onboarding/`.
4. `docs/CURRENT_PROJECT_STATUS.md` để biết rủi ro đang mở.

Ví dụ tài liệu Next.js cần chọn theo thay đổi:

| Loại thay đổi | Tài liệu local nên đọc |
|---|---|
| Thêm page/layout/route group | `01-app/01-getting-started/02-project-structure.md`, `03-layouts-and-pages.md` |
| Server/Client boundary | `05-server-and-client-components.md` |
| Route Handler | `15-route-handlers.md` |
| Proxy/redirect theo request | `16-proxy.md` |
| Form/mutation | `01-app/02-guides/forms.md`, `07-mutating-data.md` |
| Auth | `01-app/02-guides/authentication.md` |
| Environment variable | `01-app/02-guides/environment-variables.md` |

### 2.2 Tìm feature gần nhất làm mẫu

Không copy feature chỉ vì tên giống. Chọn theo đặc tính kỹ thuật:

- CRUD + list/filter/pagination: `employee` hoặc `site`.
- Aggregate page nhiều tab: site detail.
- Tenant-safe query keys: `attendance`/`checkin`.
- Form validation: `auth`, `employee`, `subscription`.
- Upload/download: employee import/export hoặc avatar.
- Map: `geofence`.
- Role/permission: chỉ dùng sau khi đã chốt module canonical vì hiện có hai implementation.

### 2.3 Lập impact map

Tối thiểu ghi lại:

```text
Route/page
  → feature components
  → query/mutation hooks
  → service endpoints
  → types/schema/mapper
  → shared components
  → auth/tenant/permission
  → query keys phải invalidate
  → menu/route constants
  → feature khác tiêu thụ dữ liệu
```

## 3. Bước 2 – chốt nghiệp vụ bằng acceptance criteria

Viết dưới dạng Given/When/Then hoặc bảng quyết định. Ví dụ “phân công nhân viên vào công trình”:

| Điều kiện | Hành động | Kết quả kỳ vọng |
|---|---|---|
| Tenant admin, employee active, site active, shift active | Tạo assignment có ngày hợp lệ | Backend tạo, list refetch, tab count cập nhật |
| Employee đã có assignment chồng thời gian | Submit | Backend từ chối bằng business error; UI hiển thị message tiếng Việt |
| User thiếu `assignments:create` | Mở page | Không thấy nút tạo; gọi API trực tiếp vẫn bị backend 403 |
| Tenant A | Chọn employee thuộc tenant B | Backend từ chối; frontend không đưa option cross-tenant |
| `endDate < startDate` | Submit | Zod chặn trước khi gọi API |

Phải bao gồm happy path, validation, permission, tenant isolation, conflict, empty/loading/error và side effect tới feature khác.

## 4. Bước 3 – chốt API contract trước UI

Mỗi endpoint cần bảng sau:

| Mục | Ví dụ |
|---|---|
| Method/path | `POST /tenants/{tenantId}/sites/{siteId}/assignments` |
| Auth | Bearer access token |
| Permission | `assignments:create` |
| Path/query | `tenantId`, `siteId` |
| Request | employeeId, shiftId, startDate, endDate |
| Response | `ApiResponse<AssignmentResponse>` |
| Errors | 400 validation, 401, 403, 404, 409 overlap |
| Side effects | attendance eligibility/site detail counts |

Quy ước contract đề xuất:

- Backend response dùng `ApiResponse<T>` và `PageResponse<T>` nhất quán.
- Service frontend **unwrap** envelope và trả `T`/`PageResponse<T>` cho hook.
- Date/time ghi rõ UTC ISO, local date hay timezone-specific.
- Enum/status lấy từ contract, không tự nghĩ chuỗi ở UI.
- ID trong URL/payload được type rõ.
- Business error có `userMessage` cho người dùng và technical message/correlation ID để debug.

Không bắt đầu component khi API contract còn thay đổi liên tục, trừ khi đã thống nhất mock contract có version và kế hoạch bỏ mock.

## 5. Bước 4 – thiết kế state và query key

Phân loại trước khi tạo store:

| Loại state | Công cụ |
|---|---|
| Dữ liệu backend, list/detail/count | React Query |
| Filter/page/sort cần share/back-forward | URL search params (`usePagination`) |
| Modal/selected row/input tạm | `useState` trong component |
| Form | React Hook Form |
| Session/tenant/theme/badge cross-app | Zustand/provider |

Không đưa server response vào Zustand chỉ để “dễ dùng”; việc đó tạo hai nguồn sự thật.

Query key tenant-scoped bắt buộc có tenantId:

```ts
export const featureKeys = {
  all: (tenantId?: string) => ["feature", tenantId] as const,
  list: (tenantId: string | undefined, params: FeatureListParams) =>
    [...featureKeys.all(tenantId), "list", params] as const,
  detail: (tenantId: string | undefined, id?: string) =>
    [...featureKeys.all(tenantId), "detail", id] as const,
};
```

Lập bảng invalidation trước:

| Mutation | Invalidate tối thiểu |
|---|---|
| Create | feature list; aggregate count có liên quan |
| Update | feature list + detail ID |
| Delete/cancel | feature list + detail/parent aggregate |
| Đổi tenant | query key tự tách bởi tenantId; có thể clear dữ liệu nhạy cảm cũ |

## 6. Bước 5 – triển khai theo thứ tự từ contract lên UI

### 6.1 Types

Tạo ở `features/<area>/<feature>/types/<feature>.type.ts`:

- `FeatureResponse`/domain model.
- `FeatureListParams`.
- `CreateFeatureRequest`, `UpdateFeatureRequest`.
- Enum/union status nếu contract có tập hữu hạn.

Không dùng `any` để tạm né contract. Nếu response chưa biết, dừng ở `unknown` và parse/guard rõ.

### 6.2 Schema

Tạo Zod schema cho dữ liệu do người dùng nhập. Type form nên infer:

```ts
export const featureSchema = z.object({ /* business constraints */ });
export type FeatureFormData = z.infer<typeof featureSchema>;
```

Schema client giúp UX, không thay validation backend.

### 6.3 Mapper/util

Chỉ tạo nếu thực sự có chuyển đổi, ví dụ:

- API UTC timestamp ↔ form local date/time.
- Backend enum ↔ label/status config.
- Nested API response ↔ flattened view model.
- Form empty string ↔ optional/null payload.

Không tạo file mapper rỗng.

### 6.4 Service

Service chỉ biết HTTP contract:

```ts
async list(tenantId: string, params: FeatureListParams): Promise<PageResponse<Feature>> {
  const response = await apiClient.get<ApiResponse<PageResponse<Feature>>>(
    `/tenants/${tenantId}/features`,
    { params },
  );
  return response.data.data;
}
```

Service không gọi toast, không đóng modal, không route, không đọc DOM. Nên nhận `tenantId` argument thay vì tự đọc Zustand để dễ test.

### 6.5 Hook

Hook nối service với lifecycle/cache:

- `enabled: Boolean(tenantId && requiredId)`.
- Query key có đủ scope/filter.
- Mutation invalidation đầy đủ.
- Không swallow error nếu UI cần báo.
- Nếu optimistic update, phải có rollback và chỉ dùng khi lợi ích rõ.

### 6.6 Component

Chia theo trách nhiệm:

- `FeaturePage`: orchestration list/filter/action.
- `FeatureTable`: columns và row interaction nếu đủ lớn.
- `FeatureFormModal`: form/create/update.
- `FeatureDetail`: detail read/edit.

Component chịu trách nhiệm message, modal, confirmation và navigation. Dùng `Base*`, `DataTable`, `ListHeader`, `ContentCard`, `EmptyState` trước khi tạo UI primitive mới.

### 6.7 Page và route

Page nên mỏng:

```tsx
export default function Page() {
  return (
    <RoleGuard allowedRoles={[/* ... */]}>
      <FeaturePage />
    </RoleGuard>
  );
}
```

Thêm metadata, loading/error khi cần. Chỉ thêm `"use client"` nếu bản thân page cần hook/browser API; ưu tiên để feature component sở hữu client boundary.

### 6.8 Menu, route và permission

- Thêm path vào `constants/routes.ts`; tránh hard-code rải rác.
- Chỉ thêm vào `config/menu.ts` khi feature có nghiệp vụ/API thật.
- Page guard theo role; action guard theo permission.
- Backend phải có permission mapping tương ứng.

## 7. Bước 6 – tích hợp chéo với feature khác

Trước khi coi là xong, kiểm tra:

- Tạo/update dữ liệu có làm đổi count/detail ở parent page không?
- Employee/site/shift bị inactive thì dropdown/filter liên quan xử lý ra sao?
- Tenant switch có thể nhìn cache tenant cũ không?
- Role/permission mới có cập nhật menu và action buttons sau login/switch không?
- Notification/report/dashboard có cần phản ánh sự kiện không?
- Export có áp dụng đúng filter đang hiển thị không?
- Deep link, back button và refresh page có giữ được context không?

Ví dụ assignment không chỉ là một modal: nó liên quan site detail count, employee options, shift options và attendance eligibility ở backend.

## 8. Bước 7 – kiểm thử theo tầng

Repository đã có Playwright E2E cho auth (`npm run test:e2e`), nhưng chưa có unit/component framework và các feature khác chưa được phủ. Tính năng mới tối thiểu phải có kế hoạch bổ sung:

### Unit

- Zod schema: boundary/invalid combinations.
- Mapper: timezone/null/enum edge cases.
- Pure util: name, duration, status.

### Component/integration

- Loading, empty, error, populated state.
- Permission có/không có.
- Submit success/error/conflict.
- Query invalidation/refetch sau mutation.
- Pagination/filter/sort payload đúng.

### E2E

- Login và redirect theo role/tenant.
- CRUD happy path của feature.
- Tenant isolation.
- 401 refresh và logout khi refresh fail.
- 403 cho role sai.
- Cross-feature path quan trọng, ví dụ site → shift → assignment → attendance.

### Kiểm thử thủ công bắt buộc cho đến khi có test tự động

| Nhóm | Trường hợp |
|---|---|
| Viewport | mobile, tablet, desktop; table horizontal scroll |
| Network | slow, 400, 401, 403, 404, 409, 500 |
| Data | empty, 1 record, nhiều page, text dài, null field |
| Form | required, max length, date boundary, double-submit |
| Session | refresh browser, token expired, logout |
| Tenant | đổi tenant và quay lại cùng route/filter |
| Accessibility | keyboard, focus, label, modal close, color/status text |

## 9. Bước 8 – chạy quality gates

Trong repository root:

```bash
npm run lint -- --quiet
npm run typecheck
npm run build -- --webpack
```

`npm run check` chạy lint + typecheck + build mặc định, nhưng tài liệu bàn giao hiện ghi Turbopack từng không ổn định; `--webpack` hữu ích để tách lỗi code khỏi lỗi Turbopack trong môi trường hiện tại.

Yêu cầu tối thiểu:

- Không thêm ESLint error/warning mới.
- Không `any` mới nếu không có lý do và phạm vi rõ.
- Không để import/file/route dead hoặc placeholder mới.
- Không commit `.env.local`, token, secret, output build.
- Production build pass.

## 10. Bước 9 – review theo nghiệp vụ và kỹ thuật

### Review nghiệp vụ

- Acceptance criteria đều có bằng chứng test.
- Status transition đúng.
- Permission/tenant/ownership đúng.
- Dữ liệu tổng hợp do đúng hệ thống chịu trách nhiệm; frontend không tự chế số.
- Message và label đúng ngôn ngữ nghiệp vụ.

### Review kỹ thuật

- Page mỏng, component/hook/service đúng lớp.
- Request/response typed.
- Query key có tenantId và filter.
- Invalidation đúng.
- Không gọi Axios trực tiếp trong component.
- Không tạo server state thứ hai trong Zustand.
- Có loading/empty/error.
- Không lặp module đang trùng (đặc biệt role/permission, notification store).
- Đã đọc docs Next.js local nếu chạm framework convention.

## 11. Definition of Done đề xuất

Một tính năng chỉ “Done” khi:

1. Nghiệp vụ và API contract được xác nhận.
2. UI đúng actor/permission/tenant scope.
3. Happy path và edge/error paths hoạt động.
4. Query cache đồng bộ sau mutation và an toàn khi switch tenant.
5. Responsive/accessibility cơ bản đạt.
6. TypeScript, lint, production build pass.
7. Có automated test phù hợp; nếu hạ tầng test chưa có, phải ghi rõ manual evidence và tạo backlog test có owner.
8. Không còn mock/hard-code/placeholder dùng như dữ liệu thật.
9. Tài liệu route/contract/quyết định kiến trúc được cập nhật.
10. Backend authorization đã được xác minh, không chỉ dựa vào UI guard.

## 12. Mẫu kế hoạch triển khai ngắn

```md
### Feature
Tên + mục tiêu nghiệp vụ

### Actors / permissions / tenant scope
- ...

### Acceptance criteria
- Given ... when ... then ...

### API contract
- GET ...
- POST ...
- Errors ...

### Impact map
- Route/page:
- Components:
- Hooks/query keys:
- Services/types/schema:
- Feature liên quan:
- Cache invalidation:

### Test plan
- Unit:
- Component:
- E2E/manual:

### Rollout/risk
- Migration/compatibility:
- Feature flag (nếu cần):
- Monitoring/rollback:
```
