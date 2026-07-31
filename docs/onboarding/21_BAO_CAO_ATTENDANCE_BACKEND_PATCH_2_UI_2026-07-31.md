# Báo cáo đồng bộ Attendance Web theo bản vá Backend lần 2

Ngày thực hiện: 31/07/2026  
Phạm vi: `fams-front-web-project`  
Nguồn contract: `attendance-management-api.md`, `attendance-ui-permissions-guide.md` bản cập nhật ngày 31/07/2026.

## 1. Kết luận

Web đã đồng bộ đầy đủ ba thay đổi Backend bắt buộc/khuyến nghị:

- Nút xuất bảng công dùng quyền chuẩn `attendance:export`, không còn dùng nhầm `reports:export`.
- Export dùng guard server-side: gọi lần đầu với `confirmDespiteWarnings=false`; nếu nhận `409 ATTENDANCE_NOT_READY`, Web hiện đúng `userMessage` của Backend và chỉ retry với `confirmDespiteWarnings=true` sau khi HR xác nhận.
- Modal bảng công ngày đã có hai đường tính lại tách biệt: summary chưa khóa dùng recompute theo tenant + site + ngày; summary đã điều chỉnh dùng `unlock-and-recompute` và bắt buộc nhập lý do audit.

Không đổi endpoint bảng tháng chính từ `/attendance/monthly` sang `/reports/attendance/monthly`. Đây là chủ ý: màn hình đang phục vụ người có `attendance:list`, còn API report có miền quyền riêng. Readiness của file Excel được quyết định tại chính endpoint export nên không cần Web tải toàn bộ các trang để tự suy luận.

## 2. Đối chiếu contract mới

| Contract Backend | Cách Web triển khai | Kết quả |
|---|---|---|
| `attendance:export` | Kiểm tra permission từ session trước khi hiện nút xuất | Đã hoàn tất |
| `409 ATTENDANCE_NOT_READY` | Phân biệt bằng cả HTTP status và `errorCode` | Đã hoàn tất |
| `confirmDespiteWarnings=true` | Chỉ gửi ở lần gọi lại sau xác nhận tường minh | Đã hoàn tất |
| Error JSON trong response tải Blob | Decode Blob thành JSON để đọc `errorCode/userMessage` | Đã hoàn tất |
| `POST /attendance/{id}/unlock-and-recompute` | Modal lý do bắt buộc, cảnh báo số liệu thủ công sẽ bị thay thế | Đã hoàn tất |
| `POST /attendance/recompute?date=&siteId=` | Nút chỉ hiện khi summary chưa khóa; luôn truyền site đang xem | Đã hoàn tất |
| Recompute theo ngày + site, không phải chỉ một summary | Nội dung xác nhận nói rõ phạm vi toàn bộ công trình/ngày | Đã hoàn tất |
| Summary đã khóa không bị recompute thường ghi đè | UI không hiện nút recompute thường trên row đã khóa; dùng đường unlock riêng | Đã hoàn tất |

## 3. Luồng nghiệp vụ sau cập nhật

### Xuất dữ liệu payroll

```text
HR bấm Xuất
  → GET export?confirmDespiteWarnings=false
    → 200: tải Excel
    → 409 ATTENDANCE_NOT_READY: hiện cảnh báo Backend
       → Hủy: không xuất
       → Xác nhận: GET export?confirmDespiteWarnings=true → tải Excel
```

Backend là nguồn quyết định cuối cùng cho pending/rejected trong toàn scope tháng và site. Badge ở trang hiện tại chỉ giúp HR phát hiện sớm, không dùng làm rào chắn bảo mật/nghiệp vụ.

### Tính lại bảng công

```text
Summary chưa điều chỉnh
  → Tính lại theo tenant + site + ngày
  → Backend giữ nguyên mọi summary đang khóa thủ công

Summary có adjustmentReason
  → Mở khóa và tính lại
  → bắt buộc nhập lý do
  → Backend tính đúng employee + site + ngày
  → adjustmentReason = null + ghi audit trước/sau
```

## 4. File đã cập nhật

- `src/features/customer/attendance/services/attendance.service.ts`
- `src/features/customer/attendance/hooks/use-attendance.ts`
- `src/features/customer/attendance/types/attendance.type.ts`
- `src/features/customer/attendance/components/AttendanceMonthlyTab.tsx`
- `src/features/customer/attendance/components/AttendanceDetailModal.tsx`
- `tests/e2e/attendance-management.spec.ts`

## 5. Kiểm thử

| Kịch bản | Kết quả |
|---|---|
| Điều chỉnh summary với lý do bắt buộc | PASS |
| Mở khóa summary gửi đúng reason và cập nhật UI | PASS |
| Recompute luôn truyền đúng `date` và `siteId` | PASS |
| Nội dung xác nhận nói rõ recompute toàn site/ngày | PASS |
| Export lần đầu gửi `confirmDespiteWarnings=false` | PASS |
| 409 chưa tự tải file và hiện `userMessage` Backend | PASS |
| Chỉ sau xác nhận mới retry với `confirmDespiteWarnings=true` | PASS |
| Supervisor chưa chọn site không gọi API attendance | PASS |
| Regression danh sách/chi tiết/override check-in | PASS |

Kết quả công cụ:

- TypeScript typecheck: PASS.
- ESLint: PASS, 0 error; còn 141 warning cũ trên toàn repository, không phát sinh trong các file Attendance sửa lần này.
- Production build Next.js (Webpack): PASS trong bước khởi động E2E.
- Playwright Attendance + Check-in regression: **5/5 PASS**.

Bằng chứng hình ảnh:

- `docs/test-evidence/attendance-management/01-daily-review-adjustment.png`
- `docs/test-evidence/attendance-management/02-payroll-export-warning.png`

## 6. Giới hạn còn lại — chưa cần chặn release

Hai giới hạn Backend đã ghi rõ vẫn giữ nguyên:

1. Chưa có `hasNewSourceDataAfterAdjustment/adjustedAt`, nên Web chưa thể tự cảnh báo một summary khóa tay vừa nhận thêm dữ liệu nguồn. HR vẫn có thể chủ động dùng “Mở khóa và tính lại”. Đây là P1, nên ưu tiên nếu dữ liệu offline đến muộn xảy ra thường xuyên.
2. Monthly response chưa có `daysWithManualAdjustment`, nên màn tổng hợp chưa thể hiển thị tổng số ngày khóa tay mà không tải chi tiết. Đây là P2, không ảnh hưởng tính đúng hay khả năng export.

Ngoài ra hệ thống chưa có entity kỳ công với vòng đời duyệt/khóa/reopen. Export hiện là hành động tải Excel có cảnh báo và audit override, chưa phải thao tác “chốt kỳ lương” theo nghĩa đầy đủ. Đây là hạng mục sản phẩm độc lập, không phải lỗi của bản tích hợp hiện tại.
