# Báo cáo triển khai UI check-in/check-out — 29/07/2026

## 1. Kết luận

Frontend Web đã được cập nhật theo contract mới trong `checkin-management-api.md` và `checkin-ui-permissions-guide.md`:

- Site cấu hình một trong ba mức `gps_only`, `gps_face`, `gps_face_liveness`.
- Shift kế thừa chính sách Site hoặc ghi đè độc lập; khi bỏ ghi đè gửi `clearCheckinPolicyOverride=true`.
- HR/Admin/Supervisor xem lịch sử chấm công, lọc theo site/nhân viên/trạng thái/thời gian, sort và phân trang.
- Danh sách và chi tiết hiển thị riêng bằng chứng check-in/check-out: GPS, geofence, Face ID, liveness, score và `workMinutes` khi API có dữ liệu.
- `pending_review` không còn bị diễn giải cứng là lỗi GPS; UI xét cả GPS, Face ID và liveness.
- Override chỉ cho chọn trạng thái khác hiện tại, bắt buộc nhập lý do và cảnh báo ảnh hưởng bảng công.
- Supervisor có nhiều site phải chọn một site trước khi tải dữ liệu, đúng giới hạn site-scope hiện tại của Backend.
- Đã sửa endpoint Web cũ dùng sai số nhiều `/checkins` thành endpoint thật `/checkin`.

Check-in/check-out trực tiếp, camera, active-liveness, hàng đợi offline và lịch sử cá nhân vẫn thuộc **Mobile App**. Web chỉ cấu hình chính sách và xử lý nghiệp vụ HR; không tạo màn Web cho nhân viên chấm công nhằm tránh trùng luồng và tránh hạ mức bảo đảm thiết bị/vị trí.

## 2. Luồng nghiệp vụ và liên kết dữ liệu

```text
Employee(active + Face ID enrolled/approved nếu policy yêu cầu)
  └─ Assignment(active, đúng ngày/thứ)
      ├─ Site(active, timezone, geofence, checkinPolicy)
      └─ Shift(active, cửa sổ giờ, OT, checkinPolicyOverride?)
           └─ Backend resolve effectiveCheckinPolicy
                ├─ App: available-sites → GPS/camera/liveness
                ├─ CheckinRecord: bằng chứng IN và OUT độc lập
                └─ Web HR: list/detail → review → override có lý do
```

Quyết định chính sách luôn thuộc Backend: `shift.checkinPolicyOverride ?? site.checkinPolicy`. App phải dùng `effectiveCheckinPolicy` từ `available-sites`, không tự suy luận lại. Check-out dùng cùng mức xác thực đã áp dụng cho check-in. Trạng thái nhân viên/site, assignment và cửa sổ thời gian tiếp tục được Backend kiểm tra; Web không mô phỏng các rule này ở client.

## 3. Phân chia Web và App

| Nghiệp vụ | Web | App |
|---|---:|---:|
| Cấu hình policy Site, override Shift | Có | Không |
| HR xem list/detail và override | Có | Không |
| Chọn site được phép hôm nay | Không | Có |
| Check-in/out GPS, Face ID, liveness | Không | Có |
| Offline queue/sync và kết quả từng item | Không | Có |
| Nhân viên xem lịch sử/giải trình của mình | Không | Có |

Ở App, ba policy không phải ba checkbox độc lập mà là ba cấp tăng dần. Cách này ngăn cấu hình vô nghĩa như bật liveness nhưng tắt Face ID.

## 4. Đối chiếu sản phẩm thực tế

- QuickBooks Time cấu hình geofence theo địa điểm/job và ghi nhận vị trí khi clock-in/out; quản lý có thể xem các điểm GPS trên bản đồ. Điều này ủng hộ mô hình Site sở hữu geofence, còn CheckinRecord lưu bằng chứng của từng đầu phiên: [Set up and use geofencing](https://quickbooks.intuit.com/learn-support/en-us/help-article/feature-preferences/set-use-geofencing-quickbooks-time/L3pZUXKzW_US_en_US), [GPS tracking for admins/managers](https://quickbooks.intuit.com/learn-support/en-us/help-article/track-location/use-quickbooks-time-gps-tracking-admin-manager/L7fLoZNZk_US_en_US).
- QuickBooks nêu rõ vị trí không được theo dõi khi người dùng đã off-clock. FAMS vì vậy chỉ cần bằng chứng tại check-in/out, không nên biến App thành theo dõi vị trí nền liên tục: [GPS tracking and privacy](https://quickbooks.intuit.com/learn-support/en-us/help-article/track-location/use-understand-quickbooks-time-gps-tracking-team/L4XXl5rNy_US_en_US).
- Deputy cho quản lý review timesheet cùng vị trí geofence và ảnh clock-in/out trước khi duyệt; phù hợp với màn chi tiết bằng chứng và override có lý do của FAMS: [Approving timesheets](https://help.deputy.com/hc/en-au/articles/4689553875471-Approving-timesheets).
- Deputy Web Time Clock không có đầy đủ geofence/photo như luồng kiosk/mobile. Đây là thêm một lý do giữ thao tác chấm công cốt lõi ở App và chỉ làm review/configuration trên Web: [Deputy Web Time Clock](https://help.deputy.com/hc/en-au/articles/5657666293647-Set-up-the-Deputy-Web-Time-Clock).

## 5. Round 2 — Backend V78 đã xử lý các gap và Web đã tích hợp

Backend đã tiếp nhận đầy đủ các gap trong bản báo cáo đầu và bổ sung migration `V78__checkin_audit_fields_and_policy_snapshot.sql`. Web đã cập nhật lại theo contract mới:

| Gap vòng trước | Backend V78 | Cách Web sử dụng |
|---|---|---|
| Detail thiếu sáu field Face/liveness | Đã thêm đầy đủ vào `CheckinDetailResponse` | Modal đọc trực tiếp detail, không còn fallback từ row list |
| Không phân biệt Face `null` | Thêm snapshot `effectiveCheckinPolicy` | `gps_only` hiện “Không áp dụng”; policy Face hiện “Đang chờ xác thực”; snapshot null hiện “Bản ghi lịch sử” |
| Checkout re-resolve policy live | Checkout dùng snapshot lúc check-in | UI hiện rõ “Chính sách tại check-in”, tránh hiểu nhầm cấu hình Site hiện tại là policy của phiên cũ |
| Thiếu nguồn/audit | Thêm `source`, `clientNonce`, `note`, `overriddenBy`, `overriddenAt` | Hiện cảnh báo offline, mã đồng bộ và dấu vết override gần nhất |
| List thiếu tên | Thêm `employeeName`, `employeeCode`, `siteName` theo batch | Bảng ưu tiên dữ liệu tên từ response; directory chỉ còn dùng cho dropdown filter/fallback dữ liệu cũ |
| List thiếu GPS checkout | Thêm bốn field GPS checkout | Hiện kết quả geofence đầu ra ngay trên bảng |

Backend hiện chỉ lưu lần override gần nhất, không phải lịch sử tích lũy. Nếu sau này nghiệp vụ audit yêu cầu xem nhiều lần đổi trạng thái, cần bảng sự kiện override riêng; đây không còn là blocker cho màn hiện tại.

## 6. Kiểm thử đã thực hiện

### Kiểm tra tĩnh và build

- `npm run typecheck`: đạt.
- ESLint trên toàn bộ file thay đổi và E2E liên quan: không có lỗi.
- `npm run build -- --webpack`: đạt, 39 route được build.

### Playwright E2E

11 test liên quan đạt:

- 2 test check-in mới: HR review/override và Supervisor multi-site.
- 4 test hồi quy site/geofence, gồm contract `checkinPolicy` mới.
- 5 test hồi quy shift/assignment, gồm `checkinPolicyOverride`.

Bằng chứng ảnh:

- `docs/test-evidence/checkin-management/01-hr-review-and-override.png`
- `docs/test-evidence/checkin-management/02-supervisor-site-scope.png`
- `docs/test-evidence/site-geofence-management/`
- `docs/test-evidence/shift-assignment-management/`

### API Backend thật

Đã gọi stack local đang chạy, không mock và không sửa dữ liệu:

- `GET /actuator/health`: `200`, `UP`.
- Login seed Platform Admin: `200`.
- `GET /api/v1/tenants/{tenantId}/checkin?page=0&size=1...`: `200`, tenant seed hiện hành kiểm tra có 88 bản ghi.
- `GET /api/v1/tenants/{tenantId}/checkin/{id}/detail`: `200`.
- Kết quả sống sau V78 xác nhận list trả tên nhân viên/site, nguồn và đầy đủ GPS checkout; detail trả đủ policy snapshot, nguồn, audit cùng sáu field Face ID/liveness.
- Bản ghi seed được lấy mẫu tạo trước V78 nên `effectiveCheckinPolicy=null`; Web hiển thị đúng là “Bản ghi lịch sử”, không diễn giải nhầm thành đang xác thực.

Không override bản ghi seed thật vì thao tác này làm thay đổi bảng công. Contract PATCH đã được kiểm tra bằng E2E với request chính xác `{status, reason}`.

## 7. Giới hạn kiểm thử

- Không thể xác minh happy-path active-liveness bằng camera thật trong môi trường tự động hiện tại. Cần QA trên thiết bị thật để tạo challenge `passed`, rồi kiểm tra cả check-in và check-out.
- Repo này là Front Web nên chưa triển khai offline queue/camera trong App. App cần bám checklist trong tài liệu Backend, đặc biệt `effectiveCheckinPolicy`, checkout camera, mã lỗi 409/422 và trạng thái từng item khi sync.
- Không chạy override trên dữ liệu seed thật để tránh thay đổi dữ liệu attendance/payroll; đã kiểm tra API đọc thật và mutation bằng mock contract.

## 8. Checklist QA thiết bị trước go-live

- `gps_only`: check-in và check-out không mở camera.
- `gps_face`: cả hai đầu phiên chấp nhận ảnh/luồng liveness hợp lệ.
- `gps_face_liveness`: cả hai đầu bắt buộc challenge đúng `purpose`, site, chưa hết hạn và chưa dùng.
- Shift override thắng policy Site; bỏ override quay lại kế thừa Site.
- Nhân viên inactive/terminated, Site inactive và ngoài cửa sổ ca nhận đúng mã lỗi.
- Ca qua đêm dùng timezone Site; `serverNow`, `checkinAllowedFrom`, `checkinAllowedUntil` hiển thị đúng.
- Offline duplicate nonce không tạo bản ghi trùng; offline liveness được đưa vào `pending_review`.
- HR thấy đủ bằng chứng IN/OUT và lý do trước khi override; Supervisor không đọc được site ngoài phạm vi.
