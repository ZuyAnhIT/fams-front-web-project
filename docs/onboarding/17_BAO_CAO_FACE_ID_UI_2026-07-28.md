# Báo cáo hoàn thiện Face ID trên Front Web

Ngày kiểm tra: 28/07/2026  
Phạm vi: Front Web FAMS, đối chiếu `face-id-management-api.md` và
`face-id-ui-permissions-guide.md` của Backend.

## 1. Kết luận

Front Web đã có phần trạng thái Face ID cơ bản, nhưng trước đợt này chưa hỗ trợ
nghiệp vụ xét duyệt mới và đang gộp sai `pending` vào trạng thái mẫu Face ID.
Đợt triển khai đã hoàn thiện:

- Báo cáo trạng thái đăng ký/consent có phân trang và lọc.
- Tách độc lập mẫu đã duyệt (`status`) với yêu cầu đang xét
  (`reviewStatus`). Nhân viên đăng ký lại vẫn dùng mẫu cũ cho đến khi mẫu mới
  được duyệt.
- Hàng đợi chờ xét duyệt cho người có quyền `face_id:manage`.
- Tải ảnh JPEG chờ duyệt qua Bearer token dưới dạng `blob`, hiển thị thumbnail
  và preview ảnh lớn; object URL được thu hồi khi component đổi dữ liệu/unmount.
- Duyệt và từ chối kèm lý do, làm mới đồng bộ hàng đợi, báo cáo và chi tiết
  nhân viên.
- Chi tiết nhân viên hiển thị trạng thái xét duyệt, thời gian nộp, số khung hình
  và lý do bị từ chối.
- Không cho HR/Admin tự duyệt Face ID của chính mình khi có thể xác định
  `employee.userId === currentUser.id`.
- Thu hồi được cả mẫu đang hoạt động hoặc yêu cầu đang chờ.
- Cấu hình `requireFaceIdCheckin` khi tạo/sửa công trình và hiển thị lại trên
  chi tiết công trình.
- Route và menu hỗ trợ phân quyền theo `reports:list` hoặc `face_id:manage`,
  không phụ thuộc cứng hoàn toàn vào tên role.

Web không dựng luồng nhân viên tự consent/chụp liveness/check-in vì tài liệu xác
định đây là luồng App. Không bổ sung upload ảnh tĩnh tự phục vụ trên Web vì sẽ
làm yếu cơ chế chống giả mạo.

## 2. Luồng nghiệp vụ sau triển khai

1. Nhân viên tự ghi nhận consent trên App.
2. Backend tạo challenge ngắn hạn, App chụp đúng chuỗi hành động liveness và
   gửi từng frame.
3. Backend tạo hồ sơ `reviewStatus=pending`; mẫu đang được duyệt trước đó (nếu
   có) vẫn tiếp tục hoạt động.
4. HR/Admin vào **Quản lý Face ID > Chờ duyệt**, xác minh độc lập rồi duyệt hoặc
   từ chối có lý do.
5. Khi duyệt, mẫu mới trở thành `status=enrolled`.
6. Nếu site có `requireFaceIdCheckin=true`, App chỉ cho chấm công bằng Face ID
   đã duyệt và challenge liveness hợp lệ.
7. Khi nhân viên inactive/terminated hoặc rút consent, backend thu hồi mẫu;
   Web hiển thị trạng thái tương ứng.

Quan hệ dữ liệu hợp lý là:

`User -> Employee -> Consent/Profile -> Face template/review -> Assignment -> Site policy -> Check-in`

Workspace dùng để tổ chức nhân sự; Assignment quyết định nhân viên được chấm
công tại site nào; Site policy quyết định site đó có bắt buộc Face ID hay không.
Không dùng workspace thay cho assignment và không dùng ảnh Face ID làm dữ liệu
hồ sơ nhân sự thông thường.

## 3. Đánh giá công nghệ và đề xuất Backend

### P0 “HR duyệt mù” — Backend đã xử lý, Web đã tích hợp

Backend mới đã bổ sung:

- `GET /tenants/{tenantId}/employees/{employeeId}/face-id/pending-review/photo`.
- Kiểm tra `face_id:manage` và site-scope.
- Trả trực tiếp `image/jpeg`.
- Xóa `pending_photo_path` ngay khi approve/reject.

Web đã bỏ cảnh báo “chỉ có metadata”, tải ảnh bằng `apiClient` để Bearer token
được gửi đúng, hiển thị thumbnail/preview và xóa cache ảnh sau approve/reject.
Không dùng URL API trực tiếp làm `src` vì ứng dụng không xác thực bằng cookie.
Blob ảnh đặt `gcTime=0`, object URL được `revoke` khi rời màn hình và nút Duyệt
bị khóa nếu ảnh chưa tải được; nút Từ chối vẫn dùng được để xử lý hồ sơ lỗi.

Phần kết quả từng action liveness, quality/PAD decision và model version vẫn
chưa được trả cho Web; có thể bổ sung sau dưới dạng audit detail nếu nghiệp vụ
yêu cầu HR phân tích sâu hơn thay vì chỉ đối chiếu khuôn mặt.

Không nên chỉ dựa vào `solvePnP + EAR + MiniFASNet` rồi gọi là mức bảo mật ngân
hàng. NIST yêu cầu facial recognition có presentation attack detection (PAD);
việc đánh giá nên theo ISO/IEC 30107-3, có kiểm thử độc lập, kiểm thử theo nhóm
nhân khẩu học, chống injection/deepfake và giới hạn retry.

Tài liệu tham khảo:

- NIST SP 800-63B: https://pages.nist.gov/800-63-4/sp800-63b.html
- NIST SP 800-63A: https://pages.nist.gov/800-63-4/sp800-63a.html
- AWS Face Liveness: https://docs.aws.amazon.com/rekognition/latest/dg/face-liveness.html
- AWS recommendations: https://docs.aws.amazon.com/rekognition/latest/dg/recommendations-liveness.html
- Azure Face Liveness: https://learn.microsoft.com/en-us/azure/ai-services/face/concept-face-liveness-detection

### P1 — nên bổ sung

- Pending queue cần search/filter/sort/pagination phía server khi tenant lớn.
- Backend nên trả `canReview` hoặc `isSelf` trong row pending (hoặc loại hồ sơ
  của chính người gọi khỏi thao tác). `/auth/me` hiện không trả `employeeId`,
  nên Web chỉ chặn chắc chắn ở màn chi tiết có `employee.userId`; hàng đợi vẫn
  phải dựa vào Backend trả 403.
- Dữ liệu seed hiện tạo các row `reviewStatus=pending` nhưng toàn bộ
  `pending_photo_path` là `NULL`. Demo Web vì vậy hiển thị “Không tải được ảnh”
  dù API production hoạt động đúng. Seed nên tạo ảnh fixture tương ứng hoặc
  không tạo trạng thái pending giả.
- Chuẩn hóa thông báo và error code cho approve/reject/revoke. Swagger consent
  đã được Backend cập nhật đúng.
- Có alternative/manual path cho người không đồng ý sinh trắc học, không thể
  dùng camera hoặc thất bại liveness lặp lại; không hiển thị raw confidence cho
  người dùng cuối và rate-limit các lần thử.
- Chế độ “HR kiosk” chỉ nên mở khi có camera-only capture, kiểm soát virtual
  camera/injection và audit người vận hành. Không nên dùng form upload file ảnh.

### Pháp lý

Tài liệu Backend đang dẫn chủ yếu Nghị định 13/2023/NĐ-CP. Từ 01/01/2026,
Luật Bảo vệ dữ liệu cá nhân số 91/2025/QH15 đã có hiệu lực; chính sách consent,
lưu trữ, rút consent, xóa dữ liệu, DPIA/đánh giá tác động và thông báo người dùng
cần được bộ phận pháp lý rà soát theo luật hiện hành. Đây là nhận xét kỹ thuật,
không phải tư vấn pháp lý.

Nguồn:

- Quốc hội: https://quochoi.vn/tintuc/Pages/tin-hoat-dong-cua-quoc-hoi.aspx?ItemID=94817
- Thư viện Quốc hội: https://thuvienso.quochoi.vn/handle/11742/103334

## 4. Kiểm thử đã thực hiện

Các lệnh:

```bash
npm run typecheck
npm run lint -- src/features/customer/report \
  src/features/customer/employee/components/EmployeeFaceIdTab.tsx \
  src/features/customer/site/components \
  src/app/customer/reports/face-id-enrollment/page.tsx \
  tests/e2e/face-id-management.spec.ts
npx playwright test tests/e2e/face-id-management.spec.ts \
  tests/e2e/site-geofence-management.spec.ts --project=chromium
LIVE_BACKEND=true npx playwright test \
  tests/e2e/face-id-live-backend.spec.ts --project=chromium
```

Kết quả:

- TypeScript: pass.
- ESLint phạm vi thay đổi: 0 error; còn cảnh báo kỹ thuật cũ về `<img>` và
  `any`, không chặn build.
- Playwright mock Face ID: **2/2 pass**.
- Playwright Backend thật: **1/1 pass**.
- Regression site/geofence đã chạy trước đó: **4/4 pass**.
- Production build đã chạy thành công trong web server của Playwright.
- Backend live: `fams-api`, `fams-ai`, PostgreSQL, Redis đều healthy; Flyway
  đang ở V76.

Kịch bản Face ID:

- Báo cáo hiển thị đồng thời mẫu `enrolled` và yêu cầu `pending`.
- Thống kê pending và điều hướng hàng đợi.
- Approve gọi đúng
  `POST /tenants/{tenantId}/employees/{employeeId}/face-id/approve`.
- Reject bắt buộc lý do và gửi đúng `{ "reason": "..." }`.
- Ảnh review được tải bằng Bearer token, response live là `200 image/jpeg`,
  279.922 byte, kích thước 910×1137 và render thành công trên trình duyệt.
- Tạo site gửi đúng `requireFaceIdCheckin=true`.
- Bộ regression site/geofence vẫn pass.

Để kiểm tra response ảnh trên dữ liệu seed cũ, test tạm gắn ảnh fixture vào
`pending_photo_path` của một hồ sơ pending, gọi API/Web thật, rồi khôi phục
`NULL`. Không approve/reject và không thay đổi trạng thái nghiệp vụ. Sau test,
DB được xác nhận còn 0 `pending_photo_path` khác với trạng thái ban đầu.

Minh chứng:

- `docs/test-evidence/face-id-management/01-report-approved-and-review-status.png`
- `docs/test-evidence/face-id-management/02-review-queue.png`
- `docs/test-evidence/face-id-management/03-live-backend-review-photo.png`
- `docs/test-evidence/site-geofence-management/01-hr-site-list-create.png`

## 5. Phạm vi chưa thể xác nhận

- Đã test sống hàng đợi và JPEG với Backend/DB/AI service thật; chưa test camera
  thật hoặc active-liveness end-to-end từ thiết bị di động.
- Luồng App consent, liveness enrollment, available sites và check-in không nằm
  trong repository Front Web này.
- Chưa thể xác nhận độ chính xác/chống giả mạo thực tế nếu chưa có kết quả kiểm
  thử PAD độc lập và tập dữ liệu đại diện.
