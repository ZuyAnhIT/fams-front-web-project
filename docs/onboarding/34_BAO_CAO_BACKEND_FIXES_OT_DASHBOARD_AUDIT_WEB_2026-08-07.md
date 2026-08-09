# Báo cáo tích hợp 6 Backend fixes ngày 07/08/2026 trên Web

Ngày thực hiện: 07/08/2026  
Nhánh: `feature/security-health-uat-golive-web`

## 1. Tài liệu đối chiếu

- Backend: `docs/api/2026-08-07-backend-fixes-frontend-guide.md`.
- Các module Web hiện có: Shift, Attendance, Reports, Dashboard Supervisor, Audit Viewer và Violation.

## 2. Kết quả theo từng đầu việc

| Backend fix | Mức độ | Kết quả Web |
|---|---|---|
| #60 — OT limit | Bắt buộc/nên làm | Đã cập nhật form ca và badge cảnh báo bảng công |
| #130 — tọa độ dashboard | Tùy chọn | Đã tích hợp bản đồ Supervisor với tuyên bố rõ không phải live tracking |
| #31 — thêm audit entity | Tùy theo cách render | Viewer vốn generic; đã bổ sung nhãn/màu cho 6 entity và actor hệ thống |
| #145 — masking audit mở rộng | Không cần FE | Không thêm logic; tiếp tục tin contract đã redact từ Backend |
| #118 — recompute attendance-impact | Không đổi contract | Cache attendance đã được invalidate sẵn, không cần sửa |
| #113 — giải trình check-in | Không đổi contract | Giữ `POST /checkin/{id}/explain`; MyExceptions chỉ là inbox đọc hợp nhất |

## 3. #60 — Cấu hình và cảnh báo OT

### Form cấu hình ca

`ShiftResponse` và `ConfigureShiftOtRequest` đã bổ sung:

- `maxOtMinutesPerDay` / `clearMaxOtMinutesPerDay`.
- `maxOtMinutesPerWeek` / `clearMaxOtMinutesPerWeek`.

UI sử dụng đơn vị phút giống Backend, chỉ nhận số nguyên không âm. Khi người dùng để trống, Web gửi cờ `clear... = true`, thể hiện rõ “không giới hạn”. Danh sách ca hiển thị ngưỡng ngày và tuần hiện tại để HR không phải mở modal mới kiểm tra được cấu hình.

Form ghi rõ ngưỡng chỉ phục vụ cảnh báo. Web không chặn check-out, không khóa nút, không ẩn dữ liệu và không tự cắt OT/lương.

### Bảng công

`AttendanceSummaryResponse` đã bổ sung:

- `otDailyLimitExceeded`.
- `otWeeklyLimitExceeded`.

Hai badge `Vượt OT ngày` và `Vượt OT tuần` xuất hiện tại:

- danh sách bảng công ngày;
- chi tiết bảng công;
- báo cáo công ngày.

Tooltip tiếp tục giải thích đây chỉ là cảnh báo. `otMinutes` và `totalWorkMinutes` vẫn hiển thị nguyên giá trị Backend trả về.

## 4. #130 — Bản đồ Dashboard Supervisor

Web đã đọc `siteLatitude`, `siteLongitude`, `checkInLat`, `checkInLon` và hiển thị:

- tâm site bằng marker màu xanh;
- tọa độ check-in của nhân viên bằng marker màu vàng;
- tên nhân viên và thời điểm check-in;
- fallback rõ ràng khi site/nhân viên chưa có tọa độ.

Trên bản đồ và từng dòng nhân viên đều ghi rõ **“Vị trí lúc check-in”**. Nhãn tự làm mới được đổi thành “Số liệu làm mới mỗi phút”, tránh tạo cảm giác ứng dụng đang theo dõi vị trí nhân viên liên tục.

Đây không phải live tracking: tọa độ không di chuyển theo nhân viên và không được dùng để khẳng định vị trí hiện tại.

## 5. #31 — Audit Viewer

Viewer hiện không có whitelist entity type: mọi chuỗi lạ vẫn render generic và diff vẫn dùng bảng key/value chung. Vì vậy sáu entity mới không bị mất dữ liệu:

- `Tenant`;
- `Role`;
- `UserRole`;
- `TenantSubscription`;
- `Plan`;
- `PlanLimits`.

Web bổ sung nhãn tiếng Việt dễ đọc nhưng luôn hiển thị kèm raw `entityType`, đồng thời giữ fallback cho các entity tương lai. Màu action được suy ra theo ý nghĩa create/update/delete/suspend/reactivate/assign/revoke thay vì whitelist đúng từng action.

`actorId = null`/không có email được hiển thị thành **“Hệ thống tự động”**, phù hợp trường hợp cron khóa tenant hết hạn subscription.

## 6. Các mục không cần thay đổi

### #145 — Masking mở rộng

Không tạo danh sách field nhạy cảm ở Web và không cố xem dữ liệu trước khi redact. Backend vẫn là security boundary duy nhất cho audit masking.

### #118 — Recompute khi đổi attendance impact

Hook `useUpdateViolationAttendanceImpact` đã dùng cùng `useRefreshRelations` với confirm/dismiss và invalidate:

- `violations`;
- `scheduled-checks`;
- `attendance` theo tenant.

Vì vậy bảng công sẽ refetch sau khi endpoint thành công; không cần thêm invalidation mới.

### #113 — Giải trình check-in

Luồng hiện tại đã đúng: Web nhận `explainEndpoint` từ inbox MyExceptions, kiểm tra endpoint thuộc đúng tenant rồi POST trực tiếp vào `/checkin/{id}/explain` hoặc `/violations/{id}/explain`. Không chuyển lệnh ghi sang module MyExceptions.

## 7. Kiểm thử

Các suite đã chạy tuần tự để tránh tranh chấp tài nguyên giữa Next dev server và nhiều Chromium worker:

- `shift-assignment-management.spec.ts`: **5/5 pass**.
- `attendance-management.spec.ts`: **3/3 pass**.
- `role-dashboard.spec.ts`: **4/4 pass**.
- `saved-filters-audit-tenant-ops.spec.ts`: **4/4 pass**.
- `violation-management.spec.ts`: **3/3 pass**.

Tổng: **19/19 pass**.

Kiểm tra kỹ thuật:

- TypeScript: pass.
- ESLint phạm vi thay đổi: pass, không error/warning mới.
- `next build --webpack`: pass, sinh thành công 48 route.
- `git diff --check`: pass.

Bằng chứng giao diện:

- `docs/test-evidence/backend-fixes-2026-08-07/01-ot-limit-config.png`.
- `docs/test-evidence/backend-fixes-2026-08-07/02-attendance-ot-warnings.png`.
- `docs/test-evidence/backend-fixes-2026-08-07/03-supervisor-checkin-map.png`.

## 8. Kết luận

Toàn bộ thay đổi cần thiết cho Web đã được tích hợp. OT limit được triển khai đúng bản chất cảnh báo; dashboard không đánh đồng tọa độ check-in với tracking realtime; Audit Viewer tiếp tục generic và nhận đúng entity mới; ba mục Backend-only không bị thêm logic FE dư thừa.
