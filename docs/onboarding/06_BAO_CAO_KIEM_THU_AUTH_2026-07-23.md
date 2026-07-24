# 06. Báo cáo kiểm thử và lịch sử sửa 4 nhóm Authentication

> Ngày thực hiện: 23/07/2026 (Asia/Bangkok). Phạm vi frontend: repository `fams-front-web-project`; backend đối chiếu: API local `http://localhost:8080` và `docs/api/auth-api.md` của backend. Báo cáo không chứa access token, refresh token, OTP, Google credential hoặc secret môi trường.

## 1. Kết luận

| Nhóm tính năng | Kết quả frontend | Mức kiểm chứng |
|---|---|---|
| Đăng ký số điện thoại + OTP | **Đạt sau khi sửa** | Chromium → Next production → backend thật → PostgreSQL/dev OTP → đăng ký 201 |
| Đăng ký email + link verify | **Đạt sau khi sửa** | Chromium → backend thật → resend → token test trong Redis → link frontend → backend verify → login |
| Đăng nhập email hoặc số điện thoại + mật khẩu | **Đạt sau khi sửa** | Hai happy path thật; request được assert dùng `identifier` và `deviceId` ổn định |
| Google login + dựng session frontend | **Đạt ở ranh giới tích hợp frontend** | Google SDK/credential được stub trong Chromium; payload, `/me.googleLinked`, token/session và redirect được kiểm tra |
| Google happy path với tài khoản Google thật + đồng bộ hai chiều backend | **Chưa chạy lại trong phiên này** | Cần người dùng tương tác với Google account/consent thật; backend handoff đã ghi nhận logic/happy path trước đó |

Ba nhóm đầu đã được kiểm thử end-to-end với backend local thật. Không gọi phone registration là production-ready vì backend hiện chỉ log OTP ở `app.sms.dev-mode=true`; tài liệu backend yêu cầu tích hợp nhà cung cấp SMS thật trước production.

## 2. Sai lệch tìm thấy ban đầu và thay đổi đã thực hiện

| ID | Sai lệch | Ảnh hưởng | Cách sửa |
|---|---|---|---|
| AUTH-01 | Register phone dùng Firebase ID token | Không khớp API mới `register/send-otp` + `otpCode` | Chuyển sang OTP backend-managed, countdown 5 phút, cooldown gửi lại, xử lý 400/409/429 |
| AUTH-02 | Login gửi `{email, password}` | Backend yêu cầu `{identifier, password}` nên phone/password không dùng được | Form nhận email hoặc phone; schema/type/service đều dùng `identifier` |
| AUTH-03 | Không có resend email thật | Người dùng mắc kẹt nếu bỏ lỡ email | Thêm `POST /auth/resend-verification` ở màn chờ và CTA khi login trả `EMAIL_NOT_VERIFIED` |
| AUTH-04 | Link verify chỉ mở JSON backend | UX không có trang thành công/thất bại | Thêm `/verify-email`, Proxy redirect và Route Handler BFF `/api/auth/verify-email` |
| AUTH-05 | `UserProfile` dùng `isActive` | Sai field response thực tế (`active`) | Sửa contract type thành `active` |
| AUTH-06 | Login/register/Google không gửi device ID ổn định | Session backend bị ghi `unknown` hoặc không ổn định | Thêm `fams_device_id`, tạo một lần và tái sử dụng |
| AUTH-07 | User mới chưa có tenant vẫn poll notification | Console ném `Tenant ID not found` ngay sau login | Không khởi động `NotificationWatcher` cho đến khi có active tenant |
| AUTH-08 | Rewrite backend hard-code | Khó dùng staging/production và Route Handler verify | Thêm server env `FAMS_BACKEND_URL` |
| AUTH-09 | Không có test framework | Không có regression proof | Thêm Playwright Chromium, production web server và `npm run test:e2e` |

## 3. Ma trận test đã chạy

### 3.1 E2E Chromium trên frontend production build

Lệnh cuối:

```bash
npx playwright test
```

Kết quả cuối: **4/4 passed (10.2s)**.

| Test | Backend | Assertions chính | Kết quả |
|---|---|---|---|
| Phone register + phone password login | Thật | send OTP 200; body register có phone/password/displayName/otpCode, không có email/Firebase token; redirect login; login body dùng identifier/deviceId; tới select-company | PASS |
| Email register + resend + verify + login | Thật | register 201; màn chờ; resend 200; link API redirect `/verify-email`; trang báo thành công; login bằng identifier; tới select-company | PASS |
| Login email chưa xác thực | Mock lỗi backend đúng contract | HTTP 403 `EMAIL_NOT_VERIFIED` làm hiện CTA; CTA gửi đúng email tới resend endpoint | PASS |
| Google credential → FAMS session | Stub Google SDK + mock auth responses | Gửi `idToken` và deviceId; gọi `/me`; lưu `googleLinked=true`; redirect đúng | PASS |

Google test cố ý stub ranh giới Google Identity SDK vì runner không có Google account/consent tương tác. Nó chứng minh wiring frontend sau khi nhận `response.credential`, không chứng minh Google phát hành token thật hoặc backend merge hai user thật.

### 3.2 Regression API backend thật

| Script/nhóm | Kết quả |
|---|---:|
| Phone registration: send, wrong OTP, correct OTP, login, duplicate | **6/6 PASS** |
| Google endpoint: missing/blank/malformed/wrong audience/content-type/public route | **6/6 PASS** |
| Resend verification: unverified/unknown/already verified/invalid/rate-limit | **6/6 PASS** |

### 3.3 Quality gates

```bash
npm run lint -- --quiet
npm run typecheck
npm run build -- --webpack
```

Kết quả: **PASS**. Production build tạo thành công cả `/verify-email` và dynamic Route Handler `/api/auth/verify-email`.

## 4. Bằng chứng giao diện

Các ảnh được Playwright chụp từ lần test PASS cuối, dùng dữ liệu test sinh theo thời gian và không chứa token/OTP:

1. [Phone register hoàn tất, identifier được điền sẵn ở login](../test-evidence/auth/01-phone-register-success.png)
2. [Phone/password login thành công và tới trang chọn công ty](../test-evidence/auth/02-phone-login-success.png)
3. [Email registration ở trạng thái chờ xác thực](../test-evidence/auth/03-email-waiting-verification.png)
4. [Link email hiển thị trang xác thực thành công](../test-evidence/auth/04-email-verify-success.png)
5. [Email/password login thành công](../test-evidence/auth/05-email-login-success.png)
6. [Google session frontend hoàn tất và điều hướng](../test-evidence/auth/06-google-session-success.png)

## 5. Lịch sử thực thi đáng chú ý

1. Audit code phát hiện frontend còn theo phone-registration Firebase cũ và login gửi sai field `email`.
2. Sau khi sửa contract/UI, lint và typecheck pass.
3. Lần E2E dev đầu vấp locator/hydration và Fast Refresh; chuyển suite sang production build theo hướng dẫn Next.js/Playwright.
4. Test phát hiện `NotificationWatcher` poll sai khi user chưa có tenant; đã sửa và test lại.
5. Một lần email register nhận 500 đúng lúc container Spring Boot restart; log cho thấy backend khởi động lại. Sau health ổn định, test email pass lặp lại và vòng tổng hợp cuối 4/4 pass.
6. Chạy regression backend: phone 6/6, Google error contract 6/6, resend 6/6.
7. Chạy quality gate cuối: lint, typecheck, webpack production build đều pass.

## 6. Việc còn mở trước khi công bố production-ready

1. Tích hợp SMS provider thật; hiện phone-registration happy path dùng dev OTP trong backend local.
2. Cấu hình `app.base-url`/link email để email production trỏ qua frontend origin, từ đó Proxy chuyển tới `/verify-email`.
3. Chạy manual Google thật với ít nhất ba kịch bản: Google-only; password trước rồi Google cùng email; Google trước rồi đặt password. Xác nhận không tạo user trùng và `/me.googleLinked=true`.
4. Thêm test link/unlink Google trong trang hồ sơ nếu UX này nằm trong phạm vi release.
5. Nối `npm run test:e2e` vào CI với backend/Redis/PostgreSQL test; hiện CI mới chạy lint/typecheck/build.
6. Review 5 cảnh báo dependency audit mà npm báo khi cài test tooling (1 moderate, 4 high) trước release; không dùng `npm audit fix --force` nếu chưa review breaking changes.
7. Tiếp tục kế hoạch chuyển refresh token khỏi `localStorage` sang HttpOnly cookie nếu backend/product chấp thuận.

## 7. Cách chạy lại

Backend local phải healthy tại `http://localhost:8080/api/v1/auth/health`, PostgreSQL và Redis chạy bằng Docker. Sau đó:

```bash
npm ci
npx playwright install chromium
npm run test:e2e
```

Suite phone/email đọc OTP/token trực tiếp từ hạ tầng test local để tự động hoá; không dùng cách này với production data hoặc production secrets.
