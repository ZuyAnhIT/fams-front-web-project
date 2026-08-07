# Báo cáo Data Masking, Permission Guard, Health, UAT và Go-live Web

Ngày thực hiện: 06–07/08/2026  
Nhánh: `feature/security-health-uat-golive-web`

## 1. Phạm vi đối chiếu

Frontend được đối chiếu với:

- `docs/api/system-status-api.md` của Backend.
- `docs/reviews/backend/data-masking-permission-health-uat-golive-audit-2026-08-06.md`.
- Hướng dẫn sử dụng theo vai trò và checklist go-live được tài liệu Backend dẫn chiếu.
- Các màn nhân viên, audit, tenant operations và system operations đã có trên Web.

Nguyên tắc phân chia trách nhiệm:

- Data masking, tenant isolation và permission guard là ranh giới bảo mật của Backend. Web chỉ hiển thị đúng contract, chặn thao tác sớm để cải thiện UX và tuyệt đối không có cơ chế tự giải che.
- Health/Job là dữ liệu vận hành chỉ dành cho Platform Admin/Platform Staff có quyền phù hợp.
- UAT checklist trên Web là công cụ hỗ trợ thực hiện, không thay thế biên bản phê duyệt go-live.

## 2. Kết quả triển khai

### 2.1. Data masking và form cập nhật an toàn

- Bổ sung component hiển thị dữ liệu đã che theo metadata `piiMasked` do Backend trả về; Web không còn suy luận bằng ký tự `*`.
- Danh sách nhân viên thông báo rõ email/SĐT được che theo quyền và file Excel áp dụng cùng quy tắc.
- Người có quyền chuyên biệt `employees:pii:read` hoặc Platform Admin được xem PII đầy đủ; Web không còn dùng quyền rộng `users:create`.
- Sửa lỗi quan trọng ở form chi tiết nhân viên: email/SĐT masked không còn được nạp vào input rồi gửi ngược lên API khi HR chỉ sửa trường khác.
- Với trường đã che, form để trống, hiển thị giá trị hiện tại chỉ để tham chiếu và loại field rỗng khỏi payload PATCH.

### 2.2. Permission Guard phía giao diện

- Danh sách nhân viên chỉ hiển thị cho Platform Admin hoặc người có `employees:list`/`employees:read`.
- Route chi tiết nhân viên có guard riêng: Platform Admin hoặc `employees:read`.
- Menu nhân viên dùng cùng điều kiện với route, tránh tình trạng menu cho vào nhưng trang/API từ chối.
- E2E xác nhận role HR không có permission bị chặn 403 trước khi phát sinh request danh sách nhân viên.

Lưu ý: guard của Web không thay thế `@PreAuthorize` và tenant check của Backend; người dùng vẫn có thể tự tạo HTTP request ngoài trình duyệt.

### 2.3. Màn trạng thái hệ thống

- Chuẩn hóa nhãn dễ hiểu cho PostgreSQL, Redis, FCM, AI Service, Random Check Job/Queue, Mail, Disk, Ping và SSL.
- Contract `healthComponents` đã đồng nhất `{status, details}`; Web dùng type chặt và không còn nhánh xử lý scalar cũ.
- Giữ chi tiết kỹ thuật ở vùng mở rộng để Platform Ops phục vụ điều tra nhưng không làm rối trạng thái tổng quan.
- Bổ sung tab `Go-live & UAT` với điều kiện tự động:
  - `overallHealth = UP`;
  - DB, Redis, FCM, AI Service, Random Check Job và Random Check Queue đều `UP`;
  - Backend trả đúng catalog 7 job;
  - toàn bộ job đã chạy `OK` và `stale=false`.

Mỗi job hiển thị description, lần chạy gần nhất, `lastRunDurationMs`, `expectedNextRunAt`, `staleThresholdMinutes` và lỗi. `NEVER_RUN`, `STALE`, `ERROR`, `OK` có màu và diễn giải riêng. Nếu thiếu component/catalog, job chưa từng chạy, stale hoặc lỗi, Web không kết luận sẵn sàng kỹ thuật.

### 2.4. UAT và checklist go-live

- Tích hợp module `/platform/go-live-records`: danh sách/lọc, tạo DRAFT, cập nhật toàn bộ steps, hoàn tất, phê duyệt và từ chối.
- Mỗi biên bản lưu tenant, môi trường, build version, người thực hiện, 15 bước, PASS/FAIL/SKIP, ghi chú và URL bằng chứng.
- Chỉ gửi `completed=true` khi mọi bước đã có kết quả; draft có thể lưu dần các bước đã thực hiện.
- `APPROVED`/`REJECTED` hiển thị read-only, không có nút sửa, ký lại hoặc xóa; muốn chạy lại phải tạo biên bản mới.
- Modal ký nhắc nguyên tắc maker-checker dù Backend hiện chưa bắt buộc người duyệt khác người thực hiện.
- Bổ sung nhóm tiêu chí bảo mật bắt buộc: masking JSON/Excel, cross-tenant 403/404, không cấp quyền xuyên tenant và audit diff phải được redact.

### 2.5. Hướng dẫn sử dụng theo vai trò

- Route Platform: `/admin/help`.
- Route tenant: `/customer/help`.
- Nội dung được phân theo Platform Admin/Ops, Company Admin/HR và Employee.
- Có hướng dẫn các luồng tenant, nhân viên, Face ID, chấm công, random check, báo cáo, notification, 2FA, audit và go-live.
- FAQ giải thích masking, lỗi chấm công, no-response random check và dữ liệu thay đổi sau switch tenant.
- Đã thêm mục Help Center vào menu tương ứng.

## 3. Liên kết nghiệp vụ đã kiểm tra

1. Nhân viên: quyền xem danh sách/chi tiết thống nhất với route và menu; masked contact không làm hỏng payload cập nhật.
2. Audit: Web chỉ trình bày diff đã redact do Backend trả về, không có nút xem raw value.
3. Tenant operations: Platform Admin kiểm tra subscription/usage trước bàn giao; suspend/reactivate vẫn giữ luồng hiện có.
4. Employee create/update: Backend đã ghi audit actor, request ID, IP và old/new value đã redact; Web Audit Viewer dùng dữ liệu này như các entity khác.
5. Face ID và notification: AI Service và FCM là điều kiện health bắt buộc trước go-live.
6. Attendance, random check và subscription: đủ 7 job, bao gồm `SubscriptionExpirationJob`, được giám sát; UAT kiểm tra xuyên suốt tới báo cáo và Excel.

## 4. Kết quả kiểm thử

### Kiểm thử mới

File: `tests/e2e/security-health-uat-golive.spec.ts`

- Platform Admin xem đúng FCM/AI Service, đủ 7 job và readiness go-live.
- UI phân biệt `OK`, `ERROR`, `NEVER_RUN` và `STALE`.
- Tạo DRAFT, lưu/hoàn tất đủ 15 bước, phê duyệt và khóa biên bản thành công.
- HR dùng metadata `piiMasked`; PATCH không chứa email/SĐT đã che.
- HR thiếu employee permission bị chặn trước API.
- Help Center hiển thị đúng nội dung Company Admin/HR và Employee.

Kết quả: **5/5 pass**.

### Hồi quy liên quan

- `employee-management.spec.ts`
- `notification-jobs-retention.spec.ts`
- `saved-filters-audit-tenant-ops.spec.ts`

Kết quả: **11/11 pass**.

### Kiểm tra kỹ thuật

- TypeScript: pass.
- ESLint phạm vi file thay đổi: không có error; còn warning cũ về `any`/`img` trong module nhân viên.
- `next build --webpack`: pass, sinh thành công 48 route; có cả `/admin/help` và `/customer/help`.
- `git diff --check`: pass.

### Bằng chứng giao diện

- `docs/test-evidence/security-health-uat-golive/01-health-golive-uat.png`
- `docs/test-evidence/security-health-uat-golive/02-masked-employee-safe-update.png`
- `docs/test-evidence/security-health-uat-golive/03-role-user-guide.png`

## 5. Các điểm Backend đã xử lý và giới hạn còn lại

Đã đóng toàn bộ đề xuất ưu tiên của báo cáo lần đầu:

1. Đã có `employees:pii:read` và migration giữ quyền cũ.
2. Đã có metadata `piiMasked`.
3. Đã có audit Employee create/update với PII redact.
4. Đã có API lưu và ký biên bản go-live.
5. Đã có expected next run, duration, stale threshold và stale cho đủ 7 job.

Các điểm còn lại không chặn tích hợp hiện tại:

1. System status chưa lưu lịch sử nhiều lượt chạy. Chỉ nên bổ sung sau khi thống nhất retention, dung lượng và nhu cầu truy vấn xu hướng/debug; cờ `stale` hiện đã giải quyết cảnh báo job âm thầm ngừng chạy.
2. Backend chưa cưỡng chế maker-checker. Web khuyến cáo người duyệt khác người thực hiện nhưng không thể coi đây là security boundary. Nếu compliance bắt buộc phân tách nhiệm vụ, Backend cần từ chối khi `approvedBy == performedBy` hoặc bổ sung permission ký riêng.
3. Evidence hiện là URL/reference, chưa có API upload file riêng cho go-live. Web cho nhập URL; nếu cần upload trực tiếp phải thống nhất storage, loại file, dung lượng, malware scan và retention.
4. SMS/Google login, email thật, Face ID/liveness, push trên thiết bị và mở file Excel vẫn cần UAT trên staging/thiết bị thật; mock E2E trình duyệt không chứng minh hạ tầng ngoài hệ thống.

## 6. Kết luận

Web đã cập nhật đầy đủ theo contract Backend mới: masking dùng `piiMasked`/`employees:pii:read`, System Health dùng schema đồng nhất và đủ tín hiệu của 7 job, còn UAT/go-live đã trở thành biên bản có lifecycle và trạng thái bất biến. Trước go-live thật vẫn cần chạy đủ UAT trên môi trường tích hợp; các điểm còn lại ở mục 5 là quyết định compliance/vận hành tiếp theo, không phải lỗi tích hợp hiện tại.
