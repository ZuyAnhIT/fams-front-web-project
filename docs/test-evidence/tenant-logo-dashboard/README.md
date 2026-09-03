# #08 — Upload logo công ty & #09 — Dashboard HR không tải được

Ngày: 2026-09-03 · Repos: `fams-backend-project`, `fams-front-web-project`, `fams-front-app-project`

## #09 — "Không thể tải Dashboard HR" cho Tenant Admin / HR

### Nguyên nhân thật (không phải thiếu quyền)
Backend `GET /tenants/{id}/dashboard/hr` **chạy đúng** khi gọi trực tiếp. Lỗi trên UI là do
tenant demo **"Công ty CP Xây dựng Hoàng Long" có bật danh sách IP cho phép** (`203.113.128.0/24`,
`14.161.0.0/16` — do `scripts/seed.sh` tạo để demo tính năng). Máy test không nằm trong dải đó
→ **mọi endpoint tenant-scoped trả 403 `IP_NOT_WHITELISTED`**, không riêng dashboard.

Frontend `dashboard.component.tsx` bắt mọi lỗi rồi hiện cứng "Bạn có thể chưa có quyền
employees:list…" → sai hoàn toàn, khiến người dùng đi tìm nhầm nguyên nhân.

### Đã sửa
- **Frontend** `dashboard.component.tsx`: thêm `DashboardLoadError` đọc `errorCode`/`status` thật:
  - `IP_NOT_WHITELISTED` → "Địa chỉ IP hiện tại không được phép truy cập công ty này…"
  - `TENANT_SUSPENDED` → "Công ty đang bị tạm ngưng…"
  - 403 khác → "Không đủ quyền xem tổng quan (cần employees:list)…"
  - còn lại → dùng `userMessage`/`message` từ backend.
  Áp dụng cho cả 3 view (HR / Supervisor / Employee).
- **Backend** `AuthService.switchTenant`: dùng `PrimaryRoleResolver.pickPrimaryForTenant` thay
  cho `targetRoles.get(0)` — nhất quán với login & refresh. Người dùng có 2 role trong tenant
  đích trước đây bị chọn role ngẫu nhiên khi đổi công ty → dashboard hiển thị sai view.

> Lưu ý: để truy cập tenant Hoàng Long từ máy test, cần thêm IP hiện tại vào IP whitelist của
> tenant đó (mục "Bảo mật IP" trong Cấu hình công ty), hoặc dùng tenant demo khác không bật whitelist.

## #08 — Logo công ty đang "dán link" URL

Trước đây logo công ty chỉ có ô nhập URL (`UpdateTenantForm` web: "Đường dẫn ảnh Logo (URL)";
app `TenantSetupWizard`: "Logo URL"). Ảnh đại diện tài khoản đã là upload file thật từ trước — chỉ
logo công ty là thiếu.

### Đã sửa
- **Backend** (mới):
  - `TenantLogoStorageService` — upload lên S3/MinIO, prefix `logos/` (cùng bucket avatar).
    `AvatarStorageService` cập nhật bucket policy để cover cả `avatars*` lẫn `logos*`.
  - `POST /api/v1/tenants/{id}/logo` (multipart) + `DELETE /api/v1/tenants/{id}/logo` — chủ sở
    hữu (Platform Admin exempt), JPEG/PNG/WEBP/SVG ≤ 5MB. `TenantService.updateLogoFile` /
    `deleteLogoFile`, có ghi audit.
- **Web** `UpdateTenantForm` (dùng ở cả admin và "Cấu hình công ty" của tenant): thay ô URL bằng
  `TenantLogoUploader` — preview + "Tải logo lên" / "Đổi logo" / "Xoá", upload ngay khi chọn file,
  cập nhật lại header/list không cần reload.
- **App** `TenantSetupWizard`: bỏ ô "Logo URL" (gây khó dùng), thêm ghi chú "tải logo từ máy ở
  Cấu hình công ty trên FAMS web sau khi tạo".

### Test
- Backend: `tests/tenant/test_tenant_logo.sh` — 9/9 pass (upload PNG, public-read, reject
  non-image, non-owner 403, platform-admin 200, delete, unauth 401). Regression: `test_update_tenant.sh`
  8/8, `test_ip_whitelist.sh` 14/14, `test_switch_tenant.sh` 8/8, avatar upload vẫn OK.
- Web: `tests/e2e/tenant-logo-dashboard-errors.spec.ts` — 2/2 pass. Ảnh:
  `dashboard-ip-blocked.png`, `company-config-logo-uploader.png`, `company-config-after-upload.png`.
- `tsc` + `eslint` (web) sạch; `tsc` (app) sạch.
