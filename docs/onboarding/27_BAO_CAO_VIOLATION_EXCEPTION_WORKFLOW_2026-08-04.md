# Báo cáo Web — Violation, random-check dispute và giải trình (2026-08-04)

## Phạm vi đối chiếu

Nguồn hợp đồng: `violation-management-api.md`, `random-check-ui-guide.md`, `attendance-ui-permissions-guide.md`, `checkin-ui-permissions-guide.md` và code DTO/controller backend thực tế.

| Nghiệp vụ | Nơi thực thi | Kết quả Web |
|---|---|---|
| Tự sinh `no_response`, `location_fail`, `face_fail`, `liveness_fail` | Backend/job | Web chỉ đọc, không tạo thủ công |
| HR kích hoạt kiểm tra ngay | Random Check | Đã có reason bắt buộc, mode tùy chọn và cảnh báo số lượt gửi trong ngày |
| Danh sách scheduled checks | Random Check | Đã có filter, pagination, site-scope, detail, dispatch/cancel |
| Chi tiết scheduled check | Random Check | Đã hiển thị evidence và `violations[]`, liên kết sang đúng `scheduledCheckId` |
| Danh sách vi phạm | Vi phạm | Đã dựng filter nhân viên/site/loại/trạng thái/ngày và pagination |
| Chi tiết/resolve vi phạm | Vi phạm | Đã dựng evidence GPS/Face/liveness, giải trình, confirm và dismiss có audit reason |
| Override check-in | Chấm công | Đã tồn tại; reason bắt buộc và tự refresh bảng công |
| Điều chỉnh attendance | Bảng công | Đã tồn tại; reason bắt buộc, lock/unlock/recompute và cảnh báo payroll readiness |
| Nhân viên giải trình | Cần giải thích | Đã dựng inbox hợp nhất, upload evidence private, trạng thái đã gửi/chờ HR và sửa giải trình |

## Đối chiếu tài liệu backend cập nhật — vòng 2026-08-04

- Chuyển `resolution`, `resolutionReason`, `affectsAttendance` thành field bắt buộc trong type Web; loại bỏ nhánh cảnh báo “backend còn thiếu field”.
- Modal chi tiết hiển thị đầy đủ kết quả, lý do/ghi chú và UUID người xử lý sau khi reload.
- Violation có nguồn `checkinId` mở trực tiếp được hồ sơ check-in để HR đối chiếu GPS, Face ID/liveness và giải trình trên cùng luồng xử lý.
- Bảng violation gửi `sortBy`/`sortDir` về backend khi sort theo ngày, nhân viên, site hoặc loại vi phạm.
- Bộ lọc violation và lịch sử check-in không giới hạn ở site `active`; dữ liệu lịch sử của site đã ngừng hoạt động vẫn tra cứu được.
- Sửa đoạn 2.2 cũ trong `checkin-management-api.md`: checkout dùng policy snapshot tại check-in theo V78/code thật, không resolve live giữa ca.
- Không dựng thêm màn “Vi phạm của tôi” riêng vì tài liệu đánh dấu tùy chọn và inbox `/me/exceptions` đã bao phủ đúng hành động cần làm, tránh hai màn self-service trùng nghiệp vụ.

## Liên kết dữ liệu và quyền

- Violation resolve làm mới đồng thời cache violation, scheduled check và attendance; dismiss violation cuối của ngày không để badge bảng công bị stale.
- Scheduled check detail dùng summary nhúng, chỉ chuyển sang màn violation khi HR cần dữ liệu đầy đủ.
- Không cho FE tạo violation; tác vụ nghi ngờ dùng manual random check để vẫn đi qua policy/evidence/lifecycle chuẩn.
- Màn HR dùng `violations:list/read`; nút resolve và attendance-impact chỉ dành cho `violations:update`.
- Inbox giải trình là self-scope theo JWT/tenant hiện hành, không dùng permission quản trị.
- URL giải trình do server trả được kiểm tra phải bắt đầu bằng `/api/v1/tenants/{activeTenantId}/` trước khi POST, tránh gửi dữ liệu sang tenant khác.

## Các điểm backend đã hoàn tất trong vòng tích hợp

- DTO list trả `resolution`/`affectsAttendance`; DTO detail trả thêm `resolutionReason`. Bảng phân biệt chính xác “Đã xác nhận vi phạm” và “Đã bỏ qua”, modal quản lý attendance-impact an toàn.
- Explain check-in/violation hỗ trợ multipart JPEG/PNG/WEBP tối đa 5MB. Evidence nằm trong private object storage, HR tải qua API tenant-scoped có permission; client không gửi URL public.
- `/me/exceptions` trả `hasExplanation` và `employeeNote`. Web hiện “Đã giải trình · chờ HR”, nạp lại note cũ và cho cập nhật thay vì gửi lặp mù.

## Kiểm thử

- `npm run typecheck`: pass.
- `npm run lint`: pass, còn warning cũ toàn dự án, không có error.
- `npm run build -- --webpack`: pass trên Next.js 16.2.9.
- Backend `/actuator/health`: `UP`; DTO/controller thực tế đã được đối chiếu trực tiếp, đủ `resolution`/`resolutionReason`/`affectsAttendance`, inbox state, multipart và API tải evidence private.
- `PLAYWRIGHT_PORT=3101 npx playwright test tests/e2e/violation-management.spec.ts tests/e2e/checkin-management.spec.ts`: **5/5 pass**.
- Random-check regression tập trung (manual count + embedded violation + evidence): **1/1 pass**.
- Kịch bản E2E: HR tải evidence private qua Bearer token, cập nhật attendance-impact, dismiss với reason và đọc lại audit decision; nhân viên sửa note cũ/gửi ảnh multipart tới đúng `explainEndpoint`; check-in và site-scope không hồi quy.
- Evidence: `docs/test-evidence/violation-management/01-hr-violation-detail.png`.

## Kết luận

Luồng Web đã hoàn tất cho danh sách/chi tiết/resolve violation, liên kết random check–attendance và self-service explanation có evidence private. Phần còn lại thuộc vận hành: cấu hình retention/lifecycle cho evidence và quy trình QA với dữ liệu/camera thật trước production.
