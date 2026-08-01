# Báo cáo đồng bộ Random Check Web theo Backend patch 4

Ngày thực hiện: 01/08/2026  
Nhánh Web: `feature/random-check-lifecycle-ui`  
Nguồn contract: `random-check-config-review.md`, `random-check-lifecycle-design.md`, `random-check-ui-guide.md` bản cập nhật 01/08/2026.

## 1. Kết luận

Backend đã xử lý đủ bốn đề xuất P0/P1 của Web/App: giới hạn check `pending` trả cho nhân viên, FCM data payload, tách preference in-app/push và retention ảnh check-in/random-check. Ba thay đổi đầu không làm thay đổi request/response của Company Web; retention ảnh đã tương thích với UI ảnh bằng chứng hiện tại.

Không cần dựng thêm màn Bull/BullMQ, queue reconciliation, FCM hoặc cleanup biometric trên Web. Đó là job hệ thống/nội bộ; Backend Java thực tế dùng Redis Sorted Set và worker quét mỗi 60 giây, không dùng Bull/BullMQ.

## 2. Đối chiếu thay đổi Backend với Web

| Thay đổi Backend | Tác động Web | Kết quả |
|---|---|---|
| `/my-pending` chỉ lộ `pending` trong lookahead 60 giây | Endpoint nhân viên/App, Web HR vẫn được xem lịch vận hành theo quyền | Không đổi Web |
| FCM có `eventType/checkId/siteId/expiresAt` | App deep-link khi background/quit | Không đổi Web |
| `inAppEnabled` và `pushEnabled` độc lập | Backend tôn trọng đúng hai toggle; không đổi contract Random Check Web | Không đổi Web |
| Cleanup ảnh check-in/random-check và liveness theo retention cấu hình | Endpoint ảnh có thể 404 sau retention | UI đã giải thích ảnh có thể đã bị xóa theo chính sách; không giữ Blob lâu dài |
| Redis queue tự reconcile `pending` khi Backend khởi động | Tăng độ tin cậy dispatch | Không cần UI queue |
| Terminate nhân viên tự hủy check `pending`/`sent` | Modal nghỉ việc cần giải thích side effect | Web đã có cảnh báo và nhắc assignment không tự kết thúc |

## 3. Điều chỉnh Web trong đợt này

### 3.1 Không coi `scheduledAt` là thời điểm delivery chính xác

Cột **Thời điểm** được đổi thành **Giờ dự kiến**, kèm tooltip:

- `scheduledAt` là mốc lên lịch;
- worker quét theo chu kỳ nên dispatch có thể trễ khoảng 60 giây;
- HR phải dựa vào status `pending`/`sent`, không suy luận notification đã tới thiết bị chỉ từ `scheduledAt`.

Modal chi tiết cũng dùng nhãn **Giờ dự kiến** thay vì **Thời điểm gửi**.

### 3.2 Phân biệt check tự động và thủ công

Dòng phụ của cột thời gian hiển thị:

- `Lượt tự động #N` cho check do scheduler sinh;
- `Gửi ngay · thủ công` cho targeted check có `manualReason`.

Cách này không hiển thị sentinel `checkIndex=0` hoặc số âm của manual check thành “lượt #0/#-1” gây nhầm lẫn.

## 4. Phạm vi Web đã hoàn chỉnh

- Tenant-default và site-override, effective config và fallback rõ ràng.
- Validate số lượt, khoảng cách, khung giờ, response window và ngưỡng cảnh báo.
- Mode GPS/Face ID/Liveness và cảnh báo Face ID enrollment.
- Role tại site chỉ có `worker`/`supervisor`; mảng rỗng nghĩa là tất cả.
- Manual check có `reason` bắt buộc, mode override optional và chỉ chọn nhân viên active có assignment.
- Danh sách/filter/phân trang/summary, dispatch tay, cancel tay theo permission và site-scope.
- Chi tiết audit: snapshot, manual reason/triggered by, GPS, Face ID, liveness, score, failure reason và ảnh bằng chứng lazy/authenticated.
- Bảng công cảnh báo random-check failure và guard export theo contract Attendance.
- Nghỉ việc nhân viên cảnh báo tự hủy check nhưng không tự kết thúc assignment.

## 5. Kiểm thử

| Kiểm tra | Kết quả |
|---|---|
| `npm run typecheck` | PASS |
| ESLint các file Random Check thay đổi + test | PASS, 0 error/warning |
| `npm run build -- --webpack` | PASS, 39 route |
| Playwright Random Check + Employee | **9/9 PASS** |
| `git diff --check` | PASS |

E2E mới xác minh nhãn **Giờ dự kiến**, phân loại **Lượt tự động #1**, cùng toàn bộ regression policy/manual check/snapshot/ảnh bằng chứng/cancel-side-effect.

## 6. Giới hạn Backend còn lại

Các P0/P1 Web/App đã được xử lý. Sáu quyết định/giới hạn sau vẫn còn theo tài liệu Backend:

1. Ca qua đêm chưa tính giao khung giờ config/shift.
2. Chưa có aggregate Face ID enrollment theo site/assignment.
3. Chưa có `processedAt` và `processingStatus=failed` riêng cho lỗi hạ tầng AI.
4. Chưa reconcile check `sent` trong cửa sổ crash rất nhỏ trước khi notification thực sự được gửi.
5. Retention `enrollments/` cần logic theo DB để không xóa ảnh đang chờ duyệt.
6. Mặc định retention 30 ngày là cấu hình kỹ thuật tạm, cần chính sách pháp lý/tuân thủ xác nhận.

Không hạng mục nào trong số sáu điểm trên chặn màn Web hiện tại. Ca qua đêm cần ưu tiên nếu khách hàng thực tế sử dụng nhiều ca vắt ngày; retention cần chốt trước production có dữ liệu sinh trắc học thật.

