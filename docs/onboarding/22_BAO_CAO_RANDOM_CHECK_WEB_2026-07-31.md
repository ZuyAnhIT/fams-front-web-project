# Báo cáo audit và hoàn thiện Random Check Web

Ngày thực hiện: 31/07/2026  
Phạm vi: `fams-front-web-project`  
Nguồn contract: `random-check-config-review.md`, `random-check-ui-guide.md` và code Backend hiện tại.

> Cập nhật 01/08/2026: Backend đã xử lý ba đề xuất Web về list hydration,
> metadata detail và `faceVerifyScore`; Web đã đồng bộ contract mới. Xem báo cáo
> tiếp nối `23_BAO_CAO_RANDOM_CHECK_BACKEND_PATCH_2_WEB_2026-08-01.md`. Các đề
> xuất ở mục 6 dưới đây được giữ lại như lịch sử audit tại thời điểm 31/07/2026.

## 1. Kết luận

Web trước đợt audit chỉ có danh sách lịch kiểm tra, lọc cơ bản và thao tác gửi/hủy. Các luồng cấu hình policy, cấu hình riêng theo công trình, kiểm tra thủ công, tổng quan trạng thái và xem bằng chứng chưa tồn tại.

Sau cập nhật, Web đã hoàn thiện phần dành cho Company Admin/HR/Supervisor:

- Tạo và quản lý cấu hình mặc định toàn công ty.
- Tạo, sửa, xóa cấu hình ghi đè theo site; phân biệt rõ kế thừa và override toàn bộ.
- Cấu hình số lần, khoảng cách, khung giờ, thời gian phản hồi, ngưỡng vi phạm, mode và vai trò tại site.
- Hiển thị effective config ngay trong chi tiết công trình.
- Gửi kiểm tra thủ công theo assignment, bắt buộc lý do audit và cho phép override mode.
- Tổng quan số lượt chờ gửi/đang chờ phản hồi/đã phản hồi/quá hạn.
- Danh sách có lọc site, nhân viên, trạng thái, ngày; phân biệt lượt tự động/thủ công.
- Chi tiết có GPS, liên kết bản đồ, khoảng cách, geofence, Face ID, liveness, outcome và lý do fail.
- Đồng bộ cảnh báo Random Check sang bảng công nhưng chỉ dùng làm tín hiệu audit, không tự trừ công/lương.
- Giữ đúng site-scope: Supervisor nhiều site phải chọn một site trước khi Web tải dữ liệu.

## 2. Đối chiếu tính năng

| Tính năng | Trạng thái trước | Kết quả sau triển khai |
|---|---|---|
| Cấu hình mặc định tenant | Chưa có UI | Đã có form tạo/sửa, validate nghiệp vụ và trạng thái active |
| Override theo site | Chưa có UI | Đã có ở màn tổng quan và tab chi tiết Site; dùng effective endpoint |
| Số lần/khoảng cách/khung giờ | Chưa có UI | Đã có guard `1–10`, khoảng cách không âm, khung giờ hợp lệ và đủ chỗ cho số lượt |
| Mode kiểm tra | Chưa có UI | Đủ `location_only`, `location_face`, `location_face_liveness`; có cảnh báo Face ID |
| Vai trò áp dụng | Chưa có UI | Hỗ trợ tất cả hoặc `worker`/`supervisor`, đúng contract `applicableRoles=[]` |
| Kiểm tra thủ công | Chưa có UI | Chọn assignment đang active, reason bắt buộc, dùng mode effective hoặc override |
| Danh sách/vận hành | Có một phần | Bổ sung summary, employee filter, nguồn phát sinh, tên nhân viên/site và chi tiết |
| Bằng chứng phản hồi | Chưa có UI | Hiện GPS/Face/liveness/outcome/failure từ contract hiện có |
| Liên kết Attendance | Chưa có | Badge và thống kê lỗi Random Check; không cộng/trừ số phút công |

Không đưa `dispatch-queue` ra màn HR vì đây là số liệu hàng đợi vận hành/debug. Việc dispatch/cancel từng lịch vẫn được giữ cho người có permission tương ứng.

## 3. Luồng nghiệp vụ và quan hệ dữ liệu

```text
Tenant default config
        └── Site override (nếu có, ghi đè toàn bộ)
                         ↓ effective config
Employee ─ Assignment ─ Site ─ Shift
                         ↓ giao giữa giờ policy và giờ ca
                  Scheduled Random Check
                         ↓ phản hồi App
             GPS + Face ID + Liveness
                         ↓
                pass / fail / expired
                         ↓
             Violation + Attendance audit flag
```

Các quyết định UI quan trọng:

- Site override là một policy hoàn chỉnh, không merge từng field. Khi tạo override, form sao chép effective config hiện tại để HR chỉnh từ một baseline an toàn.
- Khung policy là giới hạn trên; giờ thực tế là phần giao với ca của từng nhân viên. Form giải thích điều này ngay dưới trường giờ.
- Mode Face chỉ phù hợp khi nhân viên đã enrolled Face ID. UI cảnh báo trước khi lưu; hiện chưa thể hiển thị chính xác X/Y theo site do thiếu aggregate contract phù hợp.
- Random Check fail là tín hiệu tuân thủ để HR điều tra cùng check-in, assignment, shift và geofence; không được tự động sửa `workMinutes` hoặc trừ payroll.
- Manual check chỉ chọn assignment đang hiệu lực tại site, tránh gửi cho nhân viên không còn quyền làm việc ở công trình.

## 4. Tham chiếu hệ thống thực tế

- QuickBooks Time gắn geofence với công việc được phân công và dùng GPS như bằng chứng vị trí, thay vì coi vị trí là quyết định payroll duy nhất: <https://quickbooks.intuit.com/learn-support/en-us/help-article/track-location/use-understand-quickbooks-time-gps-tracking-team/L4XXl5rNy_US_en_US>
- Deputy cấu hình geofence theo location và đưa bằng chứng vị trí vào quy trình review timesheet: <https://help.deputy.com/hc/en-au/articles/4657686206095-Enable-Geofence-in-Deputy>, <https://help.deputy.com/hc/en-au/articles/4689553875471-Approving-timesheets>
- Connecteam kết hợp geofence và selfie để giảm buddy punching: <https://help.connecteam.com/en/articles/3597710-how-to-create-a-geofence>, <https://help.connecteam.com/en/articles/15957902-preventing-buddy-punching-in-the-time-clock>

Thiết kế FAMS theo cùng nguyên tắc kiểm soát nhiều lớp: assignment + ca + vị trí + Face ID/liveness theo mức rủi ro, giữ bằng chứng để review và không để một tín hiệu đơn lẻ tự quyết định lương.

## 5. Phân quyền và phạm vi

| Hành động | Permission Web |
|---|---|
| Xem lịch sử/chi tiết/summary | `randomchecks:list` |
| Tạo/cập nhật/xóa policy | `randomchecks:configure` |
| Gửi kiểm tra thủ công/dispatch | `randomchecks:dispatch` |
| Hủy lịch | `randomchecks:cancel` |
| Xem tab policy tại Site | `sites:read` + `randomchecks:configure` |

Web chỉ dùng permission từ session để ẩn/hiện chức năng; Backend vẫn là ranh giới bảo mật cuối cùng. Với Supervisor có site-scope, Web không gọi API tổng quát trước khi họ chọn site.

## 6. Đề xuất Backend còn lại

### P1 — Hoàn thiện bằng chứng trong detail response

`CheckResponseDto` có `faceVerifyScore` nhưng mapper ở `ScheduledCheckController` chưa gán field này. Detail cũng chưa có URL bằng chứng selfie, nên Web hiện chỉ có kết quả boolean và không thể cho HR xem ảnh khi xử lý tranh chấp.

Đề xuất:

1. Map `faceVerifyScore` đầy đủ.
2. Trả media reference/URL ký ngắn hạn, có tenant + permission check và audit truy cập; không dùng URL public cố định.
3. Áp dụng retention theo consent/biometric policy thay vì giữ ảnh vô thời hạn.

### P1 — Detail response thiếu metadata kiểm tra thủ công

List/manual response có `manualReason` và `triggeredBy`, nhưng detail DTO hiện chưa trả hai field này. Web đang merge dữ liệu row đã chọn vào detail để không mất thông tin. Backend nên thêm hai field để deep-link hoặc refresh modal vẫn có audit metadata đầy đủ.

### P1 — List projection chưa đủ dữ liệu vận hành

Danh sách chưa có employee/site display name và chưa có `outcome`/`failureReason`. Web hiện resolve tên qua directory đã cache và chỉ lấy kết quả khi mở detail, tránh gọi detail N+1. Nên cân nhắc bổ sung `employeeCode`, `employeeName`, `siteName`, `outcome`, `failureReason` vào list projection bằng batch/join để bảng lớn vẫn hiển thị kết quả mà không phát sinh N+1.

### P2 — Ca qua đêm

Backend đã ghi nhận `allowOvernight=true` chưa được tính giao khung policy chính xác. Đây chưa chặn release nếu chưa vận hành ca đêm; cần ưu tiên trước khi bật Random Check cho tenant có ca qua ngày.

### P2 — Thống kê Face ID theo site

Để hiện cảnh báo chính xác “X/Y người chưa đăng ký Face ID” mà không tải toàn bộ nhân viên, nên có aggregate enrollment theo site/assignment hoặc thêm `siteId` vào báo cáo Face ID hiện tại. Đây là cải tiến trải nghiệm, không ảnh hưởng tính đúng policy vì Backend đã fail-safe với người chưa enrolled.

## 7. Kiểm thử và bằng chứng

File mới: `tests/e2e/random-check-management.spec.ts`.

| Kịch bản | Kết quả |
|---|---|
| Company Admin tạo tenant-default, đủ guard giá trị và mode | PASS |
| HR gửi manual check, reason bắt buộc, xem GPS/Face/liveness | PASS |
| Site kế thừa tenant-default và tạo override hoàn chỉnh | PASS |
| Random Check site-scope cho Supervisor | PASS |
| Attendance hiển thị cờ lỗi Random Check, export vẫn cảnh báo audit | PASS |
| Regression Check-in evidence/site-scope | PASS |
| Regression RBAC role/user/site-scope | PASS |

Kết quả công cụ:

- TypeScript: PASS.
- ESLint: PASS, 0 error; toàn repository còn 138 warning cũ, các file Random Check/Attendance và test mới không phát sinh warning.
- Next.js production build bằng Webpack: PASS, 39 route.
- Playwright Random Check + Attendance + Check-in + RBAC: **13/13 PASS**.

Bằng chứng hình ảnh:

- `docs/test-evidence/random-check-management/01-tenant-default-config.png`
- `docs/test-evidence/random-check-management/02-manual-check-evidence.png`
- `docs/test-evidence/random-check-management/03-site-effective-override.png`

## 8. Phạm vi App

Đợt này chỉ sửa Web. App vẫn cần audit riêng theo guide: nhận lượt chờ, countdown, gửi `employeePhotoBase64`, hiển thị trạng thái AI đang xử lý và poll detail, cảnh báo Face ID chưa enrolled, hỗ trợ offline theo contract nếu có. Web không giả lập các luồng dành riêng cho nhân viên này.
