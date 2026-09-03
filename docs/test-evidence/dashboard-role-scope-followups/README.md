# #12–#15 — Rà soát tiếp: phạm vi role / ngày gán / dashboard NV / bản đồ app

Ngày: 2026-09-03 · Repos: `fams-front-web-project`, `fams-front-app-project`, `fams-backend-project`

## #12 — Gán role phạm vi "công trình cụ thể" hiện "Toàn công ty" + không hiện ngày gán

- **Phạm vi:** đã sửa ở batch trước — backend `GET /tenants/{id}/employees/{id}` giờ trả
  `siteIds`/`sites` cho từng role assignment (commit `00be9c4`). Tab "Vai trò & Phân quyền"
  hiện đúng tên công trình (VD "Chung Cư Light Mon").
- **Ngày gán "—":** [EmployeeRolesTab.tsx](../../../src/features/customer/employee/components/EmployeeRolesTab.tsx)
  cột "Ngày gán" đọc `record.assignedAt` — nhưng API chi tiết trả trường tên là **`createdAt`**.
  Sửa: đọc `createdAt ?? assignedAt`; type `EmployeeRoleAssignment` thêm `createdAt`.

## #13 — Đổi trạng thái nhân viên thiếu thông báo thành công

Trùng với #11 batch trước — đã sửa: [EmployeeListPage](../../../src/features/customer/employee/components/EmployeeListPage.tsx)
`handleStatusChange` dùng `mutateAsync` + `await` thay vì callback của `mutate()` (RQ bỏ qua
callback nếu list re-render giữa chừng). Đã verify toast "Cập nhật trạng thái thành công" hiện.
*(Nếu vẫn thấy thiếu → cần deploy lại web, fix đã có trong nhánh #10/#11.)*

## #14 — Không thể tải dashboard nhân viên

`/dashboard/employee` trả **404** khi tài khoản có role EMPLOYEE nhưng **chưa có hồ sơ nhân
viên** ở công ty đang chọn (VD được gán role trực tiếp, hoặc sau khi đổi công ty). Backend
hoạt động đúng cho tài khoản đã liên kết (đã test 200). Trước đây frontend hiện **lỗi đỏ
dead-end**.

**Đã sửa** [dashboard.component.tsx](../../../src/features/customer/dashboard/components/dashboard.component.tsx):
với 404, `EmployeeDashboardView` hiện **banner info** ("Tài khoản chưa được gắn với hồ sơ
nhân viên…") + `CustomRoleDashboardView` (shortcut theo quyền) thay cho alert đỏ.

## #15 — App mobile: không hiện bản đồ ở Chấm Công

`react-native-maps` **không có bản web** — `CheckinLocationMap.web.tsx` trước đây chỉ là một
nút "Mở Google Maps" → khi QA trên Expo Web trông như "bản đồ hỏng". *(Trên Android/iOS build
thật, bản đồ hoạt động — key Google Maps đã có trong `.env`.)*

**Đã sửa** [CheckinLocationMap.web.tsx](../../../../fams-front-app-project/src/features/checkin/components/CheckinLocationMap.web.tsx):
nhúng **bản đồ OpenStreetMap thật** (`<iframe>` embed, không cần API key), khung theo geofence,
marker ở tâm công trình. Vẫn giữ nút "Mở Google Maps" và ghi chú GPS thời gian thực có trên
app native.

## Test (`LIVE_BACKEND=true`)
- `tests/e2e/dashboard-role-scope-followups.spec.ts` — **2/2 pass**:
  - `#12`: dòng SITE_SUPERVISOR trên tab Vai trò có **tên công trình** + **ngày `dd/mm/yyyy`**,
    không còn "Toàn công ty" (`roles-tab.png`).
  - `#14`: dashboard NV khi 404 hiện banner info + shortcut, **không** hiện lỗi đỏ
    (`employee-dashboard-no-profile.png`).
- `tests/e2e/attendance-hover-bulk-role.spec.ts` (#13 toast) — pass ở batch trước.
- `tsc` (web + app) sạch; `eslint` sạch.
- #15: chỉ đổi code (không chạy được Expo Web e2e ở đây) — `.web.tsx` render `<iframe>` OSM.
