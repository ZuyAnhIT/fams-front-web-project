# Báo cáo sửa lỗi các liên kết chứa token

Ngày kiểm tra: 24/07/2026  
Frontend: `fams-front-web-project`  
Backend: `fams-backend-project`

## 1. Phạm vi và kết luận

Đã sửa và kiểm tra ba nhóm liên kết gửi qua email:

| Luồng | Kết quả sau sửa |
|---|---|
| Xác thực email sau đăng ký | Trang web được hydrate khi mở qua IP LAN, gọi API đúng một lần và hiển thị thành công/lỗi thay vì quay vô hạn |
| Quên mật khẩu / tài khoản bị khóa | Hiển thị form đặt mật khẩu mới, gửi đúng token, có màn thành công và đường quay lại |
| Xác thực email mới trong hồ sơ | Email mới trỏ về giao diện `/verify-email`; link backend cũ được chuyển tiếp về giao diện, không còn hiện JSON/script thô |

## 2. Nguyên nhân

### Trang quay vô hạn khi mở bằng IP LAN

Next.js 16 ở chế độ development kiểm tra origin của asset và HMR. Server trước đây được
khởi động theo hostname mặc định và chưa khai báo IP LAN. HTML SSR vẫn trả về nên người
dùng thấy màn “Đang xác thực”, nhưng JavaScript phía trình duyệt không hydrate và request
xác thực không bao giờ được gửi.

### Link đổi email hiển thị dữ liệu thô

Backend tạo link đổi email bằng `APP_BASE_URL`, trỏ thẳng tới endpoint JSON:

```text
/api/v1/auth/profile/email/confirm-change?token=...
```

Đây là API dành cho client/BFF, không phải một trang giao diện.

### Nguy cơ gọi token một lần hai lần

React development mode có thể mount effect hai lần. Với token dùng một lần, hai request
song song có thể làm request thứ hai trả lỗi dù request đầu đã thành công.

## 3. Thay đổi đã thực hiện

### Frontend

- `npm run dev` lắng nghe trên `0.0.0.0`.
- Cấu hình `allowedDevOrigins` bằng `FAMS_DEV_ORIGINS`; mặc định hiện tại là
  `192.168.1.7`.
- Route BFF xác thực có timeout 15 giây và trả lỗi 502/504 có thông điệp rõ ràng.
- Trình duyệt có timeout 20 giây, nút **Thử lại** và không còn loading vô hạn.
- Dùng chung promise theo token để React Strict Mode không gọi token một lần hai lần.
- Trang xác thực và đặt lại mật khẩu đều có **Quay lại trang trước**.
- Sau thành công có lựa chọn mở ứng dụng FAMS hoặc tiếp tục trên web.
- Link email-change cũ ở `/api/v1/.../confirm-change` được proxy về
  `/verify-email?mode=email-change`.

### Backend

- Link xác thực đổi email mới dùng `APP_FRONTEND_URL` và trỏ tới:

```text
{APP_FRONTEND_URL}/verify-email?token={token}&mode=email-change
```

- Direct GET cũ từ trình duyệt được kiểm tra chuyển hướng về trang frontend để các email
  đã gửi trước khi cập nhật vẫn có trải nghiệm phù hợp.
- Client gọi JSON/BFF tiếp tục nhận response API, không bị ảnh hưởng bởi redirect dành
  cho trình duyệt.

## 4. Cấu hình khi đổi IP mạng

Ví dụ frontend chạy tại `http://192.168.1.7:3000`:

```env
# frontend .env.local
FAMS_DEV_ORIGINS=192.168.1.7
FAMS_BACKEND_URL=http://localhost:8080/api/v1
```

```env
# backend
APP_FRONTEND_URL=http://192.168.1.7:3000
APP_BASE_URL=http://192.168.1.7:8080
```

`FAMS_DEV_ORIGINS` chỉ nhận hostname/IP, không thêm `http://` và port. Nếu cần nhiều
hostname, phân cách bằng dấu phẩy:

```env
FAMS_DEV_ORIGINS=192.168.1.7,fams.local
```

Sau khi đổi cấu hình phải khởi động lại frontend và backend. Các email đã gửi chứa URL
cũ không tự đổi hostname; hãy yêu cầu gửi lại email nếu thiết bị không còn truy cập được
IP cũ.

## 5. Kết quả kiểm thử

### Kiểm thử frontend tự động

```text
npx playwright test tests/e2e/token-links.spec.ts --project=chromium
4 passed

npm run typecheck
PASS

npm run lint -- --quiet
PASS

npm run build -- --webpack
PASS

git diff --check
PASS
```

Bốn case Playwright:

1. Xác thực đăng ký hiển thị UI và chỉ gửi đúng một request cho token.
2. Link đổi email kiểu cũ được chuyển về UI và gọi endpoint với `mode=email-change`.
3. Form reset password gửi đúng token và mật khẩu mới, sau đó hiển thị màn thành công.
4. Lỗi mạng kết thúc trạng thái loading và hiển thị **Thử lại** / **Quay lại trang trước**.

### Kiểm thử backend và trình duyệt LAN

```text
UserProfileServiceTest
PASS

docker exec fams-api mvn -q -DskipTests compile
PASS
```

Đã kiểm tra trực tiếp bằng Chromium:

- `http://192.168.1.7:3000/verify-email?token=...`: có giao diện kết quả, không quay vô hạn.
- `http://192.168.1.7:3000/reset-password?token=...`: hiển thị form tạo mật khẩu mới.
- Direct link backend đổi email cũ: HTTP 302 về trang `/verify-email?...&mode=email-change`
  và hiển thị giao diện thay vì JSON.

## 6. Lưu ý vận hành

- Token xác thực và reset password là token dùng một lần, có thời hạn. Không dùng lại
  token đã test hoặc token đã chia sẻ; yêu cầu gửi một email mới.
- URL trong email phải là địa chỉ mà thiết bị nhận email truy cập được. `localhost` chỉ
  đúng trên chính máy chạy trình duyệt.
- Khi chuyển Wi-Fi, kiểm tra firewall cho port `3000` và cập nhật đồng thời
  `FAMS_DEV_ORIGINS` cùng `APP_FRONTEND_URL`.
- Production nên dùng domain HTTPS ổn định thay vì IP LAN để link trong email không đổi
  theo mạng.
