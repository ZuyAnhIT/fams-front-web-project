# Trạng thái hiện tại và bàn giao dự án FAMS Frontend

> Cập nhật: 23/07/2026  
> Mục đích: đây là tài liệu đầu tiên cần đọc khi bắt đầu một chat/phiên phát triển mới. Nội dung mô tả trạng thái mã nguồn hiện tại, những gì đã xử lý và các rủi ro còn mở.

## 1. Kết luận ngắn

FAMS Frontend hiện **đủ nền tảng để tiếp tục phát triển tính năng có kiểm soát**, nhưng **chưa production-ready** và không nên hiểu là toàn bộ lỗi/nhược điểm đã được xử lý.

Đợt cải thiện gần nhất tập trung vào UI/UX và tính đúng đắn của dữ liệu hiển thị:

- Dashboard không còn số liệu hard-code.
- Luồng chọn công ty giả đã bị loại bỏ; route cũ chuyển về dashboard.
- Các menu placeholder đã được ẩn khỏi điều hướng chính.
- Dashboard shell, sidebar, header và mobile navigation đã responsive.
- Bảng, bộ lọc, form, empty state, focus state và thông báo đã được chuẩn hóa bước đầu.
- Các màn hình nhân sự, công trình, chấm công, phòng ban, công ty, gói dịch vụ, vai trò và cài đặt đã được tối ưu responsive.
- Đã bổ sung route `loading.tsx`, `error.tsx`, `global-error.tsx` và `not-found.tsx`.
- Cấu hình công ty sử dụng đúng `tenantId`; cấu hình hiển thị và IP whitelist nằm chung một giao diện.
- Font Google lúc build đã được thay bằng system font stack để tránh phụ thuộc mạng.

Các vấn đề lớn còn lại là automated test, security phiên đăng nhập, authorization backend, Turbopack không ổn định, lint warnings, API dashboard tổng hợp và chuyển đổi multi-tenant thật.

## 2. Kết quả kiểm chứng gần nhất

| Kiểm tra | Kết quả |
|---|---|
| `npm run typecheck` | Pass |
| `npm run lint` | Pass với 0 error; còn 209 warnings |
| `npm run lint -- --quiet` | Pass |
| `npx next build --webpack` | Pass; build thành công 34 route |
| `GET http://localhost:3000/login` | `200 OK` |
| `GET http://localhost:3000/api/health` | `200 OK` |
| `GET http://localhost:8080/api/v1/auth/me` không token | `401 Unauthorized`, đúng kỳ vọng |

Turbopack từng hang/panic khi compile dev và từng bị giới hạn bind cổng phụ trong môi trường kiểm tra. Đây không phải lỗi TypeScript hoặc Webpack build.

## 3. Cách chạy hiện tại

Tạm thời ưu tiên Webpack cho development:

```bash
npm ci
cp .env.example .env.local
npm run dev -- --webpack
```

Truy cập:

```text
http://localhost:3000/login
```

Backend local mặc định:

```text
http://localhost:8080
```

Không dùng `npm run dev` mặc định nếu Turbopack tiếp tục xuất hiện panic/hang. Nên cân nhắc đổi script `dev` trong `package.json` sang `next dev --webpack` cho đến khi nguyên nhân Turbopack được xác định.

## 4. Các thay đổi UI/UX đã hoàn thành

### Shell và điều hướng

- Desktop sidebar có trạng thái thu gọn và active state.
- Mobile dùng navigation drawer, có nút đóng và tự đóng sau khi điều hướng.
- Header hiển thị ngữ cảnh trang và vai trò người dùng.
- Có skip-link tới nội dung chính và focus-visible cho keyboard.
- Menu được lọc theo role; mục chưa có nghiệp vụ thật không còn hiển thị.

### Dashboard

- Admin dashboard chỉ hiển thị các khu vực quản trị có thật; không tạo thống kê giả.
- Customer dashboard hiển thị lối tắt theo role.
- Tổng nhân viên và danh sách nhân viên gần nhất lấy từ employee API.
- Chưa có platform/tenant aggregate dashboard API.

### Màn hình nghiệp vụ

- Chuẩn hóa page heading, khoảng cách và card cho tenant, plan, role, employee, site, attendance, workspace và settings.
- Bảng dùng chung có empty state tiếng Việt, pagination và horizontal scroll.
- Bộ lọc/search đã responsive và có nhãn accessibility.
- Sửa tìm kiếm vai trò: trước đây nhập từ khóa nhưng query không được cập nhật.
- Danh sách nhân viên không còn tự lọc tài khoản hiện tại khiến tổng số và số dòng lệch nhau.
- Chấm công/check-in có bộ lọc co giãn trên mobile và empty state theo nghiệp vụ.
- Notification popover co giãn theo viewport, item có thể thao tác bằng bàn phím.

### Cấu hình công ty

- Route canonical: `/customer/settings/tenant`.
- Route cũ `/customer/tenant-settings` redirect về route canonical.
- `TenantSettingsPage` dùng tenant hiện tại từ auth store nếu không nhận prop.
- Giao diện có tab cấu hình hiển thị và danh sách IP an toàn.

## 5. Vấn đề phải biết trước khi phát triển tiếp

### P0 — cần xử lý sớm

1. Chưa có automated test hoặc E2E test.
2. Refresh/access token vẫn liên quan tới client storage; cần security review và ưu tiên HttpOnly cookie nếu backend hỗ trợ.
3. Phải xác nhận backend enforce role, permission, tenant và ownership cho mọi endpoint; `RoleGuard` frontend không phải ranh giới bảo mật.
4. Dev server Turbopack chưa ổn định; dùng Webpack cho đến khi xử lý xong.

### P1 — ảnh hưởng phát triển tính năng mới

1. Còn 209 ESLint warnings, chủ yếu là `any`, import thừa và `<img>` chưa tối ưu.
2. Chưa có API dashboard thống kê tổng hợp cho platform/tenant.
3. Chưa có API membership/active-tenant để chuyển công ty thật.
4. Một số query key/service pattern chưa đồng nhất hoặc chưa gắn đầy đủ tenant context.
5. Một số domain còn implementation trùng lặp, đặc biệt role/permission và một phần settings/notification.
6. Nhiều file scaffold/rỗng vẫn tồn tại và có thể làm người đọc hiểu sai mức độ hoàn thiện.

### Route chưa hoàn thiện

Các route sau vẫn tồn tại nhưng là scaffold/placeholder hoặc chưa có luồng hoàn chỉnh:

- `/admin/reports`
- `/customer/random-checks`
- `/customer/violations`
- `/customer/sites/create`

Chúng đã được ẩn khỏi menu khi phù hợp, nhưng vẫn có thể truy cập trực tiếp. Khi chưa triển khai nên redirect hoặc trả 404 rõ ràng.

## 6. Điều kiện trước khi mở rộng feature lớn

Tối thiểu nên hoàn thành:

1. Cố định cách chạy dev bằng Webpack hoặc giải quyết lỗi Turbopack.
2. Thêm smoke test cho login, refresh, logout và role-based navigation.
3. Thêm test cho pagination/filter và ít nhất một CRUD quan trọng.
4. Xác nhận authorization backend cho toàn bộ endpoint tenant-scoped.
5. Áp dụng quy tắc: code mới không tạo thêm ESLint warning.
6. Chốt API contract/OpenAPI cho feature sắp phát triển trước khi dựng UI.

## 7. Quy tắc cho chat/agent tiếp theo

Khi tiếp tục làm việc trên repository này:

- Đọc `AGENTS.md` và tài liệu Next.js 16 trong `node_modules/next/dist/docs/` trước khi sửa convention/API Next.js.
- Đọc tài liệu này trước, sau đó mới đọc `docs/FAMS_FRONTEND_ARCHITECTURE.md` khi cần toàn bộ kiến trúc/API.
- Worktree hiện có nhiều thay đổi chưa commit; không reset, checkout hoặc ghi đè thay đổi không liên quan.
- Không đưa số liệu mock/hard-code vào UI production.
- Không hiển thị menu cho feature chưa có nghiệp vụ/API thật.
- Luồng ưu tiên: `page → feature component → typed React Query hook → service → apiClient`.
- Query key cho dữ liệu tenant phải chứa `tenantId`.
- Backend là nơi enforce authorization cuối cùng.
- Sau mỗi đợt sửa phải chạy tối thiểu:

```bash
npm run lint -- --quiet
npm run typecheck
npx next build --webpack
```

## 8. Tài liệu liên quan

- Kiến trúc, cấu trúc thư mục, thư viện, API và danh mục tính năng: [`docs/FAMS_FRONTEND_ARCHITECTURE.md`](./FAMS_FRONTEND_ARCHITECTURE.md)
- Hướng dẫn khởi động nhanh: [`README.md`](../README.md)
- Quy tắc riêng cho agent: [`AGENTS.md`](../AGENTS.md)

