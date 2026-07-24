# Báo cáo hoàn thiện và kiểm thử bộ Authentication Web — 24/07/2026

## 1. Kết luận

Bộ tính năng Authentication trên web đã được cập nhật theo `auth-api.md` ngày 24/07/2026 và đạt các vòng kiểm tra tự động ở frontend lẫn backend đang chạy local.

- Chromium end-to-end: **7/7 test đạt**.
- Backend auth regression: **64 assertion đạt** trong 7 script, cộng thêm xác nhận email-change happy path trực tiếp đạt HTTP 200.
- Frontend: lint không có error, TypeScript đạt, production build đạt.
- Một race-condition backend của đổi mật khẩu đã được phát hiện khi retest và sửa bằng timestamp phát hành token chính xác tới millisecond.

Các luồng cần SMS/Firebase/Google thật vẫn cần kiểm tra staging với nhà cung cấp và tài khoản thật trước khi production; xem mục 7.

## 2. Phạm vi đã hoàn thiện

### Luồng đăng ký và đăng nhập

- Đăng ký phone dùng OTP do backend quản lý, không nhầm với Firebase Phone Auth.
- Đăng ký email, màn chờ xác thực, gửi lại email và trang `/verify-email`.
- Login password gửi đúng `identifier`, hỗ trợ email/phone và `deviceId` ổn định, có tên trình duyệt/nền tảng dễ nhận biết.
- Login có TOTP và hỗ trợ cả mã Authenticator lẫn backup code.
- Login nhanh phone gửi Firebase ID token kèm `deviceId`; nếu backend yêu cầu TOTP thì chuyển tiếp đúng sang bước TOTP.
- Google login tiếp tục đổi Google ID token thành session FAMS và lấy `/me` sau khi đăng nhập.

### Mật khẩu

- `/forgot-password` và `/reset-password?token=...` đúng contract.
- Request reset chỉ gửi `token` + `newPassword`, không gửi field UI-only `confirmPassword`.
- Đổi mật khẩu chỉ gửi `currentPassword` + `newPassword`.
- Sau đổi mật khẩu HTTP 200, web xóa session local và chuyển thẳng về đăng nhập vì mọi token cũ đã bị backend thu hồi.

### Hồ sơ và phương thức đăng nhập

- `PATCH /me` chỉ gửi `displayName`, `dateOfBirth`, `hometown`, `gender`, `address`.
- Email dùng `POST /profile/email/request-change`, chỉ cập nhật sau khi người dùng mở link xác thực.
- Phone dùng `POST /profile/phone/request-change` → nhập OTP → `POST /profile/phone/confirm-change`.
- Avatar dùng multipart upload; đã thêm xóa avatar qua `DELETE /profile/avatar`.
- Đã thêm UI link/unlink Google; Google-only account bị chặn unlink sẽ được hướng dẫn đặt mật khẩu qua quên mật khẩu.
- Hồ sơ hiển thị trạng thái `emailVerified`, `phoneVerified`, `googleLinked`.

### Phiên và thiết bị

- Danh sách phiên từ `GET /sessions`, đánh dấu `current: true` là “Thiết bị này”.
- Thu hồi một phiên theo đúng `session.id`.
- Tách rõ ba thao tác: đăng xuất thiết bị hiện tại, đăng xuất các thiết bị khác, đăng xuất tất cả.
- Hiển thị browser/OS, IP, thời gian hoạt động và hết hạn.

## 3. Lỗi phát hiện và cách sửa

### 3.1 Frontend gửi field không còn được backend nhận

Trước sửa, form hồ sơ gửi `phone` qua `PATCH /me`; reset/đổi mật khẩu còn gửi `confirmPassword`. Backend bỏ qua phone và contract không khai báo confirmPassword.

Đã tách phone/email/avatar sang API riêng và loại các field UI-only khỏi payload.

### 3.2 Đổi mật khẩu chưa kết thúc session trên web

Trước sửa, UI chỉ hiện toast và giữ người dùng ở trang cài đặt dù access token đã chết. Request kế tiếp mới nhận 401.

Đã xóa token/user local ngay khi đổi thành công và chuyển về `/login`.

### 3.3 Email-change link có hai namespace token

Token xác thực đăng ký và token đổi email không thể gọi chung một endpoint. Backend thực tế tạo link `/api/v1/auth/profile/email/confirm-change`.

Đã thêm Next proxy chuyển link này sang `/verify-email?...&mode=email-change`; BFF dùng `mode` để gọi đúng backend endpoint. Tài liệu backend cũng đã được chỉnh lại cho khớp code đang chạy.

### 3.4 Race-condition token sau đổi mật khẩu

Lần chạy regression đầu tiên phát hiện: đổi mật khẩu thành công, login lại lấy token mới, nhưng đổi mật khẩu lần hai đôi lúc nhận 401. Nguyên nhân là JWT `iat` chỉ có độ chính xác một giây, trong khi watermark thu hồi cũng dùng giây; token mới phát hành cùng giây có thể bị coi là token cũ.

Đã thêm claim `issuedAtMillis`, lưu watermark Redis bằng millisecond và giữ tương thích với key cũ dạng giây. Sau sửa, test bỏ `sleep 1` vẫn đạt 10/10.

### 3.5 Thu hồi thiết bị chưa làm access token chết ngay

Danh sách phiên trước đó chỉ revoke refresh token. Thiết bị bị thu hồi vẫn có thể dùng access token hiện tại cho tới khi tự hết hạn (mặc định 15 phút).

Đã thêm watermark Redis theo `userId + deviceId`; xóa một phiên hoặc “đăng xuất các thiết bị khác” nay làm access token tương ứng nhận 401 ngay ở request kế tiếp, trong khi thiết bị hiện tại vẫn hoạt động.

## 4. Kết quả kiểm thử trình duyệt

Lệnh: `npm run test:e2e`

| # | Kịch bản | Kết quả |
|---:|---|---|
| 1 | Đăng ký phone qua OTP backend thật, login bằng phone/password | Đạt |
| 2 | Đăng ký email, resend, xác thực token, login | Đạt |
| 3 | Email chưa xác thực hiển thị CTA gửi lại | Đạt |
| 4 | Google credential → FAMS session → `/me.googleLinked` | Đạt |
| 5 | Reset/đổi mật khẩu đúng payload và xóa session local | Đạt |
| 6 | Hồ sơ, email/phone verify, xóa avatar, link Google | Đạt |
| 7 | Link đổi email và quản lý phiên chọn lọc | Đạt |

Các test 1–2 chạy qua backend/PostgreSQL/Redis thật. Các nhánh Google SDK và UI của API bảo mật được mock ở ranh giới trình duyệt để test deterministically; contract tương ứng được kiểm tra lại bằng script backend thật ở mục 5.

## 5. Kết quả regression API backend thật

Backend `http://localhost:8080` ở trạng thái healthy khi chạy.

| Script/kiểm tra | Kết quả |
|---|---:|
| `test_change_password.sh` — có regression immediate re-login, không sleep | 10/10 |
| `test_profile_fields_and_avatar.sh` | 8/8 |
| `test_sessions.sh` | 10/10 |
| `test_google_link.sh` | 7/7 |
| `test_otp_login.sh` | 5/5 |
| `test_update_profile.sh` | 15/15 |
| `test_forgot_reset_password.sh` | 9/9 |
| Xác nhận token email-change trực tiếp | HTTP 200 |

Tổng script assertions: **64/64 đạt**.

## 6. Bằng chứng giao diện

Thư mục: `docs/test-evidence/auth/`

- `01-phone-register-success.png`
- `02-phone-login-success.png`
- `03-email-waiting-verification.png`
- `04-email-verify-success.png`
- `05-email-login-success.png`
- `06-google-session-success.png`
- `07-password-session-revoked.png`
- `08-profile-security-methods.png`
- `09-session-management.png`

## 7. Giới hạn cần kiểm tra ở staging/production

Các mục sau không thể chứng minh hoàn toàn chỉ bằng môi trường local hiện tại:

1. SMS thật cho OTP đăng ký và OTP đổi phone; local đang dùng dev mode/đọc OTP từ dữ liệu hệ thống.
2. Firebase Phone Auth happy path với SMS thật và reCAPTCHA/domain staging.
3. Google consent popup happy path bằng tài khoản Google thật. Automated browser đã test đúng credential handoff; backend đã test validation/link/unlink, nhưng chưa tự động đăng nhập vào tài khoản Google cá nhân.
4. Email thật từ SMTP, link trên domain HTTPS và cấu hình production (`APP_FRONTEND_URL`, `APP_BASE_URL`, CORS, Google authorized origin).

Để chạy vòng live cuối, cần cung cấp hoặc xác nhận: domain staging, tài khoản Google test được phép sử dụng, số điện thoại Firebase/SMS test và mailbox test. Không cần gửi mật khẩu qua tài liệu; nên nhập trực tiếp khi popup/provider yêu cầu.

## 8. File chính đã thay đổi

- `src/features/customer/auth/types/auth.type.ts`
- `src/features/customer/auth/services/auth.service.ts`
- `src/features/customer/auth/hooks/use-auth.ts`
- `src/features/customer/auth/components/LoginForm.tsx`
- `src/features/customer/auth/components/PhoneLoginForm.tsx`
- `src/features/customer/auth/components/ResetPasswordForm.tsx`
- `src/features/customer/auth/components/SessionManagement.tsx`
- `src/features/customer/auth/components/VerifyEmailResult.tsx`
- `src/features/customer/setting/components/ProfileSettingForm.tsx`
- `src/features/customer/setting/components/AccountIdentifiersForm.tsx`
- `src/features/customer/setting/components/ChangePasswordForm.tsx`
- `src/app/api/auth/verify-email/route.ts`
- `src/proxy.ts`
- `tests/e2e/auth.spec.ts`

Backend regression fix:

- `api-server/src/main/java/com/fams/shared/security/JwtProvider.java`
- `api-server/src/main/java/com/fams/shared/security/JwtAuthFilter.java`
- `api-server/src/main/java/com/fams/modules/auth/service/ChangePasswordService.java`
- `api-server/src/main/java/com/fams/modules/auth/service/LogoutService.java`
- `tests/auth/test_change_password.sh`
- `docs/api/auth-api.md`
