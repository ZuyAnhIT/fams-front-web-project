# Báo cáo hoàn thiện cấu hình Tenant và gói dịch vụ

Ngày kiểm tra: 24/07/2026  
Frontend: `fams-front-web-project`  
Contract: `fams-backend-project/docs/api/tenant-ui-permissions-guide.md`

## 1. Kết luận

Đã hoàn thiện và kiểm tra sáu nhóm chức năng:

| Nhóm | Trước khi sửa | Kết quả |
|---|---|---|
| Sửa hồ sơ công ty | Mọi `TENANT_ADMIN` đều thấy form; form chưa có dữ liệu đầy đủ | Xác minh `user.id === tenant.ownerId` bằng operational detail; non-owner nhận màn 403; chỉ gửi field đã đổi |
| Giao diện/định dạng | Platform Admin có thể thấy nút lưu; thiếu màu phụ/màu nhấn; sai mặc định time format | Admin chỉ xem; owner sửa; đủ 3 màu, date/time, mã nhân viên; validate Hex |
| IP whitelist | Thiếu cảnh báo khi enforce; lỗi toggle bị thay bằng message chung; không có scope/pagination thật | Có cảnh báo active, scope, pagination; giữ nguyên message self-lockout từ backend |
| Gói hiện tại + usage | Owner gọi endpoint subscription, không có usage | Dùng một lần `GET /tenants/{id}/detail`, hiển thị limit/usage và “Không giới hạn” |
| Định nghĩa gói | Tắt gói trực tiếp, không hỗ trợ migration | Có dialog chọn `migrateToPlanId`, giữ nguyên lỗi giới hạn/migration từ backend |
| Đổi gói tenant | Đã có PATCH nhưng chưa có test quyền/payload | Platform Admin đổi qua `PATCH subscription`; owner chỉ có link liên hệ và không gọi write API |

Ngoài sáu nhóm trên, dropdown gói đã được xóa khỏi form platform provisioning theo contract
mới. Tenant luôn bắt đầu bằng gói trial và thao tác đổi gói được thực hiện riêng tại chi tiết.

## 2. Phân tách giao diện và quyền

| Tác vụ | Owner | Tenant admin không phải owner | Platform Staff | Platform Admin |
|---|---:|---:|---:|---:|
| Sửa hồ sơ tenant | Có | Ẩn/403 | Ẩn | Chỉ xem/403 khi PATCH |
| GET settings | Có | Có qua theme provider | Theo backend membership | Có |
| PATCH settings | Có | Ẩn/403 | Ẩn | Ẩn/403 |
| Quản lý IP whitelist | Có | Ẩn | Ẩn | Có trong công cụ hỗ trợ |
| Xem detail + usage | Có, tenant của mình | Ẩn/403 | Có `tenants:read` | Có |
| Định nghĩa plan/limits | Ẩn | Ẩn | Ẩn | Có |
| PATCH subscription | Ẩn | Ẩn | Ẩn | Có |

Frontend ẩn thao tác để đúng UX; backend vẫn là lớp quyết định quyền cuối cùng. Test thực tế
đã xác nhận Platform Admin PATCH profile/settings đều nhận 403.

## 3. Chi tiết triển khai

### Hồ sơ Company Portal

- Company Portal tải operational detail trước khi dựng màn quản trị.
- Chỉ render các tab owner-only khi `currentUser.id === tenant.ownerId`.
- Non-owner không nhận form/nút lưu trong DOM.
- Form được prefill từ detail và payload PATCH chỉ chứa field có `dirtyFields`.
- Chuỗi rỗng của `domain`/`logoUrl` vẫn được gửi để xóa theo contract.

### Settings và theme toàn portal

- Mọi thành viên có active tenant đều tải `GET /settings` qua `TenantThemeProvider`.
- Áp `--brand-primary`, `--brand-secondary`, `--brand-accent` lên document.
- Đưa `dateFormat` và `timeFormat` vào data attribute ở document để các formatter dùng chung.
- Owner sửa được; Admin Console chỉ xem và không có nút lưu.
- Client validate màu `#RGB` hoặc `#RRGGBB` trước khi gọi API.

### IP whitelist

- Entry hỗ trợ `all`, `web_admin`, `api`.
- Query truyền `page`/`size` và bảng dùng pagination 0-based đúng backend.
- Có ít nhất một entry active thì hiển thị cảnh báo whitelist đang enforce.
- Danh sách trống/không có entry active thì giải thích tenant chưa bị giới hạn IP.
- Add/toggle/delete đều ưu tiên `userMessage`, sau đó `message`; vì vậy hướng dẫn chống tự
  khóa từ `INVALID_ARGUMENT` được hiển thị nguyên văn.
- Platform Admin truy cập từ tab “Hỗ trợ: IP whitelist”; không đưa thành menu vận hành chính.

### Plan và subscription

- Owner dùng operational detail để xem gói, giới hạn và số đã dùng.
- `max* = null` hiển thị “Không giới hạn”.
- Storage không hiển thị usage giả vì backend chưa tổng hợp số đã dùng.
- Nút owner là `mailto` liên hệ nâng cấp, không gọi POST/PATCH subscription.
- Platform Admin có modal đổi plan/billing/status/expiry bằng PATCH.
- Khi tắt định nghĩa plan, UI cho chọn plan đích và gửi `migrateToPlanId`.
- Nếu tenant vượt giới hạn plan đích, backend trả 409 và UI hiển thị message thực tế.
- Mã plan bị khóa khi sửa vì backend `UpdatePlanRequest` không cho đổi system key.

## 4. Kiểm thử frontend

```text
npm run typecheck
PASS

npm run lint -- --quiet
PASS

git diff --check
PASS

PLAYWRIGHT_PORT=3100 npx playwright test \
  tests/e2e/tenant.spec.ts \
  tests/e2e/tenant-configuration.spec.ts \
  --project=chromium
9 passed
```

Các case mới:

1. Owner sửa settings chỉ gửi field thay đổi, thấy cảnh báo IP active, nhận nguyên văn lỗi
   self-lockout, xem usage và không gọi subscription write.
2. `TENANT_ADMIN` không phải owner không thấy bất kỳ công cụ owner-only nào.
3. Platform Admin chỉ xem settings nhưng đổi plan tenant bằng PATCH subscription.
4. Platform Admin tắt plan và gửi đúng `migrateToPlanId`.

Các case tenant có sẵn tiếp tục xác nhận list/filter/sort/pagination, platform staff read-only,
self-service payload, owner profile/usage và account lock.

Ảnh bằng chứng:

- `docs/test-evidence/tenant-configuration/01-owner-usage.png`
- `docs/test-evidence/tenant-configuration/02-non-owner-denied.png`
- `docs/test-evidence/tenant-configuration/03-admin-subscription.png`
- `docs/test-evidence/tenant-configuration/04-plan-migration.png`

## 5. Kiểm thử backend thật

| Suite | Kết quả |
|---|---:|
| `test_update_tenant.sh` | 8/8 |
| `test_tenant_settings.sh` | 12/12 |
| `test_ip_whitelist.sh` | 14/14 |
| `test_tenant_detail.sh` | 6/6 |
| `test_plans.sh` | 17/17 |
| `test_plan_limits.sh` | 13/13 |
| `test_subscription.sh` | 19/19 |
| `test_plan_deactivation_migration.sh` | 8/8 |

Hai script subscription/plan trong backend vẫn chứa payload setup cũ:

- Login gửi `email` thay vì `identifier`.
- Platform Admin tạo tenant mà không gửi owner.

Để kiểm tra contract hiện tại, các suite được chạy từ bản sao tạm với
`identifier="admin@fams.com"` và `ownerEmail="admin@fams.com"`. Không thay đổi source backend
trong nhiệm vụ frontend này. Sau điều chỉnh setup, toàn bộ assertion API đều pass.

## 6. Giới hạn còn lại

1. `maxStorageGb` chưa được backend enforce và chưa có `currentStorageGb`; UI ghi rõ đây là
   giới hạn tham khảo, không dựng số usage giả.
2. Backend membership response chưa có `isOwner`. Frontend hiện xác minh owner bằng
   `GET /tenants/{id}/detail`: owner nhận 200, non-owner nhận 403; menu owner-only chỉ hiện
   sau khi xác minh. Đề xuất bổ sung `isOwner` vào membership để menu được quyết định ngay
   từ phiên đăng nhập mà không cần một request bị từ chối.
3. Thanh toán online chưa có; đổi plan vẫn là quy trình do Platform Admin thực hiện.
