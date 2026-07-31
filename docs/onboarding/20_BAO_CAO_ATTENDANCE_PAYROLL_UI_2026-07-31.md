# Báo cáo audit và hoàn thiện Attendance / Bảng công Web

Ngày thực hiện: 31/07/2026  
Phạm vi triển khai: `fams-front-web-project`  
Nguồn contract: `attendance-management-api.md`, `attendance-ui-permissions-guide.md` và code Backend hiện tại.

> Cập nhật sau bản vá Backend lần 2: các P0 về tenant/site-scope recompute,
> readiness khi export và mở khóa summary ở mục 5 đã được Backend xử lý. Web đã
> tích hợp contract mới; xem báo cáo tiếp nối
> `21_BAO_CAO_ATTENDANCE_BACKEND_PATCH_2_UI_2026-07-31.md`. Phần dưới được giữ
> lại như lịch sử audit tại thời điểm phát hiện vấn đề.

## 1. Kết luận

Web đã có nền tảng danh sách check-in, chi tiết bằng chứng, bảng công ngày và bảng công tháng. Đợt này đã bổ sung phần nghiệp vụ còn thiếu:

- Phân biệt rõ phiên **chờ duyệt**, **bị từ chối** và summary **đã điều chỉnh thủ công**.
- Hiện khóa và lý do điều chỉnh; modal điều chỉnh yêu cầu lý do bắt buộc.
- Hiểu đúng `totalWorkMinutes` đã gồm OT và chỉ dùng `otMinutes` làm breakdown.
- Bổ sung lọc công trình/nhân viên cho bảng công ngày và tháng.
- Supervisor nhiều site phải chọn site trước khi Web gọi API.
- Phân quyền tab/menu theo `checkins:list` và `attendance:list`, không còn bắt buộc người xem attendance phải có `checkins:list`.
- Nút export chỉ hiện khi session có đúng quyền Backend đang kiểm tra là `reports:export`.
- Trước export, Web đọc **toàn bộ các trang** trong scope tháng/site để phát hiện pending review hoặc thiếu checkout, rồi yêu cầu xác nhận rõ ràng.
- Một nhân viên làm nhiều site được giữ thành nhiều dòng `employeeId + siteId`; UI không giả định một dòng bằng một nhân viên.

Chưa đưa nút `/attendance/recompute` ra UI vì audit code thật phát hiện endpoint hiện recompute xuyên tenant và không có cơ chế mở khóa summary đã điều chỉnh. Chi tiết ở mục 5.

## 2. Đối chiếu 11 tính năng

| # | Tính năng | Nơi dùng | Trạng thái sau audit |
|---|---|---|---|
| 1 | Hiển thị kết quả check-in/out | App | Backend đã trả status/message; không thuộc Web |
| 2 | Nhân viên xem lịch sử chấm công | App | Không thuộc Web; cần App đối chiếu riêng |
| 3 | HR xem danh sách check-in | Web | Đã có search/filter/sort/page, giữ nguyên và regression PASS |
| 4 | HR xem chi tiết check-in | Web | Đã có GPS, geofence, Face ID/liveness hai đầu, offline, override; regression PASS |
| 5 | Tự động tạo attendance summary | Backend | Backend đã sửa chỉ tính phiên valid; Web hiển thị đúng các phiên bị loại |
| 6 | Tính đi muộn | Backend + Web | Web hiển thị số ngày/phút và breakdown ngày |
| 7 | Tính về sớm | Backend + Web | Web hiển thị số ngày/phút và breakdown ngày |
| 8 | Tính OT | Backend + Web | Đã sửa cách diễn đạt để không cộng OT hai lần |
| 9 | Phát hiện thiếu checkout | Backend + Web | Badge ngày/tháng và cảnh báo trước export |
| 10 | Nhân viên xem bảng công ngày/tháng | App | Không thuộc Web; App cần triển khai field mới theo guide |
| 11 | HR xem bảng công tổng hợp | Web | Đã nâng cấp đầy đủ cột cảnh báo, filter, site-scope và export preflight |

## 3. Luồng nghiệp vụ và quan hệ dữ liệu

```text
Employee + Site Assignment + Shift snapshot
                  ↓
        Check-in / Check-out session
      (GPS + Face ID + liveness + status)
                  ↓ chỉ status=valid được tính
       AttendanceSummary employee+site+date
                  ↓ GROUP BY employee+site+month
       Bảng công tổng hợp / payroll export
```

- Shift dùng snapshot lúc check-in nên thay đổi ca sau này không sửa ngược dữ liệu cũ.
- Face ID/GPS/liveness quyết định check-in có thể valid hay pending review; pending/rejected không được tính vào summary.
- Summary đã có `adjustmentReason` là quyết định thủ công của HR và không còn được auto-recompute.
- Dữ liệu theo tháng gộp theo nhân viên + site. Payroll muốn tổng xuyên site phải tổng hợp tiếp theo `employeeId`, nhưng vẫn phải giữ breakdown site để audit.

## 4. Tham chiếu hệ thống thực tế

- QuickBooks Time yêu cầu review/approve rồi khóa timesheet trước khi dùng cho payroll; time đã duyệt muốn sửa phải unapprove/unlock: <https://quickbooks.intuit.com/learn-support/en-us/help-article/manage-timesheets/approve-unapprove-reject-timesheets-quickbooks/L3fq6c1oN_US_en_US>
- Deputy chỉ export các timesheet đã duyệt sang payroll và yêu cầu unapprove trước khi sửa: <https://help.deputy.com/hc/en-au/articles/4689459710351-Introduction-to-timesheets>
- Connecteam phân biệt khóa từng ngày với duyệt cả kỳ lương, đồng thời cung cấp bộ lọc unresolved issues trước payroll: <https://help.connecteam.com/en/articles/5439640-approving-employee-timesheets-for-payroll>

Áp dụng vào FAMS: cảnh báo pending/missing checkout trước export là bắt buộc. Về dài hạn nên có trạng thái approve/lock kỳ công thực sự ở Backend, không coi việc tải file Excel là hành động “chốt”.

## 5. Yêu cầu Backend cần điều chỉnh

### P0 — `/attendance/recompute` đang chạy xuyên tenant/site

Controller nhận `{tenantId}` nhưng gọi `attendanceSummaryService.recomputeForDate(date)`. Service dùng `findCheckinsBetween(from,to)` không lọc tenant, sau đó recompute toàn bộ tenant/site trong cửa sổ ngày. Một Supervisor có `attendance:list` tại một site cũng có thể kích hoạt ghi lại summary của các tenant/site khác.

Yêu cầu:

1. Truyền `tenantId` vào service và lọc ngay trong repository query.
2. Nhận `siteId` tùy chọn; với user bị site-scope thì bắt buộc site cụ thể và kiểm tra `SiteScopeService`.
3. Test integration: gọi từ tenant A/site A không được cập nhật `updatedAt` của tenant B hoặc site ngoài scope.

Cho tới khi sửa, Web không hiển thị nút Tính lại.

### P0 — Không có đường mở khóa/revert summary đã điều chỉnh

`AdjustAttendanceSummaryRequest.reason` là `@NotBlank`, còn recompute bỏ qua mọi row có `adjustmentReason != null`. Vì vậy mô tả “xóa reason rồi recompute” hiện không thực hiện được qua API.

Đề xuất endpoint audit-safe, ví dụ:

```http
POST /tenants/{tenantId}/attendance/{summaryId}/unlock-and-recompute
{ "reason": "Nhận dữ liệu offline bổ sung, tính lại từ nguồn" }
```

Endpoint phải lưu lịch sử ai mở khóa/lý do/số liệu trước-sau, enforce tenant + site-scope, rồi recompute đúng một summary.

### P0 — Export chưa có rào chắn server-side cho payroll

Web đã preflight mọi trang nhưng vẫn có race condition nếu trạng thái thay đổi giữa lúc kiểm tra và tải file. Backend export hiện không từ chối/cảnh báo khi còn pending review.

Yêu cầu đề xuất:

- API readiness hoặc export trả `409 ATTENDANCE_NOT_READY` kèm số employee/ngày pending và missing checkout.
- Chỉ cho override bằng tham số xác nhận tường minh và lưu audit người export.
- Excel cần cột `daysWithPendingReview`, `daysWithRejectedSession`, `missingCheckoutDays` và trạng thái “chưa chốt”.

### P1 — Permission export không thống nhất

Seed có `attendance:export`, nhưng code `ReportService.exportMonthlyAttendance()` kiểm tra `reports:export`; Swagger cũng nói `reports:export`. Web tạm dùng `reports:export` để khớp code chạy thật. Backend cần chọn một permission chuẩn, khuyến nghị `attendance:export`, cập nhật seed/docs/code và giữ migration tương thích cho role tùy chỉnh.

### P1 — File Excel thiếu thông tin vận hành

Exporter hiện ghi `Employee ID`/`Site ID`, không hydrate tên; cũng chưa xuất pending/rejected. Nên thêm tên/mã nhân viên, tên/mã site, cột trạng thái review và metadata người/thời điểm export. Export hiện còn tải toàn bộ summary vào RAM rồi group Java, chưa dùng aggregate DB đã tối ưu cho màn monthly.

### P1 — Nếu sản phẩm cần “chốt bảng công” thật

Cần entity kỳ công/payroll period với trạng thái `draft → pending_approval → approved_locked → exported`, actor/time/version và quyền reopen. Đây là mô hình gần QuickBooks Time, Deputy và Connecteam. Hiện FAMS chỉ có cảnh báo trước tải Excel, chưa có hành động chốt/khóa cả kỳ.

### P2 — Các giới hạn đã biết

- Xác nhận có hỗ trợ split-shift khác ca trong cùng ngày hay không; hiện calculation dùng snapshot ca đầu tiên.
- Bổ sung E2E Backend cho ngày quá khứ có phiên mở để xác nhận `missingCheckout=true`.
- Monthly response nên thêm `daysWithManualAdjustment` để payroll thấy số ngày đã khóa tay mà không phải tải từng daily summary.

## 6. Kiểm thử Web

File: `tests/e2e/attendance-management.spec.ts`.

| Kịch bản | Kết quả |
|---|---|
| HR thấy pending/rejected/manual lock riêng biệt | PASS |
| Tổng giờ hiển thị đã gồm OT | PASS |
| HR mở chi tiết, điều chỉnh với reason bắt buộc | PASS |
| Sau điều chỉnh hiện cảnh báo khóa auto-recompute | PASS |
| Export kiểm tra toàn scope và cảnh báo pending/missing checkout | PASS |
| Supervisor chưa chọn site thì không gọi daily/monthly API | PASS |
| Supervisor chọn site thì request chứa siteId | PASS |
| Regression danh sách/chi tiết/override check-in | PASS |

Kết quả chạy: **5/5 E2E PASS** cho `attendance-management.spec.ts` + `checkin-management.spec.ts`.

Bằng chứng:

- `docs/test-evidence/attendance-management/01-daily-review-adjustment.png`
- `docs/test-evidence/attendance-management/02-payroll-export-warning.png`

## 7. Phần App cần bàn giao riêng

Không sửa App trong repository Web. App còn phải:

- Hiện `hasPendingReviewSession` và `hasRejectedSession` khác màu trên từng ngày.
- Hiện `daysWithPendingReview`/`daysWithRejectedSession` ở tổng quan tháng.
- Hiện badge HR đã điều chỉnh khi `adjustmentReason != null`.
- Không cộng `otMinutes` lần nữa vào `totalWorkMinutes`.
- Sau switch tenant phải lấy lại employeeId và dữ liệu attendance của tenant mới.
