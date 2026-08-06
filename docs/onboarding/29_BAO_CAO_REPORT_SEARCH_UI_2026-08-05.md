# Báo cáo triển khai Reports & Global Search trên Web

Ngày kiểm tra: 05/08/2026  
Nguồn đối chiếu: `docs/api/report-search-api.md` của Backend.

## Kết quả theo tính năng

| Tính năng | Kết quả Web |
| --- | --- |
| Báo cáo công ngày | Có bộ lọc ngày/site, 6 chỉ số tổng hợp, bảng chi tiết và danh sách nhân viên có assignment nhưng chưa có bảng công; tên và mã lấy trực tiếp từ `absentEmployees`. |
| Báo cáo công tháng | Có tổng quan payroll, bảng theo nhân viên+site và các badge pending/rejected/random-check. Tổng giờ được ghi rõ đã bao gồm OT. |
| Export bảng công | Chỉ hiện khi có `attendance:export`; xử lý `409 ATTENDANCE_NOT_READY` bằng dialog giải thích và lần gọi lại `confirmDespiteWarnings=true` sau xác nhận của HR. |
| Báo cáo vi phạm | Có lọc kỳ/site/nhân viên/loại, thống kê resolved/unresolved/ảnh hưởng công, breakdown loại/severity/site/nhân viên và bảng chi tiết. |
| Export vi phạm | Chỉ hiện khi có `reports:export`; dùng đúng bộ lọc đang áp dụng. |
| Hiện diện theo site | Snapshot real-time, tỷ lệ có mặt/phân công, danh sách tên+mã nhân viên chưa có mặt từ `EmployeeRef` và tự poll mỗi 60 giây. |
| Trạng thái Face ID | Tích hợp màn đã có vào Trung tâm báo cáo, tìm kiếm và lọc phòng ban phía server, giữ đầy đủ vòng đời consent/enrollment/review/revoked. |
| Tìm kiếm nhanh | Đặt tại Header, debounce 300 ms, chỉ gọi từ 2 ký tự, chia ba nhóm nhân viên/site/check-in; hỗ trợ tra chính xác check-in bằng UUID và điều hướng thẳng đến chi tiết. |

## Phân quyền và site-scope

- Menu Trung tâm báo cáo yêu cầu `reports:list`.
- SITE_SUPERVISOR được xem report nhưng không thấy nút export.
- Web không tự lọc lại dữ liệu site-scope; Backend là nguồn quyết định phạm vi.
- Lỗi `403` do site ngoài phạm vi được hiển thị bằng thông báo nghiệp vụ, không giả thành trạng thái rỗng.
- Search yêu cầu `employees:list`; người không có quyền không nhìn thấy ô tìm kiếm.

## Kiểm thử

| Hạng mục | Kết quả |
| --- | --- |
| TypeScript | Pass |
| ESLint phần thay đổi | Pass, không có error; màn Face ID còn 6 warning `no-explicit-any` có sẵn |
| Next.js production build | Pass, sinh 41/41 trang static |
| Playwright Reports & Search | 4/4 pass trên Chromium |
| Playwright Face ID server-filter | 3/3 pass trên Chromium, gồm `search` + `departmentId` phía server |
| Playwright hồi quy Attendance/Dashboard/Violation | 10/10 pass trên Chromium |
| API sống Backend | Pass trên tenant seed `beta-industries` cho cả ba contract mới |

Tổng cộng 17/17 kịch bản E2E mới và hồi quy đều pass.

Playwright mô phỏng đúng envelope và DTO của sáu nhóm endpoint: công ngày, công tháng, vi phạm, hiện diện site, Face ID enrollment và global search. Contract P1 được kiểm tra thêm với `EmployeeRef`, `search`/`departmentId` của Face ID và UUID check-in.

Kiểm tra API sống bằng Platform Admin xác nhận:

- Báo cáo ngày chỉ còn `absentEmployees`, mỗi phần tử có `employeeId`, `employeeName`, `employeeCode`.
- Báo cáo hiện diện trả `presentEmployees`/`absentEmployees` trên từng site.
- Báo cáo Face ID echo đúng `search`; lọc một `departmentId` thật trả đúng ID đã áp dụng và 4 nhân viên trong seed hiện tại.
- Global Search bằng UUID của một check-in thật trả đúng một kết quả và đúng ID.

Tài khoản HR seed `dung.pham.hr@gmail.com` bị policy `IP_NOT_WHITELISTED` của tenant chặn từ IP máy test. Vì Platform Admin có quyền bypass hợp lệ, phần xác minh contract được chạy trên đúng tenant `beta-industries` bằng tài khoản nền tảng; không thay đổi whitelist hay dữ liệu Backend.

## Kết luận

Toàn bộ bảy user story đã có điểm truy cập phù hợp trên Web. Không phát hiện thay đổi backend bắt buộc trong vòng kiểm tra này.

## Bản cập nhật contract P1

Ba đề xuất Backend ban đầu đã được hoàn thành và Web đã chuyển sang contract mới:

- Dùng trực tiếp `presentEmployees`/`absentEmployees`; không còn tải tối đa 100 nhân viên để tự resolve UUID.
- Gửi `departmentId` và `search` vào báo cáo Face ID; số liệu tổng quan, bảng và phân trang đều do Backend lọc cùng một phạm vi.
- Global Search nhận UUID đầy đủ, hiển thị nhóm “Check-in theo mã” và mở đúng bản ghi khi Backend trả kết quả trong site-scope.
