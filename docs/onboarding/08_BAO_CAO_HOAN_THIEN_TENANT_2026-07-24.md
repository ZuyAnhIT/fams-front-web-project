# Báo cáo hoàn thiện frontend Tenant và khóa tài khoản

Ngày kiểm tra: 24/07/2026  
Frontend: `fams-front-web-project`  
Backend contract: `fams-backend-project/docs/api/tenant-api.md`

## 1. Kết luận

Các luồng tenant chính đã được nối lại theo contract backend hiện tại:

| Nhóm | Trước khi sửa | Kết quả |
|---|---|---|
| Khóa tài khoản | Chỉ hiện toast 423 | Có màn khóa riêng, countdown, thời điểm mở, email cảnh báo và CTA quên mật khẩu |
| Self-service create | Gửi `ownerEmail`, có thể bị 403 | Không gửi `ownerUserId`, `ownerEmail`, `planId`; caller là owner |
| Platform provisioning | Tạo tenant rồi gán role/gửi invitation sai contract | Tạo một request duy nhất với owner đã tồn tại và plan tùy chọn |
| Danh sách | Thiếu industry/country và sort chưa ổn định | Đủ search/status/industry/country/sort/pagination 0-based |
| Chi tiết | Phụ thuộc Zustand, F5 bị đá về list | Tải trực tiếp `GET /tenants/{id}/detail`, hiển thị plan/limit/usage |
| Sửa hồ sơ | Platform Admin sửa được trên UI | Platform chỉ đọc; form sửa đặt ở phía tenant owner, backend vẫn chặn non-owner |
| Lifecycle | Menu lộ theo trang admin chung | Chỉ Platform Admin thấy suspend/reactivate/cancel |
| Subscription | Mọi người thấy nút gán/sửa | Owner chỉ xem; Platform Admin xem và quản trị; Staff xem summary operational |
| Platform Staff | Chưa có role trong frontend | Đã có `PLATFORM_STAFF` và guard theo `tenants:list/read/create` |

Production build, TypeScript, ESLint error-level và 5 bài Chromium đều đạt.

## 2. Quyền hiển thị và quyền gọi API

| Chức năng | User thường | Owner | Platform Staff | Platform Admin |
|---|---:|---:|---:|---:|
| Self-service create | Có | Có | Không dùng chế độ self-service khi có `tenants:create` | Không |
| Provisioning | Không | Không | Có khi có `tenants:create` | Có |
| List tenant | Không | Không | `tenants:list` | Có |
| Operational detail | Không | Không | `tenants:read` | Có |
| PATCH hồ sơ | Không | Có | Không | Không |
| Suspend/reactivate/cancel | Không | Không | Không | Có |
| GET subscription | Không | Có | Không; dùng summary detail | Có |
| POST/PATCH subscription | Không | Không | Không | Có |

UI guard chỉ là lớp trải nghiệm. Backend tiếp tục là nguồn quyết định quyền cuối cùng.

## 3. Hai chế độ tạo công ty

| Thuộc tính | Self-service | Platform provisioning |
|---|---|---|
| Caller | Bất kỳ user đã đăng nhập | Platform Admin hoặc `tenants:create` |
| Owner | Chính caller | Tài khoản FAMS đã tồn tại |
| `ownerUserId` / `ownerEmail` | Phải bỏ | Bắt buộc một trong hai |
| `planId` | Phải bỏ | Tùy chọn |
| Membership caller | Trở thành `TENANT_ADMIN` | Không được thêm |
| Trạng thái | `trial` | `active` |
| Subscription | Default active plan, trạng thái `TRIAL` | Plan chọn/default, trạng thái `ACTIVE` |

Payload self-service frontend:

```json
{
  "name": "Acme Việt Nam",
  "slug": "acme-vn",
  "industry": "construction"
}
```

Payload provisioning frontend:

```json
{
  "name": "Acme Việt Nam",
  "slug": "acme-vn",
  "ownerEmail": "owner@example.com",
  "planId": "33333333-3333-4333-8333-333333333333",
  "countryCode": "VN",
  "timezone": "Asia/Ho_Chi_Minh",
  "locale": "vi-VN",
  "currencyCode": "VND"
}
```

Frontend ánh xạ lỗi provisioning:

| HTTP | Ý nghĩa hiển thị |
|---:|---|
| 400 | Validation hoặc thiếu owner |
| 403 | Caller không có quyền provisioning |
| 404 | Không tồn tại owner/plan |
| 409 | Trùng slug/domain |

## 4. State machine tenant

```text
self-service create ──> trial
provisioning ─────────> active

trial  ──suspend──────> suspended
active ──suspend──────> suspended
suspended ─reactivate─> active

trial / active / suspended ─cancel─> cancelled
cancelled ─────────────────────────> terminal, không reactivate/suspend
```

Quy tắc UI:

- `suspended`: chỉ hiện “Kích hoạt lại” và “Hủy bỏ”.
- `trial`/`active`: hiện “Đình chỉ” và “Hủy bỏ”.
- `cancelled`: chỉ còn xem chi tiết.
- Mọi transition trên chỉ hiện cho `PLATFORM_ADMIN`.

## 5. Checklist bàn giao frontend

### Khóa tài khoản

- [x] Bắt HTTP 423 / `ACCOUNT_LOCKED`.
- [x] Parse ISO unlock time và hiển thị theo giờ địa phương.
- [x] Countdown từng giây.
- [x] Thông báo khóa tối đa 1 giờ và email cảnh báo cho email account.
- [x] Email account có CTA đặt lại mật khẩu để mở khóa ngay.
- [x] Form quên mật khẩu nhận sẵn email qua query param.
- [x] Phone-only account được giải thích phải chờ hết khóa.
- [x] Có nút chuyển sang tài khoản khác.

### Tạo công ty

- [x] Tách payload self-service khỏi provisioning.
- [x] Self-service không còn field owner.
- [x] Provisioning yêu cầu owner email đã đăng ký.
- [x] Load danh sách active plan, plan là tùy chọn.
- [x] Bỏ hoàn toàn chuỗi tạo tenant → tìm role → assign/invite cũ.
- [x] Hiển thị thông báo rõ provisioning là direct assignment.

### List và detail

- [x] Search theo name/slug.
- [x] Filter status, industry, countryCode.
- [x] Sort theo contract và truyền `sortDir`.
- [x] Pagination frontend 1-based ↔ backend 0-based.
- [x] Detail hoạt động khi mở URL trực tiếp/F5.
- [x] Hiển thị profile read-only, subscription summary, limits và usage.
- [x] `null` limit hiển thị “Không giới hạn”.
- [x] Không giả lập storage usage vì backend chưa trả field này.

### Hồ sơ owner

- [x] Platform Admin/Staff không còn form PATCH profile.
- [x] Form nằm trong cấu hình tenant phía `TENANT_ADMIN`.
- [x] Chỉ gửi field thực sự thay đổi.
- [x] Chuỗi rỗng của `domain`/`logoUrl` được giữ để backend xóa giá trị.
- [x] Backend xác minh `userId === ownerId`; Platform Admin cũng nhận 403.

### Lifecycle và subscription

- [x] Chỉ Platform Admin thấy lifecycle actions.
- [x] Owner gọi GET subscription và chỉ xem.
- [x] Chỉ Platform Admin thấy assign/update subscription.
- [x] Platform Staff không gọi endpoint subscription owner/admin-only.
- [x] Detail operational vẫn cung cấp plan summary cho Staff.

## 6. Kết quả kiểm thử

### Frontend

```text
npm run typecheck                    PASS
npm run lint -- --quiet              PASS
npm run build -- --webpack           PASS
PLAYWRIGHT_PORT=3100 npx playwright test tests/e2e/tenant.spec.ts
                                      5 passed
```

Các case Chromium:

1. List truyền đủ query và Platform Admin provisioning đúng payload.
2. Platform Staff read-only theo permission.
3. Self-service không gửi field đặc quyền.
4. Owner PATCH đúng field và GET subscription read-only.
5. HTTP 423 hiển thị màn khóa và CTA reset password.

Ảnh bằng chứng:

- `docs/test-evidence/tenant/01-admin-list-provisioning.png`
- `docs/test-evidence/tenant/02-platform-staff-readonly.png`
- `docs/test-evidence/tenant/03-owner-profile-subscription.png`
- `docs/test-evidence/tenant/04-account-locked.png`

### Backend thật trên Docker local

| Suite | Kết quả |
|---|---:|
| `tests/auth/test_account_lock.sh` | 9/9 pass |
| `tests/tenant/test_create_tenant.sh` | 12/12 pass |
| `tests/tenant/test_list_tenants.sh` | 9/9 pass |
| `tests/tenant/test_tenant_detail.sh` | 6/6 pass |
| `tests/tenant/test_update_tenant.sh` | 8/8 pass |
| `tests/tenant/test_tenant_status.sh` | 15/15 pass |

Subscription được kiểm tra thêm trực tiếp:

```text
OWNER_GET=200
ADMIN_GET=200
ADMIN_PATCH=200
OWNER_PATCH=403
```

## 7. Giới hạn contract cần backend bổ sung

Hai điểm này không làm sai quyền, nhưng hạn chế trải nghiệm owner:

1. `GET /roles/me` không có `isOwner`/`ownerId`, còn `GET /tenants/{id}/detail` chỉ dành cho Platform Admin/Staff. Vì vậy frontend chỉ có thể đặt form profile trong khu vực `TENANT_ADMIN`; backend là lớp duy nhất phân biệt TENANT_ADMIN thường với owner và sẽ trả 403 đúng quy tắc.
2. Owner không có endpoint đọc toàn bộ profile tenant. Form hiện lấy tên từ membership và để trống các field chưa được API cung cấp; chỉ field người dùng chủ động sửa mới được PATCH.

Đề xuất backend không phá vỡ API: thêm `isOwner` vào membership response và thêm endpoint owner-readable `GET /tenants/{id}/profile` (hoặc cho owner đọc profile subset). Khi có hai field này, frontend có thể ẩn form chính xác trước khi gọi API và prefill đầy đủ.

