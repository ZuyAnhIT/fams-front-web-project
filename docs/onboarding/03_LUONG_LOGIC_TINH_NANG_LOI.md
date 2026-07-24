# 03. Luồng logic và sự kết nối giữa page – component – hook – service – util

> Tài liệu này trả lời câu hỏi “một thao tác của người dùng đi qua những file nào?”. Trong dự án hiện tại, **hook** là mắt xích quan trọng nằm giữa component và service; không nên bỏ qua lớp này khi đọc code.

## 1. Bản đồ luồng tổng quát

```text
Page (route + guard + composition)
  ↓ render
Feature component (UI + event + local state)
  ├── schema (validate form)
  ├── util/mapper (chuẩn hoá dữ liệu, nếu cần)
  ├── global store (session/tenant/permission/client state)
  └── feature hook
        ├── useQuery: read/cache/loading/error
        └── useMutation: write + invalidation
              ↓
          feature service
              ↓
          shared apiClient
              ├── token request interceptor
              ├── 401 refresh queue
              └── normalize backend error
              ↓
          backend API
```

Quy tắc đọc nhanh một feature:

1. Bắt đầu ở `src/app/**/page.tsx` để biết route và guard.
2. Mở component được import từ `src/features`.
3. Tìm các hook `useXxx` component đang gọi.
4. Mở `hooks/` để thấy query key, queryFn, mutationFn và invalidation.
5. Mở `services/` để thấy endpoint/method/payload thật.
6. Đối chiếu `types/` và `schemas/` để biết contract và validation.
7. Tìm `utils/mapper` nếu API model khác UI model; không phải feature nào hiện cũng có mapper thật.

## 2. Luồng lõi 1 – đăng nhập, dựng session và điều hướng theo vai trò

### 2.1 Các file tham gia

| Lớp | File | Vai trò |
|---|---|---|
| Page | `app/(auth)/login/page.tsx` | Metadata, Suspense, render `LoginForm` |
| Layout | `app/(auth)/layout.tsx` | Auth shell, `GoogleOAuthProvider` |
| Component | `features/customer/auth/components/LoginForm.tsx` | Form, TOTP step, Google callback, toast/router |
| Schema | `features/customer/auth/schemas/auth.schema.ts` | Validate identifier (email/phone), password và các form auth |
| Hook | `features/customer/auth/hooks/use-auth.ts` | `useLogin`, `useLoginTotp`, `useGoogleLogin` |
| Service | `features/customer/auth/services/auth.service.ts` | `/auth/login`, `/auth/me`, `/auth/login/totp`, ... |
| Service phụ | `admin/role-permission/services/role-permission.service.ts` | `GET /roles/me` |
| Util | `auth/utils/auth.mapper.ts` | Ghép profile + JWT + role memberships thành `AuthUser` |
| Util | `auth/utils/jwt.ts` | Decode JWT claims |
| Util | `utils/route.util.ts` | Chọn route sau login |
| Store | `stores/auth.store.ts` | Lưu user/session flags/permissions |
| Token | `services/auth-token.service.ts` | Đọc/ghi access và refresh token |
| HTTP | `services/api-client.ts` | Bearer token + refresh queue |

### 2.2 Luồng email hoặc số điện thoại/password thành công

```text
/login
  → LoginForm useForm(loginSchema)
  → submit identifier/password (`identifier` là email hoặc số điện thoại)
  → useLogin().mutateAsync(payload)
  → authService.login(payload)
  → POST /auth/login
  → LoginResponse { accessToken, refreshToken, ... }
  → tạm lưu token vào authTokenService
  → authService.getProfile()
  → GET /auth/me
  → rolePermissionService.getMyRoles()
  → GET /roles/me
  → authMapper.toAuthUser(profile, accessToken, memberships)
      ├── decode JWT
      ├── platform admin → PLATFORM_ADMIN
      └── tenant user → membership trùng JWT tenantId → permissions
  → authStore.setAuth(user, accessToken, refreshToken)
      ├── localStorage: fams_user
      ├── localStorage: fams_access_token / fams_refresh_token
      └── Zustand: isAuthenticated = true
  → resolvePostLoginRoute(user)
      ├── platform admin → /admin/dashboard
      ├── không có tenant → /customer/select-company
      └── còn lại → /customer/dashboard
```

### 2.3 Nhánh TOTP

`POST /auth/login` có thể trả `totpRequired=true` và `pendingToken` thay vì session hoàn chỉnh:

1. `LoginForm` gọi `setTotpPending(pendingToken)` trong auth store.
2. UI đổi sang form OTP 6 số.
3. Submit gọi `useLoginTotp → POST /auth/login/totp`.
4. Response token đi lại toàn bộ chuỗi `/auth/me → /roles/me → authMapper → setAuth → redirect`.

Điểm chưa tối ưu: chuỗi “lưu token tạm → lấy profile → lấy roles → map → set store → redirect” đang lặp trong email, TOTP và Google login. Nên trích thành một application function/hook như `completeLoginSession(response)` để tránh ba nhánh lệch nhau sau này.

### 2.4 Khôi phục session và refresh token

- Khi mở `/admin/*` hoặc `/customer/*`, `DashboardLayout` gọi `authStore.initialize()`.
- Store đọc token + `fams_user` từ `localStorage`; parse được thì coi là authenticated.
- Khi API trả 401, `apiClient` gọi refresh một lần, queue các request đồng thời rồi retry.
- Refresh thất bại sẽ clear token và chuyển về login.

Giới hạn nghiệp vụ/bảo mật:

- `initialize()` chưa gọi `/auth/me` để xác thực lại user ngay khi app mở; trạng thái cache local có thể cũ cho đến khi API đầu tiên thất bại.
- `RoleGuard` và `hasPermission` chỉ bảo vệ UI. Backend phải kiểm tra quyền thật.

## 3. Luồng lõi 2 – quản lý nhân viên

### 3.1 Từ page tới danh sách

```text
/customer/employees
  → EmployeesPage
  → RoleGuard(TENANT_ADMIN, HR_MANAGER, SITE_SUPERVISOR, PLATFORM_ADMIN)
  → EmployeeTabs
      ├── EmployeeListPage
      └── InvitationListPage
```

`EmployeeListPage` chịu trách nhiệm:

- Lấy quyền nút từ `authStore.hasPermission`.
- Dùng `usePagination(20)` cho page/size/search/sort trên URL.
- Dùng `useDebounce(..., 600)` để tránh gọi API theo mỗi phím gõ.
- Gọi `useEmployees(state)`.
- Render `DataTable`.
- Mở modal tạo/import/invite hoặc route sang detail.

### 3.2 Đọc danh sách

```text
EmployeeListPage
  → useEmployees({ page, size, search, status, sortBy, sortDir })
  → queryKey ["employees", params]
  → employeeService.listEmployees(params)
      → getTenantId() từ authStore
      → GET /tenants/{tenantId}/employees?...
      → unwrap response.data.data
  → PageResponse<Employee>
  → DataTable(content, totalElements, page, size)
```

Điểm kết nối với util/shared:

- `formatVietnameseName()` ghép tên hiển thị.
- `EMPLOYEE_STATUS` + `StatusBadge` chuẩn hoá trạng thái.
- `format` từ `date-fns` format ngày.
- `usePagination` đồng bộ filter/pagination với URL.

### 3.3 Tạo/cập nhật nhân viên

```text
Nhấn “Thêm mới”
  → EmployeeFormModal → EmployeeForm
  → React Hook Form + employeeSchema
  → useCreateEmployee().mutate(payload)
  → employeeService.createEmployee(payload)
  → POST /tenants/{tenantId}/employees
  → onSuccess invalidate ["employees"]
  → list query refetch → table cập nhật
```

Cập nhật dùng `useUpdateEmployee` và `PATCH /tenants/{tenantId}/employees/{id}`. Hook invalidate cả `['employees']` và `['employees', id]`, nên list và detail cùng được làm mới.

### 3.4 Detail và các subdomain

`/customer/employees/[id]` dùng `use(params)` của React để resolve Promise params, sau đó:

```text
EditEmployeePage
  → useEmployeeDetail(id)
  → GET /tenants/{tenantId}/employees/{id}
  → Tabs
      ├── EmployeeForm: thông tin cá nhân
      ├── EmployeeRolesTab: role/user-role API
      └── EmployeeFaceIdTab: DELETE .../face-id để thu hồi
```

Các luồng phụ cùng feature:

| Thao tác | Hook | Endpoint |
|---|---|---|
| Đổi trạng thái | `useChangeEmployeeStatus` | `PATCH /tenants/{tenantId}/employees/{id}/status` |
| Export Excel | `useExportEmployees` | `GET .../employees/export`, `responseType=blob` |
| Import Excel | `useImportEmployees` | `POST .../employees/import`, multipart |
| Gửi lời mời | `useSendInvitation` | `POST /tenants/{tenantId}/invitations` |
| Huỷ lời mời | `useCancelInvitation` | `DELETE .../invitations/{id}` |
| Validate invite | `useValidateInvitation` | `GET /invitations/validate?token=...` |
| Accept invite | `useAcceptInvitation` | `POST /invitations/accept` |
| Thu hồi Face ID | `useRevokeFaceId` | `DELETE .../employees/{id}/face-id` |

### 3.5 Điểm chưa ăn khớp

- Query key `['employees', params]` không chứa tenantId vì service đọc tenant ẩn từ store. Sau switch tenant, cùng params có thể tái sử dụng cache cũ.
- `employee.mapper.ts` và feature store rỗng; API response đang được dùng trực tiếp. Không có mapping layer thật.
- Có cả route create và modal create; cần chốt một UX canonical hoặc chia rõ use case.
- Một số type/service còn `any`, nhất là import/accept/revoke response.

## 4. Luồng lõi 3 – công trình liên kết geofence, ca làm và phân công

Đây là ví dụ rõ nhất về nhiều feature con hội tụ trong một page tổng.

### 4.1 Danh sách công trình

```text
/customer/sites
  → SitesPage + RoleGuard
  → SitePage
      ├── authStore: tenantId + permissions
      ├── local filter/page/sort + debounce
      ├── useSitesQuery(params)
      ├── DataTable
      ├── CreateSiteModal
      └── UpdateSiteModal
```

Đọc list:

```text
useSitesQuery(params)
  → siteKeys.list(params)
  → siteService.getSites(params)
  → GET /tenants/{tenantId}/sites
  → ApiResponse<PageResponse<SiteResponse>>
```

Khác employee, `siteService` hiện trả cả `ApiResponse`, nên component phải đọc `pageResponse.data.content`. Đây là bất nhất response shape nên chuẩn hoá.

### 4.2 Trang tổng chi tiết công trình

```text
/customer/sites/[id]
  → SiteDetailsPage
      ├── authStore.user.tenantId
      ├── useSiteDetailQuery(tenantId, siteId)
      │     └── GET /tenants/{tenantId}/sites/{siteId}
      ├── ActiveGeofenceCard
      │     └── feature geofence
      └── Tabs
            ├── ShiftManagementTab
            │     └── feature shift
            ├── AssignmentManagementTab
            │     ├── feature assignment
            │     ├── danh sách employee
            │     └── danh sách shift của site
            └── GeofenceHistoryTab
                  └── feature geofence
```

Page tổng gọi trước danh sách shifts và assignments để lấy số lượng trên tab. Child tab lại fetch dữ liệu riêng theo phân trang. Hệ quả là có thể có request trùng; React Query chỉ deduplicate nếu query key giống hệt. Query ở page dùng `{page:0,size:100}`/`{page:0,size:1}`, nên không trùng query của child nếu params khác.

### 4.3 Geofence

```text
ActiveGeofenceCard / EditGeofenceModal / GeofenceHistoryTab
  → useActiveGeofenceQuery / useGeofenceHistoryQuery
  → geofenceService
      ├── GET .../geofences/active
      └── GET .../geofences

Submit polygon/radius
  → useCreateGeofenceMutation hoặc useUpdateGeofenceMutation
  → POST .../geofences hoặc PUT .../geofences/active
  → invalidate:
      ├── geofence lists
      ├── active geofence của site
      └── site detail
```

Map component dùng Leaflet/React Leaflet ở client. Đây là lý do hợp lệ để có client boundary/dynamic import.

### 4.4 Shift

```text
ShiftManagementTab
  → useShiftsQuery(tenantId, siteId, params)
  → GET /tenants/{tenantId}/sites/{siteId}/shifts

ShiftFormModal
  → schema/type của shift
  → useCreateShiftMutation / useUpdateShiftMutation
  → POST hoặc PUT .../shifts[/shiftId]
  → invalidate shift lists + site detail

ShiftOtConfigModal
  → useConfigureOtMutation
  → PUT .../shifts/{shiftId}/ot-config
```

### 4.5 Assignment

```text
AssignmentManagementTab
  → useAssignments(tenantId, siteId, filters)
  → assignmentService.getAssignments
  → GET /tenants/{tenantId}/sites/{siteId}/assignments

AssignmentFormModal submit
  → useCreateAssignmentMutation / useUpdateAssignmentMutation
  → POST/PUT .../assignments
  → invalidate assignment lists + site detail

Huỷ phân công
  → useCancelAssignmentMutation
  → DELETE .../assignments/{assignmentId}
  → invalidate tương tự
```

### 4.6 Vì sao các feature “ăn khớp” ở page này

- `siteId` là aggregate context chung.
- `tenantId` xác định biên dữ liệu công ty.
- Shift được truyền cho assignment form để chọn ca.
- Geofence cập nhật làm mới site detail vì site hiển thị thông tin vùng active.
- Mutation của feature con invalidate cache cấp feature và cache site tổng.

### 4.7 Rủi ro cần sửa

- Query key của `site`, `shift`, `geofence`, `assignment` không chứa tenantId.
- `SitePage` truyền `tenantId as any`; hook đã có `enabled`, nên type nên cho `tenantId?: string` rõ ràng thay vì cast.
- Điều kiện `if (hasPermission(...) || true)` luôn đúng, làm action column luôn xuất hiện; nút update bên trong vẫn kiểm tra permission nhưng code gây hiểu sai.
- Route `/customer/sites/create` là placeholder trong khi tạo thật nằm trong modal.
- Form schema/mapper/store của vài subfeature là file rỗng dù types và component có thật.

## 5. Luồng lõi 4 – check-in và bảng công

### 5.1 Trang tổng

```text
/customer/attendance
  → AttendancePage + RoleGuard
  → Tabs
      ├── CheckinListTab
      ├── AttendanceSummaryTab
      └── AttendanceMonthlyTab
```

Đây là hai domain liên quan nhưng khác nguồn dữ liệu:

- **Check-in** là từng sự kiện/lượt vào-ra, có tọa độ, geofence, trạng thái review.
- **Attendance** là dữ liệu tổng hợp theo ngày/tháng từ các lượt check-in và quy tắc ca làm.

Frontend chỉ đọc kết quả tổng hợp; nghiệp vụ tính giờ, muộn/sớm, OT, missing checkout phải nằm ở backend.

### 5.2 Check-in list và detail

```text
CheckinListTab
  → authStore.user.tenantId
  → local params {page,size,status,from,to,sort}
  → useCheckins(tenantId, params)
      → key ["checkins", tenantId, "list", params]
      → checkinService.listCheckins
      → GET /tenants/{tenantId}/checkins
  → DataTable

Nhấn Chi tiết
  → selectedCheckinId + open modal
  → CheckinDetailModal
  → useCheckinDetail(tenantId, id, open)
  → GET /tenants/{tenantId}/checkins/{id}/detail
```

`enabled` ngăn detail query chạy khi modal chưa mở hoặc thiếu ID/tenant.

### 5.3 Attendance summary

```text
AttendanceSummaryTab
  → mặc định from/to = đầu/cuối tháng hiện tại
  → useAttendanceSummaries(tenantId, params)
      → key ["attendance", tenantId, "summaries", params]
      → GET /tenants/{tenantId}/attendance
  → render giờ vào/ra, work minutes, late/early, OT, status
```

### 5.4 Monthly và export

```text
AttendanceMonthlyTab
  → useMonthlyAttendance(tenantId, {year,month,employeeId,siteId,page,size})
  → GET /tenants/{tenantId}/attendance/monthly

Export
  → useExportMonthlyAttendance().mutateAsync(...)
  → GET /tenants/{tenantId}/reports/attendance/export
  → responseType: blob
  → component tạo object URL và click download
```

### 5.5 Điểm làm tốt và điểm còn thiếu

Điểm làm tốt:

- Query key có tenantId + toàn bộ filters.
- Service unwrap thống nhất về `PageResponse<T>`.
- UI không tự tính nghiệp vụ attendance phức tạp, chỉ format dữ liệu backend.

Còn thiếu/chưa khớp:

- Filter employee/site trong check-in mới có comment, chưa có UI dù types/API có thể hỗ trợ.
- `dayjs` được import trực tiếp nhưng không khai báo dependency trực tiếp; hiện chỉ có nhờ Ant Design kéo gián tiếp.
- Chưa thấy mutation review/approve/reject check-in trong frontend.
- Không có automated test đối chiếu công thức backend với hiển thị frontend.

## 6. Luồng lõi 5 – role và permission

### 6.1 Luồng đang dùng ở route list

```text
/admin/settings/roles
  → RoleGuard(TENANT_ADMIN, PLATFORM_ADMIN)
  → RoleManagementPage
      ├── authStore: role, tenantId, hasPermission
      ├── useRolesQuery(filters)
      │     → GET /roles
      ├── useQuery tenantService.listTenants (platform admin)
      ├── RoleFormModal
      │     ├── GET /permissions
      │     ├── POST/PUT /roles
      │     └── invalidate role lists
      └── delete
            → DELETE /roles/{id}
```

Login cũng phụ thuộc module này qua `GET /roles/me`; vì vậy sai contract role/permission có thể làm cả điều hướng/menu sau login sai.

### 6.2 Trùng implementation

Route list dùng `role-permission`, nhưng route create/detail còn dùng component/service của `admin/role`. Cả hai gọi cùng `/roles` và `/permissions`, song khác response unwrap và cách lấy tenant. Đây là rủi ro nghiệp vụ lớn: sửa payload ở một module có thể không sửa module còn lại.

Khuyến nghị: chọn `role-permission` hoặc `role` làm canonical dựa trên UX mong muốn, chuyển cả ba route về cùng types/hook/service, sau đó xoá module trùng.

## 7. Luồng nền – notification polling

```text
DashboardLayout
  → NotificationWatcher mount một lần trong shell
  → mỗi 30 giây gọi notificationService.getNotifications({page:0,size:5})
  → GET /tenants/{tenantId}/notifications
  → lần đầu seed latestId + unreadCount
  → lần sau nếu latestId đổi và item chưa đọc: show toast
  → Zustand notification store cập nhật badge/list

NotificationBell / NotificationPage
  → markAsRead / markAllAsRead
  → PATCH .../{id}/read hoặc .../read-all
  → cập nhật local store/event bus
```

Hiện không có WebSocket; `websocket.service.ts` rỗng. Polling là nguồn realtime duy nhất và sẽ tạo request nền cho mọi dashboard session.

## 8. Ma trận quan hệ giữa các feature lõi

| Feature nguồn | Dữ liệu/biến cố | Feature tiêu thụ | Mối liên hệ |
|---|---|---|---|
| Auth | user, role, permission, tenantId | Mọi customer/admin feature | Chọn route, menu, endpoint scope, quyền nút |
| Tenant | settings/brand | `TenantThemeProvider` | Đổi màu theme toàn app |
| Employee | employee/user | Assignment, attendance, role assignment, Face ID report | Chủ thể được phân công/chấm công/phân quyền |
| Site | siteId/location | Geofence, shift, assignment, check-in, attendance | Nơi làm việc và aggregate page |
| Geofence | active boundary | Check-in/attendance backend | Quyết định trong/ngoài vùng; frontend chỉ cấu hình/hiển thị |
| Shift | time/OT config | Assignment, attendance backend | Ca được gán và quy tắc tính công |
| Assignment | employee + site + shift + thời gian | Check-in/attendance backend | Xác định ai được làm ở đâu/ca nào |
| Check-in | sự kiện vào/ra | Attendance backend | Dữ liệu thô để tổng hợp |
| Attendance | summary/monthly | Report/export UI | Kết quả tính công |
| Role/permission | permission strings | menu, RoleGuard, action buttons | Trải nghiệm truy cập; backend vẫn enforce |

## 9. Checklist khi debug một luồng không khớp nghiệp vụ

1. Xác định backend response thật trong Network tab, không suy từ UI.
2. Kiểm tra `tenantId`, `siteId`, `employeeId` được truyền đúng và query key có scope đó.
3. Kiểm tra type request/response có phản ánh contract backend không.
4. Kiểm tra service đã unwrap đúng `response.data.data` hay trả cả envelope.
5. Kiểm tra `enabled` có vô tình ngăn query chạy.
6. Kiểm tra mutation `onSuccess` invalidate đúng key chưa.
7. Kiểm tra mapper có làm mất field hoặc union permission sai tenant không.
8. Kiểm tra permission UI và authorization backend có cùng tên/quy tắc không.
9. Kiểm tra page có gọi trùng query với child component bằng params khác nhau không.
10. Phân biệt lỗi hiển thị với lỗi nghiệp vụ backend: frontend không nên tự bù/tự tính dữ liệu nguồn sai.
