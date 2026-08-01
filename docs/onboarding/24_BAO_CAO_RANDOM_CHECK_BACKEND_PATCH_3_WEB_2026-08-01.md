# Báo cáo đồng bộ Random Check Web theo bản vá Backend lần 3

Ngày thực hiện: 01/08/2026  
Phạm vi: `fams-front-web-project`  
Nguồn contract: `random-check-config-review.md`, `random-check-ui-guide.md` bản vá lần 3 và code Backend hiện tại.

## 1. Kết luận

Web đã tích hợp endpoint ảnh selfie bằng chứng mới và giữ nguyên UI vai trò theo contract đã được Backend/tài liệu thống nhất:

- `CheckResponseDto.hasPhotoEvidence=true`: modal chi tiết hiện nút **Xem ảnh bằng chứng**.
- Ảnh chỉ được tải lazy khi HR bấm nút; không tải ảnh cho bảng danh sách hay ngay khi mở detail.
- Web gọi `GET /scheduled-checks/{checkId}/photo` qua `apiClient`, tự gắn Bearer token và nhận Blob JPEG.
- Blob được chuyển thành object URL tạm để hiển thị; URL được thu hồi khi dữ liệu đổi/component đóng.
- Có modal ảnh riêng, trạng thái loading/error và cảnh báo dữ liệu sinh trắc học nhạy cảm.
- Khi `hasPhotoEvidence=false`, không gọi endpoint ảnh và giải thích rõ lượt kiểm tra không có ảnh.
- Form vai trò tiếp tục chỉ cho `worker`/`supervisor`; không mở free-text/autocomplete sai contract.

Không thay đổi App trong đợt này. Endpoint `my-result`, notification metadata và FCM vẫn thuộc repository App.

## 2. Luồng ảnh bằng chứng

```text
HR mở chi tiết check
  → GET /scheduled-checks/{checkId}
  → response.hasPhotoEvidence=false
       → hiện “Không có ảnh”, không gọi API ảnh
  → response.hasPhotoEvidence=true
       → hiện nút Xem ảnh bằng chứng
       → HR bấm nút
       → GET /scheduled-checks/{checkId}/photo + Bearer token
       → Backend kiểm tra permission + tenant + site-scope
       → Blob JPEG → object URL tạm → modal/lightbox
       → đóng/thay dữ liệu → revoke object URL
```

Web không dùng `<img src="API URL">` vì cách đó không gắn được Authorization header theo cơ chế hiện tại. Web cũng không lưu Blob vào localStorage/IndexedDB và không tải hàng loạt, hạn chế phạm vi tồn tại của dữ liệu nhạy cảm trên trình duyệt.

## 3. Trạng thái UI và lỗi

| Tình huống | Hành vi Web |
|---|---|
| `hasPhotoEvidence=false` | Không hiện nút tải; giải thích không có ảnh gửi/lưu |
| `hasPhotoEvidence=true` | Hiện nút, chưa gọi API cho tới khi HR bấm |
| Đang tải | Spinner “Đang tải ảnh có xác thực” |
| 200 JPEG | Hiện ảnh và cho xem kích thước lớn |
| 403/404/mất file | Hiện thông báo ảnh bị xóa, không tồn tại hoặc không còn quyền |
| Đóng modal/chuyển ảnh | Thu hồi object URL tạm |

401 tiếp tục đi qua interceptor refresh-token/đăng xuất chung. 403/404 không được biến thành ảnh lỗi công khai hoặc fallback sang đường dẫn nội bộ AI.

## 4. Contract vai trò đã thống nhất

Backend xác nhận `Assignment.role` chỉ có hai giá trị ở cả request validation và DB constraint:

- `worker`
- `supervisor`

Web đã dùng dropdown cố định đúng hai giá trị từ trước nên không cần sửa. `applicableRoles=[]` vẫn mang nghĩa áp dụng cho tất cả; mọi giá trị khác hai enum trên sẽ là cấu hình chết và không được UI cho phép tạo.

## 5. Kiểm thử

Test mở rộng tại `tests/e2e/random-check-management.spec.ts` kiểm tra:

| Kịch bản | Kết quả |
|---|---|
| Nút ảnh chỉ hiện khi `hasPhotoEvidence=true` | PASS |
| Không request ảnh trước khi HR bấm nút | PASS |
| Chỉ phát sinh đúng một request ảnh sau thao tác | PASS |
| Request ảnh mang `Authorization: Bearer ...` | PASS |
| Blob ảnh hiển thị trong modal riêng | PASS |
| Face score, GPS, liveness và manual audit metadata vẫn đúng | PASS |
| Regression tenant/site policy, Attendance, Check-in, RBAC/site-scope | PASS |

Kết quả công cụ:

- TypeScript: PASS.
- ESLint Random Check + test: PASS, 0 error/warning.
- Next.js production build bằng Webpack: PASS, 39 route.
- Playwright Random Check + Attendance + Check-in + RBAC: **14/14 PASS**.
- `git diff --check`: PASS.

Bằng chứng giao diện được cập nhật tại:

- `docs/test-evidence/random-check-management/02-manual-check-evidence.png`

## 6. File cập nhật trong bản vá lần 3

- `src/features/customer/random-check/types.ts`
- `src/features/customer/random-check/services/scheduled-check.service.ts`
- `src/features/customer/random-check/hooks/use-scheduled-check.ts`
- `src/features/customer/random-check/components/ScheduledCheckDetailModal.tsx`
- `src/features/customer/random-check/components/RandomCheckEvidencePhotoModal.tsx`
- `tests/e2e/random-check-management.spec.ts`

## 7. Giới hạn còn lại

Không còn hạng mục Web P1 từ hai báo cáo trước chưa được tích hợp. Các giới hạn Backend đã công khai vẫn còn:

1. Ca qua đêm chưa tính giao shift/policy window chính xác — P2, cần xử lý trước khi bật Random Check cho tenant vận hành nhiều ca đêm.
2. Chưa có aggregate Face ID enrollment theo site/assignment — P2, Web chưa thể cảnh báo chính xác X/Y người chưa enrolled.
3. Ảnh selfie hiện được lưu vô thời hạn tại AI service — P2 về retention. Trước khi vận hành production với dữ liệu sinh trắc học, nên xác định số ngày lưu, job dọn dữ liệu, legal hold và audit ai đã xem ảnh.

Hai giới hạn App về trạng thái lỗi AI riêng biệt và FCM data payload không ảnh hưởng Company Web.
