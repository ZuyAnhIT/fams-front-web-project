# Báo cáo hoàn thiện Saved Filters, Audit Viewer và Tenant Operations Web

Ngày kiểm tra: 06/08/2026  
Nguồn đối chiếu: `saved-filters-api.md`, `audit-log-api.md`, `saved-filters-audit-viewer-tenant-ops-2026-08-06.md`, `report-search-api.md`.

## 1. Kết luận theo user story

| Nhóm | Kết quả Web |
| --- | --- |
| Lưu bộ lọc thường dùng | Đã bổ sung bộ lọc cá nhân tại `/customer/violations`. Có tải danh sách, tự áp dụng filter mặc định, lưu filter hiện tại, cập nhật params, đặt mặc định và xóa. Không chia sẻ filter giữa người dùng. |
| Xuất danh sách vi phạm | Đã thêm nút export ngay màn Quản lý vi phạm, dùng đúng `/reports/violations/export`, quyền `reports:export` và truyền đủ `from/to/siteId/employeeId/violationType/resolved`. |
| Khóa/mở tenant | Đã có sẵn tại Platform Admin: suspend, reactivate, cancel; E2E xác nhận suspend gọi đúng endpoint. Không thay đổi Backend contract. |
| Chi tiết tenant vận hành | Đã có sẵn màn chi tiết với subscription, usage và giới hạn gói; E2E xác nhận số nhân viên, site, random check và gói hiện tại. |
| Enforce giới hạn gói | Đây là enforcement hệ thống tại Backend, Web hiển thị usage/limit và chuyển lỗi `PLAN_LIMIT_EXCEEDED` theo `userMessage`; không tự kiểm tra thay Backend để tránh race condition. |
| Xem danh sách audit | Đã bổ sung `/admin/audit-logs` cho Platform Admin và `/customer/audit-logs` cho user có `audit:list`/`audit:read`. Có filter tenant, actor, entity, action, thời gian và request ID. |
| Xem diff old/new | Modal chi tiết gọi `GET /audit-logs/{id}` và render JSON diff generic theo path, không giả định schema của Employee/Site/tenant. |
| Trace request ID | Nút trace trên từng dòng gọi lại list với `requestId`, hiển thị toàn bộ hành động trong request và giữ tenant scope. Có copy request ID cho hỗ trợ vận hành. |

## 2. Quy tắc phân quyền và tenant scope

- Platform Admin xem toàn hệ thống, có thể bỏ trống tenant hoặc chọn một tenant.
- Người dùng công ty luôn gửi rõ `tenantId` của công ty đang hoạt động; không dựa vào suy đoán từ JWT.
- Audit list cần `audit:list`; xem diff cần `audit:read`. Backend vẫn là lớp bảo vệ cuối cùng.
- Saved filter là private theo user; tenant admin khác không thấy filter của người tạo.
- `isDefault=true` chỉ có một filter cho mỗi `user + resourceType`; Web hiển thị dấu sao và tự áp dụng khi mở màn hình.

## 3. Contract export trạng thái vi phạm

Backend đã bổ sung `resolved` cho `GET /reports/violations/export`. Web đã bỏ modal cảnh báo cũ và gửi thẳng giá trị đang lọc: `true` chỉ xuất vi phạm đã xử lý, `false` chỉ xuất chưa xử lý, bỏ trống xuất cả hai. File Excel vì vậy khớp với danh sách người dùng đang xem.

## 4. Kiểm thử

| Hạng mục | Kết quả |
| --- | --- |
| TypeScript | Pass |
| ESLint | 0 error; còn 132 warning kỹ thuật cũ ngoài phạm vi |
| Production build | Pass, 44/44 route |
| Saved Filters/Audit/Tenant Operations E2E | 4/4 pass |
| Violation regression E2E | 3/3 pass |
| API shape | Saved filters gửi/nhận `filterParams` nguyên vẹn; audit tenant scope được kiểm tra bằng request thực tế trên mock contract |

Ảnh bằng chứng:

- `docs/test-evidence/saved-filters-audit-tenant-ops/01-saved-filter-and-export.png`
- `docs/test-evidence/saved-filters-audit-tenant-ops/02-audit-diff.png`
- `docs/test-evidence/saved-filters-audit-tenant-ops/03-tenant-audit-trace.png`
- `docs/test-evidence/saved-filters-audit-tenant-ops/04-tenant-operations-usage.png`

## 5. File triển khai chính

- `src/features/shared/saved-filter/` — API, hooks và toolbar filter cá nhân.
- `src/features/shared/audit/` — API, hooks, viewer, JSON diff.
- `src/app/admin/audit-logs/page.tsx` — Audit toàn hệ thống.
- `src/app/customer/audit-logs/page.tsx` — Audit theo tenant hiện tại.
- `src/features/customer/violation/components/violation.component.tsx` — saved filter + export.
- `tests/e2e/saved-filters-audit-tenant-ops.spec.ts` — kiểm thử bàn giao.

Các thay đổi nằm trên branch `feature/saved-filters-audit-tenant-ops-web` và chưa được commit.
