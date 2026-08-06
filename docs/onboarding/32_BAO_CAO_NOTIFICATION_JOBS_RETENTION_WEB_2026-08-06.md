# Báo cáo Web: Notification Template, Delivery, Job và Data Retention

**Ngày:** 2026-08-06  
**Nhánh:** `feature/notification-templates-ops-web`  
**Tài liệu Backend đối chiếu:** `notification-api.md`, `notification-jobs-retention-audit-2026-08-06.md`

## 1. Kết luận phạm vi

| Nhóm tính năng | Phạm vi đúng trên Web | Kết quả |
|---|---|---|
| Quản lý template thông báo | Company Admin có `notifications:manage`/`tenant:admin` quản lý template theo event type và locale | Đã bổ sung CRUD, phân trang, xem trước biến và fallback rõ ràng |
| Retry và fallback | Backend tự retry/fallback; Platform Admin chỉ cần quan sát delivery log | Đã bổ sung bảng delivery log, lọc status/channel/thời gian |
| Cài đặt nhận thông báo cá nhân | Mỗi người dùng bật/tắt độc lập in-app và push | Đã có từ trước; đã kiểm tra hồi quy và giữ nguyên contract catalog động |
| Cron refresh attendance nightly | Backend tự chạy, Web không tạo nút chạy cron giả | Đã hiển thị lần chạy/trạng thái/lỗi qua màn vận hành |
| Monitor scheduled random check | Backend health + reconciliation tự phục hồi; Web dùng để quan sát | Đã hiển thị job, queue depth và health component |
| Data retention | Backend tự dọn theo policy; Web chỉ giám sát job và giải thích policy hiện hành | Đã hiển thị `DataRetentionJob`, không cho tenant tự sửa policy khi chưa có API |

## 2. Màn hình và quyền

### 2.1 Mẫu thông báo công ty

- Route: `/customer/settings/notification-templates`.
- Quyền UI và API: `notifications:manage`, `tenant:admin`; Platform Admin được Backend cho phép nhưng phải có tenant đang hoạt động trên Web.
- Danh sách phân trang theo API `GET /tenants/{tenantId}/notification-templates`.
- Tạo, sửa, xóa mềm template.
- Chặn thiếu event type, locale, title và body trước khi gửi.
- Hiển thị rõ cặp `eventType + locale` là duy nhất; lỗi `409` có thông báo nghiệp vụ.
- Xem trước biến với dữ liệu mẫu. Với `RANDOM_CHECK_SENT`, Web chỉ gợi ý ba biến Backend đã xác nhận: `{checkId}`, `{siteId}`, `{expiresAt}`.
- Xóa template hiển thị xác nhận rằng lần gửi tiếp theo quay về nội dung mặc định; không có công tắc “kích hoạt” vì Backend áp dụng ngay.

### 2.2 Vận hành hệ thống

- Route: `/admin/system-status`.
- Quyền: `PLATFORM_ADMIN` hoặc `system:read`.
- Tổng quan `overallHealth`, số tenant active, độ sâu queue Face Verify và Random Check.
- Thành phần health lấy trực tiếp từ Backend, không tự suy diễn trạng thái.
- Bảng job hiển thị `lastStatus`, `lastRunAt`, `errorMessage`, gồm attendance nightly, random-check scheduler/dispatch/reconciliation, no-response và retention nếu Backend đã ghi nhận.
- Tự làm mới system status mỗi 60 giây và cho phép làm mới thủ công.
- Delivery log hỗ trợ toàn bộ filter contract: `status`, `channel`, `from`, `to`, `page`, `size`.
- Device token chỉ hiển thị giá trị đã che từ Backend; Web không cố giải mã hoặc lưu token đầy đủ.

## 3. Liên kết nghiệp vụ

- Template chỉ thay đổi nội dung; việc có tạo in-app/push hay không vẫn do cài đặt cá nhân và Backend quyết định.
- `RANDOM_CHECK_SENT` dùng cùng event type giữa catalog, template, notification inbox và push metadata; Web không dùng chuỗi sai cũ `RANDOM_CHECK_DISPATCHED`.
- Retry/fallback không được kích hoạt thủ công từ trình duyệt để tránh gửi trùng. Delivery log là bằng chứng vận hành, không phải hàng đợi cho người dùng bấm gửi lại.
- Attendance nightly dùng chung logic tính công phía Backend. Web không tự tính lại hoặc tạo công thức thứ hai.
- Queue reconciliation 5 phút và retention chạy ở Backend. Web chỉ phản ánh trạng thái đã ghi nhận, không giả lập cron bằng timer trình duyệt.

## 4. Kiểm thử

### E2E mới

- Company Admin tạo template `RANDOM_CHECK_SENT/vi`, xem trước biến, sửa nội dung và xóa về fallback mặc định.
- Platform Admin thấy attendance/reconciliation/retention job, queue metrics và lọc delivery log với `status=FAILED`.
- Kết quả: **2/2 pass**.

### Hồi quy notification/security hiện hữu

- Login TOTP chỉ tạo session sau khi xác thực.
- Setup/disable TOTP và backup code.
- Inbox multi-select, mark-read hàng loạt và deep-link metadata.
- Cài đặt in-app/push độc lập và `X-Request-Id`.
- Kết quả: **4/4 pass**.

### Kiểm tra tĩnh

- TypeScript: pass.
- ESLint các file thay đổi: pass.
- Production build Next.js: **46/46 route pass**.

## 5. Giới hạn contract Backend còn lại

Các giới hạn dưới đây không chặn lần bàn giao Web hiện tại, nhưng nên cân nhắc trước khi dùng màn vận hành để điều tra sự cố production ở quy mô lớn:

1. **Delivery log chưa có `tenantId`, `userId`, `eventType` và filter tương ứng.** Platform Admin hiện chỉ lọc được status/channel/thời gian; câu hỏi “tại sao user X không nhận được thông báo” vẫn khó trả lời, đặc biệt với push-only có `notificationId = null`. Đề xuất lưu snapshot ba field này vào delivery log tại thời điểm gửi và bổ sung filter server-side.
2. **Catalog event type chưa trả `availableVariables`.** Web hiện chỉ có thể gợi ý biến của `RANDOM_CHECK_SENT` dựa trên tài liệu. Khi thêm event type mới, nên mở rộng `GET /notification-event-types` với `availableVariables` để tránh Web hardcode và template cấu hình sai.
3. **System status chỉ có lần chạy gần nhất.** Chưa có `expectedNextRunAt`, `durationMs`, `recordsProcessed` hoặc cờ `stale`; Web không thể tự kết luận job “trễ” chỉ từ `lastRunAt` nếu không biết lịch chuẩn. Health indicator Backend vẫn là nguồn cảnh báo chính.
4. **Retention policy chưa được trả qua API.** Các mốc 30/90 ngày trên Web là thông tin của bản Backend hiện tại, không phải cấu hình động. Nếu chính sách đổi hoặc chuyển sang per-tenant, Backend cần trả policy chính thức để Web không bị lệch.
5. Retry FCM hiện đồng bộ trong luồng Backend và status/channel là chuỗi tự do. Đây là giới hạn kỹ thuật Backend, không có cách sửa đúng ở Web.

## 6. Bằng chứng

- `docs/test-evidence/notification-jobs-retention/01-notification-template-crud.png`
- `docs/test-evidence/notification-jobs-retention/02-system-jobs-delivery-log.png`
