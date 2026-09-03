# #10 — Hover nút "Chi tiết" ở trang chấm công & #11 — Gán role hàng loạt / trạng thái / phạm vi

Ngày: 2026-09-03 · Repos: `fams-front-web-project`, `fams-backend-project`

## #10 — Nút "Chi tiết" ở trang chấm công lỗi khi hover

`CheckinListTab` — cột "Thao tác" là `fixed: "right"` trên bảng có cuộn ngang
(`scroll={{ x: 1350 }}`). Khi hover một dòng, nội dung các cột bị cuộn khuất **hiện xuyên
qua** ô "Thao tác" ghim phải, vì ô fixed không đục (opaque) ở trạng thái hover. Nút cũng
dùng `BaseButton` (`!min-h-10 !px-4` + `focus-visible` ring `ring-offset-2` + hover
`-translate-y`) → tràn khỏi ô.

### Đã sửa
- `CheckinListTab`: nút "Chi tiết" đổi `BaseButton` → `Button` antd (`type="link" size="small"`);
  cột thêm `onCell: () => ({ className: "!bg-white" })` → ô ghim luôn đục.
- `components/tables/DataTable.tsx`: thêm class giữ ô ghim đục kể cả khi hover cho **mọi bảng**
  dùng component này. Lưu ý antd v6 đổi tên class: `-fix-start` / `-fix-end` (v5 là `-fix-left`
  / `-fix-right`).

## #11 — Gán role hàng loạt & liên quan

### (a) Tên hiển thị "undefined — email"
`BulkAssignRoleModal` dùng `employee.fullName` — nhưng API list nhân viên **không trả `fullName`**
(chỉ `firstName`/`lastName`). Sửa: dùng `getEmployeeDisplayName(employee)` (`utils/name.util`).

### (b) Không gán được role hàng loạt
Options build từ `employee.userId`, nhưng nhân viên **chưa có tài khoản** có `userId = undefined`
→ chọn phải chúng → mảng `userIds` chứa `undefined` → `z.array(z.string())` fail âm thầm, nút
"Gán role" không làm gì. Sửa: **lọc chỉ nhân viên đã có tài khoản** (`Boolean(employee.userId)`).
Backend `POST /user-roles/bulk-assign` vốn hoạt động đúng (đã test).

### (c) Thiếu thông báo thành công khi đổi trạng thái nhân viên
`EmployeeListPage.handleStatusChange` gọi `changeStatus` (mutate) rồi đặt `message.success` trong
callback `onSuccess` của **lời gọi** `mutate`. Nếu list re-render trong lúc request đang chạy
(áp bộ lọc đã lưu, refetch nền…), React Query **bỏ qua** các callback đó → toast không hiện.
Sửa: `mutateAsync` + `await` trực tiếp, `message.success` nằm trong luồng async.

### (d) Gán role phạm vi "công trình cụ thể" nhưng danh sách hiện "Toàn công ty"
Backend `GET /tenants/{id}/employees/{id}` (chi tiết) build `roles[]` nhưng **không set
`siteIds`/`sites`** → luôn null → tab "Vai trò & Phân quyền" hiện "Toàn công ty". `POST /user-roles`
vốn trả `siteIds`/`sites` đúng. Sửa: `EmployeeService` resolve tên công trình và điền
`siteIds`/`sites` như `UserRoleService.toResponse` đã làm.

## Test
- `tests/e2e/attendance-hover-bulk-role.spec.ts` (`LIVE_BACKEND=true`, login thật) — 4 test:
  - `#10`: ô ghim "Thao tác" đục khi hover (bg trắng/slate-50) + ảnh `attendance-hover.png`.
  - `#11 (a,b)`: options nhân viên có tên thật, không còn "undefined".
  - `#11 (c)`: đổi trạng thái → toast "Cập nhật trạng thái thành công" (`status-change-toast.png`).
  - `#11 (d)`: tab Vai trò hiện tên công trình cho role site-scoped (`employee-roles-tab.png`).
- Backend regression: `test_switch_tenant.sh` 8/8, `test_update_tenant.sh` 8/8 (chạy ở batch #08/#09).
- `tsc` + `eslint` (web) sạch.
