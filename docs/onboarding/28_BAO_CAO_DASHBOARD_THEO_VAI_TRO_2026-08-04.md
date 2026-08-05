# Báo cáo triển khai Dashboard theo vai trò và kiểm tra Violation

Ngày kiểm tra: 04/08/2026

## Phạm vi

- Đối chiếu `dashboard-api.md` và `violation-management-api.md` với mã nguồn Web hiện tại.
- Hoàn thiện Dashboard nhân viên, HR/Admin và Site Supervisor.
- Kiểm tra hồi quy danh sách, chi tiết, bằng chứng, xác nhận/bỏ qua và ảnh hưởng bảng công của violation.

## Kết quả triển khai Web

| Nhóm | Kết quả |
| --- | --- |
| Dashboard nhân viên | Hiển thị ca hôm nay, trạng thái check-in, công tháng, số giải trình và thông báo chưa đọc. |
| Dashboard HR/Admin | Hiển thị tổng nhân sự, hiện diện hôm nay, đi muộn, vi phạm, site và phân bố vi phạm chưa xử lý theo loại. |
| Dashboard Supervisor | Hiển thị nhiều site phụ trách, tỷ lệ có mặt và danh sách nhân viên đang tại site; tự làm mới mỗi 60 giây. |
| Điều hướng | Các thẻ tổng quan mở đúng màn nhân viên, bảng công, vi phạm và công trình. Link vi phạm truyền `resolved=false`; màn danh sách đã đọc và áp dụng bộ lọc này vào API. |
| Phân quyền | Ưu tiên Dashboard Supervisor cho `SITE_SUPERVISOR`; HR/Admin dùng Dashboard HR; người dùng còn lại dùng Dashboard nhân viên. |
| Trạng thái rỗng/lỗi | `200 + supervisedSites: []` là trạng thái bình thường; lỗi `404` được diễn giải riêng là tài khoản chưa liên kết hồ sơ nhân viên. |
| Timezone | UI dùng trực tiếp số liệu backend đã tổng hợp theo timezone tenant/site, không tự tính lại. |

Các key không xuất hiện trong `unresolvedByType` được hiển thị bằng `0`, đúng hợp đồng API động và không làm vỡ biểu đồ.

## Kiểm tra tính năng Violation liên quan

Các chức năng Web đã tồn tại và được kiểm tra hồi quy:

- Danh sách có tìm kiếm, lọc, sort và phân trang.
- Chi tiết liên kết scheduled check/check response, GPS, Face ID/liveness và ảnh giải trình private.
- Xác nhận vi phạm hoặc dismiss kèm lý do audit bắt buộc.
- Bật/tắt `affectsAttendance` độc lập với quyết định resolve.
- Nhân viên gửi/cập nhật giải trình và ảnh qua endpoint do backend trả về.

## Kiểm thử

| Kiểm thử | Kết quả |
| --- | --- |
| ESLint phần thay đổi | Pass |
| TypeScript `tsc --noEmit` | Pass |
| Next production build (`next build --webpack`) | Pass, 40/40 trang static được sinh |
| Playwright Dashboard + Violation | 7/7 pass trên Chromium, chạy production server với 1 worker |
| `git diff --check` | Pass |

Các kịch bản Dashboard bao gồm HR, Supervisor nhiều site, Supervisor không có assignment và nhân viên. Bộ Violation bao gồm xử lý HR, giải trình nhân viên và upload ảnh private.

## Kết luận

Các tính năng cần đặt trên Web đã được nối đúng ba API Dashboard và luồng Violation hiện tại. Không phát hiện yêu cầu bắt buộc phải sửa thêm ở backend trong phạm vi tài liệu này.

## Đề xuất Backend không chặn triển khai

- `supervisedSites[].expectedToday` mới là tổng số, còn `onSiteEmployees` chỉ chứa người đã check-in. Nếu giám sát cần biết **ai chưa đến/đang muộn**, nên bổ sung `expectedEmployees` có trạng thái hoặc endpoint drill-down phân trang; Web/App hiện không được phép tự suy ra danh tính.
- Nên bổ sung `generatedAt` và timezone tổng hợp vào ba response dashboard để UI hiển thị độ mới dữ liệu và hỗ trợ audit. Đây là P1, có thể thêm tương thích ngược.
- `sites.totalSites` trong service hiện được hiểu là toàn bộ site chưa bị xoá. UI vì vậy dùng nhãn trung tính “Công trình”, không diễn giải thành “công trình đang hoạt động” nếu backend chưa lọc `status=active`.
