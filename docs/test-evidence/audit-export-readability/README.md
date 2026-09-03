# Rà soát: danh sách / audit / xuất Excel — hiển thị tên đại diện thay vì ID & tiếng Anh

Ngày: 2026-09-03 · Repos: `fams-backend-project`, `fams-front-web-project`

## Vấn đề
Nhiều chỗ trả về / xuất ra **UUID thô** (id nhân viên, công trình, đối tượng) và **tiêu đề cột /
nhãn bằng tiếng Anh** — người dùng không đối chiếu được.

## 1. Nhật ký audit (`/customer/audit-logs`, `/admin/audit-logs`)

### Backend
- `AuditLogResponse` thêm **`actorName`** (tên người thao tác) + **`entityName`** (tên đối tượng),
  resolve tại thời điểm đọc.
- `AuditLogEnricher` (mới): batch-resolve **1 lần/trang** (không N+1):
  - `actorId` → tên hiển thị người dùng.
  - `entityId` (UUID) → tên cho `USER / Employee / Site / Workspace / Role / Shift / Tenant`.
  - Đối tượng dạng "liên kết" (`UserRole`, `Assignment`, `WorkspaceMember`…): lấy `userId` /
    `employeeId` trong snapshot rồi resolve tên người đó → VD `role_assigned` hiện
    **"Hạnh Nguyễn Minh"**.
  - Còn lại: rút tên từ snapshot (`name`/`title`/`firstName`+`lastName`…). `AccessControl`
    (entityId là đường dẫn request) → không đặt tên, hiển thị `endpoint` là đủ.

### Frontend
- Cột **"Người thao tác"** → `actorName` (email nhỏ bên dưới).
- Cột **"Hành động"** → `formatAction()`: ~50 nhãn tiếng Việt (`Đăng nhập`, `Đổi trạng thái
  nhân viên`, `Gán vai trò`, `Xuất file vi phạm`…), fallback humanize snake_case.
- Cột **"Đối tượng"** → `entityName` in đậm; loại + UUID rút gọn trong tooltip (không còn UUID
  thô trên bảng).
- Modal chi tiết: tương tự + thêm dòng **Endpoint · HTTP status**.
- Bộ lọc: "Loại đối tượng" và "Hành động" thành dropdown nhãn tiếng Việt; placeholder "Entity ID"
  → "ID đối tượng (nếu biết)".

## 2. Xuất Excel

| File | Trước | Sau |
|---|---|---|
| **Danh sách nhân viên** (`/employees/export`) | `employeeCode, firstName, lastName, …` (camelCase); `status` = `active` | `Mã nhân viên, Họ và tên đệm, Tên, **Họ và tên**, Email, …`; `Trạng thái` = "Đang làm việc" |
| **Xuất vi phạm** (`/reports/violations/export`) | `ID, Employee ID, Site ID, Violation Type…` + **giá trị là UUID** | `Mã nhân viên, Họ và tên, Công trình, Loại vi phạm…` + **tên thật** ("Nguyễn Bá Duy Anh", "Chung Cư Light Mon", "Không phản hồi", "Chưa xử lý") |
| **Chấm công tháng** (`/reports/attendance/export`) | `Employee Code, Employee Name, Site Name, Present Days…` + meta `"Exported at"`, dòng `TOTAL` | `Mã nhân viên, Họ và tên, Công trình, Số ngày công…`; meta `"Xuất lúc"`; dòng `TỔNG`; fallback UUID → `(không rõ)` |

- Import nhân viên: `EmployeeService.canonicalImportHeader()` nhận **cả tiêu đề tiếng Anh cũ
  lẫn tiếng Việt mới** → file xuất ra sửa xong vẫn import lại được.

## Test
- Backend regression: `test_audit_logs.sh` **14/14**, `test_export_employees.sh` **7/7**,
  `test_import_employees.sh` **6/6**, `test_export_violations.sh` **10/10**. Compile OK, `fams-api` restart OK.
- Xác minh trực tiếp API: header xuất Excel (employee + violation) đúng tiếng Việt, giá trị là
  tên; `/audit-logs` trả `actorName`/`entityName` (`role_assigned → "Hạnh Nguyễn Minh"`).
- Web: `tests/e2e/audit-export-readability.spec.ts` — pass. Ảnh `audit-list.png`, `audit-detail.png`.
- `tsc` + `eslint` (web) sạch.
