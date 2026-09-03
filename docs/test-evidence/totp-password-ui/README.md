# #06 — Nút bật/tắt 2FA & #07 — Giao diện đổi mật khẩu

Ngày: 2026-09-03 · Repo: `fams-front-web-project`

## #06 — Bật/tắt 2FA nhưng nút không ẩn/hiện theo trạng thái

`features/customer/setting/components/TotpSettingForm.tsx` **luôn hiển thị cả hai nút**
"Bật xác thực hai lớp" và "Tắt xác thực hai lớp" — component chưa hề đọc trạng thái 2FA hiện
tại (không có query nào), và sau khi bật/tắt cũng không cập nhật lại.

### Đã sửa
- Đọc trạng thái từ `useProfile()` (`/auth/me` → `totpEnabled`), fallback về `user.totpEnabled`
  trong store khi đang tải.
- Render theo trạng thái:
  - **Đang bật** → huy hiệu xanh "Đang bảo vệ tài khoản" + chỉ nút "Tắt".
  - **Chưa bật** → huy hiệu "Chưa bật" + chỉ nút "Bật".
  - **Đang thiết lập** (đã bấm Bật, đang quét QR) → huy hiệu + nút "Hủy thiết lập".
- Sau khi verify (bật) / disable (tắt) / gặp 409 (đã bật sẵn): `syncTotpStatus()` vừa
  `updateUser({...user, totpEnabled})` vừa `invalidateQueries(["auth","profile"])` → UI đổi ngay.

## #07 — Giao diện đổi mật khẩu: sai màu + lỗi nút

Ảnh người dùng gửi: màn "Đổi mật khẩu thành công!" có **một ô trắng rỗng** (nút hỏng) và nút
"Đăng nhập trên web" không phải màu xanh.

### 2 nguyên nhân gốc
1. **Sai palette:** `ResetPasswordForm` / `ForgotPasswordForm` / logo auth mobile dùng thang
   màu `brand-*` — trong dự án này `brand-600` = **xám `#5B5B5B`**, không phải xanh
   (`brand-primary` mới là xanh `#2563eb`). Login/Register/ChangePassword đều đã dùng `blue-*`.
2. **Lỗi nút = antd v6 vs Tailwind v4 layering:** antd phát CSS reset `a { background: transparent }`
   **ngoài `@layer`**, luôn thắng utility `bg-*` của Tailwind (nằm trong `@layer utilities`).
   Nên `<Link className="bg-blue-600 !text-white">` → nền trong suốt + chữ trắng = **ô trắng
   rỗng**. (Cùng lớp lỗi với `hidden` ở #02.)

### Đã sửa
- Đổi toàn bộ `brand-600/700` → `blue-600/700` trong `ResetPasswordForm.tsx`,
  `ForgotPasswordForm.tsx`, và logo trong `app/(auth)/layout.tsx`.
- Với các `<a>`/`<Link>` styled như nút: dùng `!bg-blue-600` / `hover:!bg-blue-700` (important
  để thắng reset của antd) — sửa ở `ResetPasswordForm`, `VerifyEmailResult`, `LoginForm`
  (nút "Đặt lại mật khẩu để mở khóa").
- Màn thành công: CTA chính giờ là **"Đăng nhập trên web"** (nút xanh đặc), "Mở ứng dụng FAMS"
  là nút phụ (viền) và chỉ hiện khi có `NEXT_PUBLIC_MOBILE_APP_SCHEME`.

## Ảnh minh chứng (`tests/e2e/totp-toggle-password-ui.spec.ts`)
- `totp-{disabled,enabled}.png` — trang 2FA theo từng trạng thái.
- `reset-{form,success}.png`, `forgot-form.png` — luồng đổi mật khẩu (màu xanh, nút đầy đủ).
