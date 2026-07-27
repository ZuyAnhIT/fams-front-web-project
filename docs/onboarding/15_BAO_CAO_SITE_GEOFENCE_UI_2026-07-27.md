# Báo cáo hoàn thiện Site và Geofence trên Web

Ngày kiểm tra: 27/07/2026

## 1. Kết luận

Web đã được hoàn thiện cho toàn bộ phạm vi quản lý công trình và geofence:

- HR/Admin có thể xem, tìm kiếm, lọc, sắp xếp, phân trang, tạo, sửa và xóa công trình theo permission.
- HR/Admin có thể tạo và cập nhật vùng chấm công; cập nhật chỉ gửi trường thực sự thay đổi để tránh tạo phiên bản audit dư thừa.
- HR/Admin xem được lịch sử phiên bản geofence, người tạo và thời điểm tạo.
- Supervisor chỉ xem dữ liệu thuộc site được phân công; giao diện không hiển thị các thao tác ghi.
- Chi tiết công trình liên kết mạch lạc với geofence, ca làm việc và số nhân viên đang được phân công.
- Không cho xóa site còn assignment đang hoạt động.
- Deep link `/customer/sites/create` đã hoạt động thay cho màn hình giữ chỗ.

Không cần sửa backend để hoàn thành 7 tính năng trong phạm vi tài liệu hiện tại.

## 2. Quan hệ nghiệp vụ được áp dụng

```text
Tenant
 ├─ Workspace ── workspace_members ── Employee
 └─ Site
     ├─ Geofence (một active, các bản cũ superseded)
     ├─ Shift
     └─ Assignment ── Employee + Shift + thời gian hiệu lực
```

- Workspace trả lời câu hỏi nhân viên thuộc phòng ban/đội nhóm nào.
- Site trả lời câu hỏi nhân viên làm việc/chấm công ở địa điểm nào.
- Không đồng nhất Workspace và Site, vì một phòng ban có thể làm tại nhiều site và một site có thể chứa nhân viên của nhiều phòng ban.
- Assignment là liên kết nghiệp vụ giữa Employee, Site và Shift. Đây là nguồn kiểm tra quyền vào site, lịch làm và chấm công.
- Geofence thuộc Site và được quản lý theo phiên bản. Hệ thống chỉ dùng phiên bản `active` khi đánh giá vị trí check-in; phiên bản `superseded` phục vụ audit.
- Site-scope của Supervisor đến từ role assignment theo site, không lấy từ Workspace.

Thiết kế này phù hợp với cách các hệ thống workforce tách địa điểm làm việc, khu vực/nhóm vận hành và vùng chấm công. Deputy tổ chức nhân viên theo location/area và cho phép geofence quanh địa điểm; Connecteam cũng gắn geofence với job/site thay vì coi geofence là một đơn vị tổ chức độc lập.

Nguồn tham khảo:

- [Deputy — Areas](https://help.deputy.com/hc/en-au/articles/5832768874127-Areas-in-Deputy)
- [Deputy — Creating locations](https://help.deputy.com/hc/en-au/articles/4657694803087-Creating-your-Locations)
- [Deputy — Enable Geofence](https://help.deputy.com/hc/en-au/articles/4657686206095-Enable-Geofence-in-Deputy)
- [Connecteam — Create a geofence](https://help.connecteam.com/en/articles/3597710-how-to-create-a-geofence)

## 3. Ma trận tính năng

| Tính năng | Trước kiểm tra | Sau hoàn thiện |
|---|---|---|
| Danh sách site | Có nhưng menu/route bỏ sót HR | Dùng permission `sites:list`/`sites:read`; đủ search, status, sort, pagination |
| Tạo site | Modal có sẵn; deep link là placeholder | Modal và `/customer/sites/create` hoạt động; kiểm tra permission |
| Xem chi tiết | Không guard permission đầy đủ; gọi thừa API để đếm | Có 403/404 rõ ràng; dùng aggregate từ API detail |
| Cập nhật site | Có | Giữ nguyên; sửa xử lý tọa độ bằng `0` |
| Xóa site | Chưa có trên UI | Có confirm; ẩn theo permission; khóa khi còn active assignment |
| Tạo geofence | Có nhưng nút không đúng quyền | Chỉ HR/Admin có `geofences:create`; yêu cầu site có tọa độ |
| Sửa geofence | Luôn gửi lại polygon và buffer | Chỉ gửi trường thay đổi; polygon tự đóng; validate tối thiểu 3 điểm |
| Lịch sử geofence | Thiếu người tạo | Hiện trạng thái, buffer, người tạo, thời gian và bản đồ từng phiên bản |
| Supervisor site-scope | Có thể nhìn thấy nút ghi rồi nhận 403 | Chỉ đọc; direct URL ngoài scope hiển thị 403 rõ ràng |
| Tab ca/assignment | Supervisor thấy thao tác không được phép | Từng nút tạo/sửa/xóa kiểm tra permission riêng |

## 4. Phân quyền giao diện

| Nhóm người dùng | Danh sách/chi tiết | Tạo/sửa/xóa site | Tạo/sửa geofence | Lịch sử |
|---|---|---|---|---|
| Tenant Admin | Có | Theo permission | Theo permission | Có |
| HR Manager | Có | Theo permission | Theo permission | Có |
| Site Supervisor | Chỉ site trong scope | Không | Không | Chỉ đọc |
| Người không có permission | Không vào màn hình | Không | Không | Không |

Frontend chỉ dùng permission để điều khiển trải nghiệm. Backend vẫn là lớp bắt buộc phải kiểm tra tenant-scope và site-scope; việc ẩn nút không được coi là biện pháp bảo mật.

## 5. Thay đổi kỹ thuật chính

- Bỏ `tenantId` bị gửi lặp ở cả path và query của API danh sách.
- Bổ sung service/hook xóa site và làm mới cache sau khi xóa.
- Dừng retry tự động với lỗi 403/404 để tránh màn hình quay vô hạn.
- Dùng `activeAssignmentCount`, `shifts` và `geofence` từ response chi tiết.
- Hiển thị trạng thái site/geofence, buffer và cảnh báo site chưa có vùng active.
- Sửa các kiểm tra tọa độ để `0` là giá trị hợp lệ.
- Tách permission cho từng thao tác Site, Geofence, Shift và Assignment.
- Loại bỏ ô tìm kiếm assignment giả chưa gọi API.
- Cập nhật geofence theo partial request; không gửi request nếu dữ liệu không đổi.

## 6. Kiểm thử và bằng chứng

### Kiểm thử phạm vi Site/Geofence

File: `tests/e2e/site-geofence-management.spec.ts`

Kết quả Chromium: **4/4 pass**.

1. HR tìm kiếm, lọc, sort, phân trang và tạo site đúng API contract.
2. Admin xem quan hệ site/geofence/shift/assignment; cập nhật riêng buffer chỉ gửi `{ "bufferMeters": 50 }`; xem audit; không xóa site còn assignment.
3. Supervisor chỉ đọc và nhận trang 403 khi truy cập site ngoài scope.
4. Admin xóa được site không còn assignment.

Bằng chứng ảnh:

- `docs/test-evidence/site-geofence-management/01-hr-site-list-create.png`
- `docs/test-evidence/site-geofence-management/02-admin-detail-geofence-history.png`
- `docs/test-evidence/site-geofence-management/03-supervisor-read-only.png`
- `docs/test-evidence/site-geofence-management/04-supervisor-site-scope-403.png`

Kịch bản xóa site được xác minh ở cấp request/response, không tạo thêm ảnh vì sau khi
xóa màn hình chuyển ngay về danh sách.

### Kiểm tra chất lượng

- TypeScript typecheck: **pass**.
- Production build Next.js 16.2.9 với Webpack: **pass**, 39 routes.
- Toàn bộ test E2E: **34 pass, 1 fail, 6 không chạy** trong 41 test.

Test fail nằm ngoài phạm vi thay đổi: luồng đăng ký số điện thoại nhận HTTP 500 từ backend tại `POST /api/v1/auth/register/send-otp`. Chạy riêng test này lần thứ hai vẫn nhận HTTP 500. Do file Auth chạy serial nên 6 test Auth phía sau không tiếp tục. Đây là lỗi dịch vụ/backend hoặc cấu hình gửi OTP cần kiểm tra riêng, không phải hồi quy Site/Geofence.

## 7. Giới hạn và đề xuất tiếp theo

- Lịch sử hiện có đủ snapshot từng phiên bản nhưng backend chưa trả field-level diff. Nếu nghiệp vụ audit cần câu trả lời trực tiếp “ai đổi điểm nào/từ bao nhiêu sang bao nhiêu”, có thể bổ sung `changeSummary` hoặc endpoint diff; chưa bắt buộc cho phạm vi hiện tại.
- Giới hạn trial tối đa một site là quy tắc gói dịch vụ, không phải lỗi UI. Frontend hiển thị lỗi API thay vì tự suy đoán quota.
- E2E Site/Geofence dùng mock API để xác minh UI, permission và request contract. Muốn xác nhận happy-path tích hợp thật cần môi trường backend ổn định, tenant test có đủ permission và dữ liệu site/employee/shift.
- App không cần màn quản lý Site/Geofence. App chỉ dùng site, assignment, shift và geofence gián tiếp trong luồng check-in.

## 8. Checklist nghiệm thu thủ công

- Đăng nhập Admin/HR, mở danh sách site và thử search/filter/sort/pagination.
- Tạo site có tọa độ; mở chi tiết; tạo polygon và buffer.
- Sửa riêng buffer, xác nhận lịch sử sinh đúng một phiên bản mới.
- Tạo shift và assignment; xác nhận số nhân viên active ở trang chi tiết.
- Xác nhận không thể xóa site còn assignment active.
- Đăng nhập Supervisor, xác nhận không thấy nút tạo/sửa/xóa và chỉ thấy site trong scope.
- Dán direct URL của site ngoài scope, xác nhận trang 403.
- Xóa site không còn assignment và xác nhận quay về danh sách.
