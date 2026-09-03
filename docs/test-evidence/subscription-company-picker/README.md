# #04 — Lối vào "Công ty của tôi" & #05 — Modal cập nhật gói dịch vụ

Ngày: 2026-09-03 · Repo: `fams-front-web-project`

## #04 — Người dùng đã có 1 công ty không có cách tạo/chuyển công ty khác

### Thực trạng
Tính năng **đã tồn tại đầy đủ**:
- Backend `POST /api/v1/tenants` cho **bất kỳ user đã đăng nhập** tự tạo công ty của mình
  (tự động thành `TENANT_ADMIN`, được sở hữu nhiều công ty cùng lúc) — không cần Platform Admin.
- Frontend đã có trang `/customer/select-company` (`SelectCompanyPage` + `CreateCompanyForm`)
  để chọn/tạo công ty.

**Lỗi:** trang đó **không có lối vào** cho người dùng chỉ có 1 công ty — `TenantSwitcher` trên
Header tự ẩn khi `< 2` công ty, và không có menu/nav nào khác trỏ tới. → người dùng tưởng
không tạo thêm được.

### Đã sửa
`layouts/Header.tsx`: thêm mục **"Công ty của tôi"** (icon Building) vào dropdown tài khoản,
luôn hiển thị khi `user?.tenantId` — trỏ tới `/customer/select-company`. `TenantSwitcher`
(chuyển nhanh khi có 2+ công ty) giữ nguyên.

Không đụng backend — đã đủ.

## #05 — Modal "Cập nhật gói dịch vụ" xấu

`features/admin/subscription/components/SubscriptionManager.tsx` (Platform Admin →
Chi tiết công ty → tab Gói dịch vụ).

### Vấn đề
- `<input type="datetime-local">` thuần → xấu, định dạng `mm/dd/yyyy` kiểu Mỹ.
- `<Modal classNames={{ wrapper: ... }}>` sai target (antd v6 dùng `container`).
- Chiều cao control lệch (`h-11` vs `h-10` của BaseSelect), bố cục dàn phẳng 1 cột.
- Nút "Hủy" ăn màu primary xanh do BaseButton mặc định `type="primary"`.

### Đã sửa
- Ngày hết hạn → `BaseDatePicker` (antd), `showTime`, format `DD/MM/YYYY HH:mm`, có helper text.
- `classNames.container` đúng chuẩn antd v6; bỏ nền trắng nhầm ở `wrapper`.
- Chu kỳ thanh toán + Trạng thái xếp **grid 2 cột** (`sm:grid-cols-2`), 1 cột trên mobile.
- Thêm **preview giá gói** khi chọn (dùng `priceMonthly`/`priceYearly` + `description`).
- Nhãn tiếng Việt gọn ("Đang hoạt động" thay "Active (Đang hoạt động)"…).
- Nút "Hủy" `type="default"` viền xám; các control đồng nhất `h-10`; modal `width={520}`.

## Ảnh minh chứng (`tests/e2e/subscription-modal-company-picker.spec.ts`)
- `subscription-modal-{1280,390}.png` — modal desktop + mobile.
- `account-menu-1280.png` — dropdown tài khoản có "Công ty của tôi".
- `select-company-1280.png` — trang chọn/tạo công ty.
