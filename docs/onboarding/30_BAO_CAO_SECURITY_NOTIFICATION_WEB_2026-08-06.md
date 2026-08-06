# Báo cáo hoàn thiện bảo mật tài khoản và thông báo trên Web

Ngày kiểm tra: 06/08/2026  
Nguồn đối chiếu: `auth-api.md`, `notification-api.md`, `checkin-management-api.md` của Backend.

## 1. Kết quả theo user story

| User story | Nơi triển khai đúng | Kết quả |
| --- | --- | --- |
| Bật TOTP 2FA | Web/App | Web hoàn thiện setup, QR, mã thủ công, xác nhận 6 số và lưu 8 backup code chỉ một lần. |
| Đăng nhập có 2FA | Web/App | Web giữ session ở trạng thái pending, chỉ lưu access/refresh token sau `POST /auth/login/totp` thành công; hỗ trợ TOTP và backup code. |
| Audit hành động quan trọng | Backend | Web tự gửi `X-Request-Id` riêng cho mọi request để nối log client với audit Backend. Không dựng màn audit vì chưa có API đọc audit và story là hành vi hệ thống. |
| Tạo notification in-app | Backend | Client không gọi endpoint nội bộ; hộp thư chỉ đọc notification đã được Backend tạo đúng quyền. |
| Đăng ký thiết bị push | App | Không đưa Firebase/APNS SDK vào Web. App phải gọi `POST /me/devices` khi đăng nhập/token refresh và `DELETE` khi logout. |
| Gửi push | Backend + App | Backend gửi và fallback email; App xử lý FCM data payload/deep-link. Web không có API gửi push. |
| Danh sách thông báo | Web/App | Web có badge, dropdown, hộp thư phân trang, lọc chưa đọc, polling và `metadata` có cấu trúc. |
| Đánh dấu đã đọc | Web/App | Web hỗ trợ một mục, chọn nhiều qua `PATCH /notifications/read`, chọn tất cả trang và đánh dấu toàn bộ. |
| Lỗi chấm công thân thiện | App | Backend đã trả `errorCode`/`userMessage` và `CheckinResponse.message` tiếng Việt. Web quản trị không so khớp logic theo chuỗi message. |
| Bản đồ site/vị trí hiện tại | App | Thuộc luồng check-in nhân viên. Web tiếp tục quản trị site/geofence; không yêu cầu quyền GPS nhân viên trên trang quản trị. |

## 2. Các lỗi/gap Web đã sửa

### 2.1 TOTP

- Trước đây `verifyTotp` bỏ response nên mất toàn bộ backup code.
- QR được tạo qua dịch vụ công khai bên thứ ba bằng secret TOTP. Đã bỏ cách này và dùng trực tiếp `qrCodeUrl` do Backend cấp, tránh gửi secret ra ngoài hệ thống.
- Sau khi bật, Web hiển thị đủ 8 mã, hỗ trợ sao chép/tải file và bắt buộc người dùng xác nhận đã lưu trước khi đóng.
- Trước đây nút tắt gọi API không có body nên trái contract bảo mật mới. Hiện modal bắt buộc chọn đúng một phương thức: mật khẩu, mã Authenticator hoặc backup code.

### 2.2 Notification

- Bổ sung field `metadata` vào DTO và deep-link tới check-in, scheduled check, nhân viên hoặc site tương ứng.
- Scheduled Check hỗ trợ mở modal chi tiết trực tiếp bằng `?checkId=...`.
- Sửa response mark-all từ field sai `count` sang đúng `markedCount`.
- Bổ sung checkbox từng item, chọn toàn bộ mục chưa đọc trên trang và bulk-read theo danh sách ID.
- Badge tiếp tục dùng `unreadCount` toàn cục từ Backend, không tự đếm số item của trang hiện tại.
- Thêm màn `/customer/settings/notifications`, tách hai toggle `inAppEnabled` và `pushEnabled`. Event chưa được tùy chỉnh dùng đúng hai giá trị mặc định Backend trả về.
- Sau bản vá Backend P1, màn hình dùng trực tiếp danh sách hợp nhất từ `GET /me/notification-settings`; đã bỏ danh sách event hard-code và chuỗi Swagger sai `RANDOM_CHECK_DISPATCHED`.
- DTO Web đã hỗ trợ `label`, `customized`, cùng `id`/`updatedAt` nullable. Event trong catalog dùng nhãn Backend; event tùy chỉnh riêng tenant có `label=null` sẽ hiển thị chính mã `eventType` và không bị mất khỏi màn hình.
- Đã khai báo contract cho catalog chính thức `GET /notification-event-types` để tái sử dụng ở màn quản trị notification template sau này. Màn cài đặt cá nhân không gọi thừa endpoint này vì response settings đã chứa catalog đầy đủ theo hướng dẫn Backend.

### 2.3 Audit correlation

Interceptor Web sinh một UUID `X-Request-Id` cho mỗi request chưa có header này. Backend echo header và ghi cùng ID vào audit/log cho các hành động đã hỗ trợ, giúp đối chiếu lỗi theo một request cụ thể.

## 3. Nguyên tắc nghiệp vụ áp dụng

- Setup TOTP và backup code theo mẫu Google/GitHub: backup code chỉ hiện một lần; tắt 2FA phải xác thực lại.
- Inbox theo mẫu Gmail/Slack: một mục, một nhóm đã chọn và toàn bộ là ba phạm vi hành động riêng.
- In-app và push là hai kênh độc lập; tắt một kênh không làm thay đổi kênh còn lại.
- `RANDOM_CHECK_SENT` hiện là event hệ thống duy nhất có producer thật. Web không tự suy đoán các event của assignment/check-in/attendance/violation khi Backend chưa phát sinh chúng.
- Danh sách cài đặt là phép hợp giữa catalog và setting đã lưu. Web render nguyên response, vì vậy event tùy chỉnh tenant vẫn còn nguyên sau khi catalog hệ thống được mở rộng.
- FCM token thuộc user/device xuyên tenant, không thuộc tenant và không được đăng ký bởi Web thay App.
- Push/data payload và GPS hiện tại là khả năng native; không giả lập chúng bằng Browser Notification/Geolocation trong Company Web.

## 4. Kiểm thử

| Hạng mục | Kết quả |
| --- | --- |
| TypeScript | Pass |
| ESLint toàn dự án | Pass, 0 error; còn 132 warning kỹ thuật cũ ngoài phạm vi đợt này |
| Next.js production build | Pass, 42/42 route |
| E2E mới Security/Notification | 4/4 pass |
| Hồi quy Random Check | 4/4 pass |
| API sống catalog + settings | Pass; catalog có đúng `RANDOM_CHECK_SENT`, settings giữ đủ event tùy chỉnh tenant |
| Hồi quy Auth (gồm đăng ký phone/email với Backend sống) | 7/7 pass |

Tổng cộng 15/15 kịch bản giao diện mới và hồi quy phù hợp đều pass.

Kịch bản cài đặt notification kiểm tra đồng thời: event catalog chưa tùy chỉnh (`id=null`, `customized=false`), event riêng tenant đã lưu (`label=null`, `customized=true`), hai toggle độc lập, không xuất hiện chuỗi giả `RANDOM_CHECK_DISPATCHED`, payload cập nhật đúng và mọi request có `X-Request-Id`.

Backend sống tại `http://localhost:8080` đã được kiểm tra thành công. `GET /notification-event-types` trả đúng một event chính thức; `GET /me/notification-settings` trả đồng thời dòng mặc định nullable và các dòng event tùy chỉnh đã lưu. Hai luồng đăng ký số điện thoại/email, xác thực email và đăng nhập cũng chạy thành công trong hồi quy Auth.

Ảnh bằng chứng:

- `docs/test-evidence/security-notifications/01-totp-backup-codes.png`
- `docs/test-evidence/security-notifications/02-notification-bulk-selection.png`
- `docs/test-evidence/security-notifications/03-notification-channel-settings.png`

## 5. Bàn giao App

App vẫn cần xác nhận riêng các mục sau trong repository mobile:

1. Đăng ký/hủy FCM token theo vòng đời đăng nhập và token refresh.
2. Xử lý data payload khi foreground, background và app bị tắt; deep-link bằng `eventType` + `metadata`.
3. Đồng bộ màn inbox và bulk-read giống contract Web.
4. Hiển thị trực tiếp `userMessage`; quyết định UI bằng `errorCode`/`status`, không so khớp chuỗi message.
5. Vẽ vị trí hiện tại, marker site, polygon/buffer geofence từ `available-sites`; tính khoảng cách client-side và giải thích hướng di chuyển cho người dùng.

## 6. Giới hạn Backend đã biết

Audit hiện chưa bao phủ mọi thao tác RBAC, tenant settings và employee CRUD. Backend mới bảo đảm request ID hoạt động xuyên request và ghi audit cho các call site đã tích hợp, bao gồm bật/tắt TOTP. Nếu sản phẩm cần màn lịch sử audit toàn hệ thống, Backend phải có đợt mở rộng phạm vi và API đọc audit riêng trước khi Web dựng màn tương ứng.
