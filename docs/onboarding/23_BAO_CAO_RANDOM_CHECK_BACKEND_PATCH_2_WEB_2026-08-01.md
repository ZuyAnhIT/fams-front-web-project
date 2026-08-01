# Báo cáo đồng bộ Random Check Web theo bản vá Backend lần 2

Ngày thực hiện: 01/08/2026  
Phạm vi: `fams-front-web-project`  
Nguồn contract: `random-check-config-review.md`, `random-check-ui-guide.md` bản cập nhật 01/08/2026 và code Backend hiện tại.

> Cập nhật bản vá lần 3 cùng ngày: Backend đã bổ sung API ảnh bằng chứng và
> thống nhất contract `Assignment.role`; Web đã tích hợp ảnh authenticated.
> Xem báo cáo tiếp nối
> `24_BAO_CAO_RANDOM_CHECK_BACKEND_PATCH_3_WEB_2026-08-01.md`. Mục 6 dưới đây
> được giữ lại như lịch sử audit trước bản vá lần 3.

## 1. Kết luận

Web đã đồng bộ ba thay đổi Backend dành trực tiếp cho Company Portal:

- Danh sách dùng thẳng `employeeName`, `siteName`, `outcome`, `failureReason` do Backend hydrate theo batch; không còn phụ thuộc employee/site directory để dựng nội dung từng dòng hoặc gọi detail N+1 để lấy kết quả.
- Modal chi tiết dùng `manualReason`/`triggeredBy` từ chính detail response; không còn merge audit metadata từ row đã chọn.
- Bằng chứng Face ID hiển thị `faceVerifyScore` thật do Backend đã sửa mapper.

Các luồng cấu hình tenant/site, effective fallback, kiểm tra thủ công có lý do, Attendance audit-only và Supervisor site-scope tiếp tục hoạt động đúng sau thay đổi.

Hai thay đổi `GET /{checkId}/my-result` và notification `metadata` thuộc App nhân viên, không được gọi từ Company Web. Chúng cần được tích hợp tại repository App, không nhân đôi sang Web.

## 2. Đối chiếu contract mới

| Contract Backend 01/08 | Cách Web triển khai | Kết quả |
|---|---|---|
| List có `employeeName`/`siteName` | Ưu tiên trực tiếp field của row; ID/directory chỉ là fallback phòng dữ liệu lịch sử | Hoàn tất |
| List có `outcome`/`failureReason` | Thêm cột Kết quả, badge đạt/không đạt và diễn giải các mã lỗi | Hoàn tất |
| Detail có `manualReason`/`triggeredBy` | Alert audit đọc từ `detail.data`, không đọc từ selected row | Hoàn tất |
| Detail map `faceVerifyScore` | Hiển thị cả phần trăm và giá trị gốc, không tự suy diễn threshold | Hoàn tất |
| Employee `my-result` | Không thuộc Web HR | Bàn giao App |
| Notification `metadata` | Không thuộc màn Company Web hiện tại | Bàn giao App |

## 3. Hành vi fallback có chủ đích

Web vẫn tải danh sách site/employee vì hai dữ liệu này cần cho bộ lọc và modal kiểm tra thủ công. Tuy nhiên bảng lịch sử không còn lấy chúng làm nguồn tên chính:

```text
Tên/kết quả trên row
  → dùng field hydrate của GET /scheduled-checks
  → nếu record lịch sử thiếu field: fallback cache directory hoặc UUID

Audit metadata trong modal
  → chỉ dùng GET /scheduled-checks/{checkId}
```

Cách này tận dụng contract mới, đồng thời không làm các record cũ trở nên không đọc được trong thời gian triển khai/migration.

## 4. Liên kết nghiệp vụ đã regression

- `manualReason` tiếp tục là bắt buộc khi gửi kiểm tra thủ công và được audit trong detail.
- `outcome=fail`/`no_response` tiếp tục tạo tín hiệu `hasRandomCheckFailure` trong Attendance; Web không tự thay đổi số phút công.
- Export bảng công vẫn để Backend quyết định readiness và chỉ override sau xác nhận rõ ràng của HR.
- Supervisor nhiều site vẫn phải chọn site trước khi tải lịch; Backend tiếp tục là ranh giới site-scope cuối cùng.
- Effective config vẫn ưu tiên site override rồi fallback tenant default; override là cấu hình hoàn chỉnh, không merge từng field.

## 5. Kiểm thử

File: `tests/e2e/random-check-management.spec.ts`.

Kịch bản mới/được mở rộng:

| Kịch bản | Kết quả |
|---|---|
| List hiển thị tên Backend hydrate dù directory trả tên khác | PASS |
| List hiển thị outcome và diễn giải nhiều failure reason | PASS |
| Detail tự trả audit metadata dù row list không có metadata | PASS |
| Detail hiển thị `faceVerifyScore=0.87` thành `87.0% (0.870)` | PASS |
| Regression tạo tenant policy, manual check và site override | PASS |
| Regression Attendance, Check-in, RBAC/site-scope | PASS |

Kết quả công cụ:

- TypeScript: PASS.
- ESLint mục tiêu Random Check + E2E: PASS, 0 error/warning.
- Next.js production build bằng Webpack: PASS.
- Playwright Random Check + Attendance + Check-in + RBAC: **14/14 PASS**.
- `git diff --check`: PASS.

## 6. Điểm Backend/tài liệu còn cần thống nhất

### P1 — Guide yêu cầu hiện selfie nhưng detail DTO chưa trả media reference

`random-check-ui-guide.md` mục 3.8 yêu cầu modal hiện ảnh selfie. Tuy nhiên `CheckResponseDto` hiện chỉ có GPS, boolean Face/liveness, score, outcome và failure reason; không có `faceImageUrl` hay media reference. Entity có `faceImageUrl` nhưng mapper cố ý không đưa ra DTO.

Web không lấy đường dẫn nội bộ hoặc tự dựng URL. Nếu ảnh là bằng chứng cần xem khi xử lý tranh chấp, Backend nên trả media reference/URL ký ngắn hạn có tenant permission, audit truy cập và retention phù hợp dữ liệu sinh trắc học. Nếu chủ ý không cho HR xem ảnh, cần sửa lại câu “hiện ảnh selfie” trong guide.

### P1 — Mô tả `Assignment.role` mâu thuẫn code chạy thật

Guide mục 3.6 nói vai trò tại site do HR tự đặt và đề xuất autocomplete từ assignment. Code Backend `CreateAssignmentRequest`/`UpdateAssignmentRequest` vẫn dùng regex `^(worker|supervisor)$`; Web Assignment và Random Check cũng đang dùng đúng hai giá trị này.

Web giữ dropdown `worker|supervisor` để không gửi request chắc chắn bị `400`. Backend cần chọn một contract chuẩn:

1. Nếu chỉ có hai role nghiệp vụ: sửa guide, giữ dropdown hiện tại.
2. Nếu muốn role site tùy chỉnh: bỏ regex/chuẩn hóa role, bổ sung endpoint distinct roles hoặc enum quản trị, migration dữ liệu và cập nhật toàn bộ Assignment UI trước khi đổi Random Check.

### P2 — Các giới hạn đã được Backend ghi nhận

- Ca qua đêm chưa tính giao policy window với shift chính xác; cần xử lý trước khi bật Random Check cho site vận hành ca đêm.
- Chưa có aggregate Face ID enrollment theo site/assignment nên Web chỉ cảnh báo chung khi chọn face mode, chưa thể hiện X/Y người chưa enrolled.

Hai giới hạn App về `processingStatus="failed"`/`processedAt` và FCM data payload không ảnh hưởng Company Web, nhưng cần quyết định theo yêu cầu trải nghiệm App.

## 7. File Web cập nhật trong bản vá lần 2

- `src/features/customer/random-check/types.ts`
- `src/features/customer/random-check/components/ScheduledChecksPage.tsx`
- `src/features/customer/random-check/components/ScheduledCheckDetailModal.tsx`
- `tests/e2e/random-check-management.spec.ts`

Bằng chứng giao diện tiếp tục được lưu tại `docs/test-evidence/random-check-management/`.
