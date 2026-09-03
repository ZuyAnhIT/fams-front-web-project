# Responsive fixes — list-page filter/search bars (#02) & account chip (#03)

Ngày: 2026-09-03 · Repo: `fams-front-web-project`

## #02 — Thanh lọc/tìm kiếm ở các trang danh sách không responsive

### Triệu chứng
Trên các trang dùng `ListHeader` (Nhân viên, Người dùng, Công ty, Vai trò, Báo cáo Face ID,
Lời mời, Công trình…), từ khoảng màn hình `lg` trở lên ô tìm kiếm **co lại chỉ còn cái icon
kính lúp**, còn các `<Select>` lọc thì chồng/lệch nhau với bề rộng không đồng đều.

### Nguyên nhân gốc
1. `ListHeader` để ô search (`flex-1`) và cụm filter (`w-full` + `<Space>`/`w-44` cố định)
   **giành chiều rộng nhau** trong cùng một flex-row. Cụm filter không có `min-w-0` nên
   không chịu co, ô search `flex-basis:0` bị ép về `min-content` = chỉ còn icon.
2. Mỗi trang tự đặt bề rộng filter kiểu khác nhau: `<Space wrap>` + `w-full sm:w-44`,
   `w-44`/`w-40` cứng (không có prefix responsive), `!w-full sm:!w-56`… → không nhất quán.
3. `GlobalSearch` trên `Header` bị hở: class `hidden` (Tailwind, nằm trong `@layer`) thua
   `.ant-input-affix-wrapper { display:inline-flex }` của antd (không nằm trong layer) nên
   **không bao giờ ẩn** ở màn trung bình, càng bóp ô tài khoản.

### Đã sửa
- **`components/shared/layout/ListHeader.tsx`** viết lại bố cục:
  - Cụm nút hành động (`actions`) tách hẳn lên một hàng riêng phía trên → không còn tranh
    chỗ với ô search.
  - Ô search: `w-full sm:max-w-md`, luôn có bề rộng ổn định, không bao giờ co còn icon.
  - Cụm filter: **CSS grid đồng nhất** `grid-cols-1 → 2 (≥520px) → 3 (lg) → 4 (xl)`, mỗi
    control là một ô và tự giãn đầy ô (`[&>*]:w-full [&>*]:min-w-0`). Trang chỉ cần truyền
    các control trong một fragment, không cần class bề rộng.
- Các trang gọi `ListHeader` bỏ wrapper thừa (`<Space wrap>`, `<div className="flex …">`) và
  bỏ class bề rộng cứng: `EmployeeListPage`, `UserDirectoryPage`, `TenantListPage`,
  `RoleManagementPage`, `FaceIdEnrollmentReportPage`, `SitePage`, `InvitationListPage`,
  `PlatformInvitationPanel`.
- **`GlobalSearch.tsx`**: đưa việc ẩn/hiện lên `<div className="hidden xl:block">` (div
  thường, không bị antd CSS đè); chỉ hiện từ `xl` trở lên.

## #03 — Thông tin tài khoản góc phải bị cắt thành "..."

### Triệu chứng
Với tên/vai trò dài, chip tài khoản trên `Header` hiển thị `Nguyễ…` / `Quả…`.

### Nguyên nhân gốc
Cột tên/vai trò `md:flex` + `max-w-40` + `min-w-0` bị co vô tội vạ khi `GlobalSearch`
(256px) cũng hiện cùng hàng ở màn `md`–`lg`.

### Đã sửa (`layouts/Header.tsx`)
- Cột tên/vai trò chỉ hiện từ `lg` (nơi có đủ chỗ), `GlobalSearch` lùi tới `xl` → không còn
  đè nhau.
- `max-w-[9rem]` (`xl:max-w-[13rem]`) + `title` + `aria-label` chứa **đầy đủ tên & vai trò**
  (hover xem full; vẫn luôn có trong dropdown). Vai trò giờ hiển thị đủ ở `lg`.

## Ảnh minh chứng (Playwright — `tests/e2e/responsive-list-header.spec.ts`)
- `employees-{phone-375,tablet-768,laptop-1024,desktop-1440}.png` — trang Nhân viên 4 khổ.
- `header-{…}.png` — riêng vùng header (chip tài khoản).
- `admin-users-{375,768,1440}.png` — trang Người dùng (kiểm tra các trang đã bỏ wrapper).

Chạy lại: `PLAYWRIGHT_PORT=3000 npx playwright test responsive-list-header` (khi đã có
`npm run dev` ở cổng 3000), hoặc `npx playwright test responsive-list-header` để Playwright
tự build+serve.
