# Báo cáo hardening toàn hệ thống Web — 11/08/2026

## 1. Kết luận

Frontend Web đã được rà soát và hardening theo các nhóm rủi ro có thể xử lý độc lập ở phía Web. Production build, TypeScript, dependency audit và toàn bộ regression trình duyệt đều đạt. Không thay đổi contract API nghiệp vụ đang chạy ổn định.

Kết quả kiểm chứng cuối:

- `npm audit --omit=dev --audit-level=high`: 0 vulnerability.
- `npm run typecheck`: pass.
- `npm run lint`: pass, 0 error và 0 warning.
- `npm run build -- --webpack`: pass, có production `BUILD_ID`.
- `LIVE_BACKEND=true npm run test:e2e -- --workers=1`: 88 pass, 1 test Face ID live được skip vì cần credential/dữ liệu riêng.
- `git diff --check`: pass.

## 2. Các thay đổi đã thực hiện

### Dependency, runtime và CI

- Nâng Next.js và `eslint-config-next` lên 16.3.0; cập nhật các dependency liên quan để khắc phục toàn bộ cảnh báo audit hiện tại.
- Khóa runtime dự án ở Node.js 20 qua `.nvmrc` và `package.json.engines` để đồng nhất local/CI.
- Thêm `npm run audit`; `npm run check` nay kiểm tra audit, lint, typecheck và build.
- CI chạy thêm production dependency audit và regression Playwright tuần tự.
- Hai flow auth đọc OTP/token trực tiếp từ Docker Backend chỉ chạy khi có `LIVE_BACKEND=true`; CI mặc định vẫn chạy toàn bộ test độc lập với Backend. Face ID live dùng cùng quy ước này.

### Môi trường và tích hợp ngoài

- Tập trung đọc/validate biến public trong `src/config/env.ts`; URL API sai sẽ fail sớm với thông báo rõ.
- Google Login/Google Linking không còn khởi tạo SDK bằng client ID rỗng. Khi chưa cấu hình, login Google được ẩn và màn liên kết hiển thị cảnh báo quản trị.
- Firebase chỉ được coi là sẵn sàng khi đủ bốn biến bắt buộc; cấu hình thiếu trả lỗi thân thiện thay vì làm hỏng trang.
- Mobile deep-link, API URL, Firebase và Google không còn đọc rải rác từ `process.env`.
- Bản đồ dùng tile URL/attribution có thể cấu hình. Geocoding đi qua Route Handler cùng domain, có validation, timeout và lỗi 502 thân thiện; browser không gọi thẳng Nominatim nữa.
- Loại phụ thuộc icon marker Leaflet từ CDN `unpkg`; marker được render nội bộ.
- Cập nhật tài liệu cài đặt IP LAN, Backend URL, Google/Firebase, bản đồ và geocoding trong `.env.example`/README.

### Quyền và điều hướng

- Chặn truy cập URL trực tiếp cho tạo nhân viên, tạo role nền tảng và sửa role nền tảng bằng `RoleGuard`.
- Trang sửa role không gọi query nhạy cảm trước khi guard quyền hoàn tất.
- Bổ sung test URL trực tiếp để bảo đảm người thiếu quyền nhận 403 và API nghiệp vụ không bị gọi.
- Xóa route placeholder `/admin/reports`; báo cáo tenant chính thức vẫn ở `/customer/reports`.

### Độ bền UI và nâng cấp thư viện

- Notification shell chịu được response thành công nhưng `data=null`/page sai cấu trúc từ deployment cũ.
- Deep-link notification dùng Next Router; redirect logout 401 dùng hard navigation có chủ đích để xóa toàn bộ state.
- Thay API Ant Design bị deprecate: `destroyOnHidden`, Alert `title`, pagination `placement`.
- Thay các `watch()` gây cảnh báo React Compiler bằng `useWatch` tại các form bị ảnh hưởng.
- Sửa fixture RBAC, hướng dẫn PII và IP whitelist để test phản ánh contract hiện tại.
- Retention UI không còn khẳng định cứng mốc 30/90 ngày khi Backend chưa trả policy chính thức.

### Loại bỏ lint warning — cập nhật 12/08/2026

- Loại toàn bộ 97 `explicit any`, ưu tiên contract service/hook trước rồi mới tới table, form và component.
- Query key và request params của workspace, site, geofence và role nay dùng đúng type dùng chung với service.
- Chuẩn hóa xử lý lỗi API từ `unknown` qua `getApiErrorMessage`; vẫn giữ nguyên ưu tiên `userMessage/message/details` từ Backend.
- Table Ant Design dùng `ColumnsType<T>` và sorter được narrowing an toàn, không còn ép `columns as any`.
- Form React Hook Form dùng `Control<T>`/`Path<T>` và schema Dayjs rõ ràng; bỏ toàn bộ resolver cast bị suppress.
- `ApiResponse` mặc định chuyển từ `any` sang `unknown`, buộc nơi tiêu thụ phải khai báo response contract.
- Ảnh động chuyển sang `next/image` với `unoptimized` để không khóa domain Backend/MinIO; placeholder Face ID không tồn tại được thay bằng icon vector nội bộ.
- Regression cuối: 86 pass, 3 live-integration skip ở chế độ CI; production build 48/48 route thành công.

### TOTP QR — cập nhật 12/08/2026

- Bỏ iframe `qrCodeUrl` vì Backend giữ đúng `X-Frame-Options: DENY`; Web tự render QR SVG từ contract `otpauthUri`.
- Hiển thị đếm ngược theo `expiresAt`, khóa xác nhận khi phiên hết hạn và cho phép tạo QR mới.
- Giữ khóa Base32 để nhập thủ công; `qrCodeUrl` chỉ còn trong type dưới dạng field deprecated để tương thích ngược.
- Regression kiểm tra QR SVG hiện hữu và xác nhận màn hình không còn iframe.

## 3. Phạm vi chưa tự quyết định

Các mục sau cần quyết định kiến trúc hoặc Backend contract trước khi triển khai; không nên vá riêng ở Web:

1. **Phiên đăng nhập trong `localStorage`**: nên chuyển access/refresh token sang cookie `HttpOnly`, `Secure`, `SameSite` hoặc mô hình BFF. Việc này cần Backend đổi cơ chế phát hành/refresh/logout và kế hoạch migration đồng bộ Web/App.
2. **Chốt kỳ lương**: hiện Web có readiness/cảnh báo export nhưng chưa có thực thể kỳ lương bất biến. Khuyến nghị Backend bổ sung payroll period với trạng thái `DRAFT → REVIEWED → LOCKED → EXPORTED` trước khi Web dựng màn khóa sổ.
3. **Maker-checker go-live**: Web đã cảnh báo người duyệt nên khác người thực hiện, nhưng Backend chưa enforce. Nếu đây là yêu cầu tuân thủ, Backend phải từ chối self-approval.
4. **Map/geocoding production**: cấu hình hiện đã thay được provider; trước go-live cần chọn nhà cung cấp có API key, quota, SLA và điều khoản sử dụng phù hợp. Route Handler hiện không thay thế rate limit phân tán tại gateway.
5. **Policy retention và lịch sử job**: Web cần endpoint policy chính thức và lịch sử nhiều lần chạy nếu vận hành yêu cầu audit sâu; không nên suy đoán số ngày từ UI.
6. **UAT dịch vụ thật**: SMS/email, Google OAuth, FCM, camera/Face ID/liveness và URL qua IP/domain staging vẫn cần chạy với credential cùng thiết bị thật.

## 4. Khuyến nghị thứ tự tiếp theo

1. Chạy UAT staging bằng domain HTTPS thật và credential tích hợp production-like.
2. Chốt phương án session HttpOnly/BFF và payroll locking ở Backend trước.
3. Chọn provider bản đồ/geocoding và áp rate limit tại gateway.
4. Duy trì lint ở mức 0 warning bằng CI; mọi contract API mới phải có type trước khi nối UI.
5. Chỉ sau các bước trên mới ký biên bản go-live tenant đầu tiên.
