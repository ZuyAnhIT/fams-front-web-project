# Báo cáo Employee UI — 25/07/2026

## Phạm vi đã hoàn thiện

### Company Portal

- Danh sách/search/filter phòng ban/filter trạng thái/sort/phân trang.
- Export giữ nguyên `search`, `status`, `department`.
- Tạo hồ sơ HR thủ công, không tạo tài khoản.
- Mời nhân viên bằng email, kèm SĐT/họ tên/role tenant.
- Chấp nhận lời mời cho tài khoản cũ, tài khoản mới và nối tài khoản SĐT hiện có.
- Danh sách/hủy lời mời pending.
- Import `.xlsx` có tổng kết và lỗi từng dòng; không tự gửi email.
- Xác nhận trước khi chuyển `active`, `inactive`, `terminated`.
- Chi tiết nhân viên: hồ sơ, role, workspace, assignment và Face ID.
- Route/menu kiểm tra permission `employees:list`/`employees:read`, không chỉ hard-code role.
- Supervisor site-scoped nhận thông báo phạm vi; list/detail/export do backend tiếp tục enforce.

### Platform Admin

- `/admin/users` tách “Danh mục tài khoản” và “Lời mời nền tảng”.
- Gửi/hủy lời mời nền tảng.
- Chỉ chọn `PLATFORM_STAFF` hoặc custom platform role đang hoạt động.
- Không tạo `Employee`, workspace, assignment hoặc Face ID cho platform staff.

### Public invitation

- Tenant: `/accept-invite?type=tenant&token=...`
- Platform: `/accept-invite?type=platform&token=...`
- Gọi đúng validate/accept endpoint theo loại.
- Có deep link `famsfrontappproject://accept-invite?...` sang App native.

## Quyết định nghiệp vụ

- Giữ riêng **tạo hồ sơ** và **mời tài khoản**. Hồ sơ có thể tồn tại khi nhân viên chưa cần đăng nhập.
- Import là tạo hồ sơ hàng loạt. Bulk invite phải là hành động riêng có preview/xác nhận.
- Không giả lập bulk invite bằng N request từ browser vì backend chưa có API bulk.

Tham khảo hệ thống workforce thực tế:

- [Deputy — Adding team members](https://help.deputy.com/hc/en-au/articles/4657767244303-Adding-team-members)
- [Deputy — Invite team members](https://help.deputy.com/hc/en-au/articles/4657801078287-Invite-team-members-to-use-Deputy)
- [Deputy — Bulk import/update](https://help.deputy.com/hc/en-au/articles/5898002694287-Bulk-import-or-bulk-update-team-member-data)
- [Connecteam — Add users](https://help.connecteam.com/en/articles/6529291-how-to-add-users-to-connecteam)

## Lỗi link email đã sửa

Backend trước đây gửi link tới `APP_BASE_URL/api/v1/.../accept`, nhưng endpoint
accept chỉ nhận `POST`; click từ email là `GET` nên không thể mở form. Hai service
lời mời đã đổi sang `app.frontend-url` và sinh:

- `{frontend-url}/accept-invite?type=tenant&token=...`
- `{frontend-url}/accept-invite?type=platform&token=...`

Sau khi người dùng xác nhận trên UI, Web/App mới gọi API `POST` accept.

## Kiểm thử

- `npm run lint`: 0 error; còn warning cũ của repository.
- `npm run typecheck`: đạt.
- `npm run build -- --webpack`: đạt.
- Chromium E2E nhóm employee: **8/8 đạt**.
- Regression cuối xác nhận các ca employee, tenant, RBAC và token-link đã chạy đều
  đạt. Ca auth sống “đăng ký số điện thoại OTP” bị `ECONNREFUSED` do backend
  `localhost:8080` đang tắt; 6 ca auth tiếp theo không chạy vì suite auth là serial.
- Backend compile đạt với output tạm:
  `bash ./mvnw -q -DskipTests -Dproject.build.directory=/tmp/fams-api-build-codex compile`.
- Suite employee kiểm tra:
  - hồ sơ/invite/import/export;
  - workspace/assignment/role/Face ID;
  - tenant/platform validate và accept;
  - platform send/cancel invitation.
- Evidence:
  - `docs/test-evidence/employee-management/`
  - `docs/test-evidence/employee/`

## Backend gap còn lại

`GET /users?isPlatformAdmin=true` chỉ lọc cờ `User.isPlatformAdmin`, không bảo đảm bao gồm user có role `PLATFORM_STAFF` trong `user_roles`.

UI hiện gọi đúng màn này là “Danh mục tài khoản” và giải thích bộ lọc. Để có danh sách platform staff chính xác, backend nên thêm:

- `GET /users?hasPlatformRole=true` và trả `platformRoles`; hoặc
- `GET /platform/staff` join `user_roles` với `tenant_id IS NULL`.

Bulk invite sau import cũng cần endpoint riêng nếu được ưu tiên ở đợt sau.
