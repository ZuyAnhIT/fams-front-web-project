# Cấu Trúc Thư Mục Dự Án FAMS Web Frontend

Tài liệu này mô tả chi tiết về cấu trúc thư mục của dự án **FAMS Web Frontend** (`fams-front-web-project`), được xây dựng dựa trên framework **Next.js 16 (App Router)**, kết hợp với **TypeScript**, **Tailwind CSS v4**, **Zustand** (quản lý state), và **TanStack React Query** (quản lý server state).

Dự án áp dụng mô hình thiết kế **Feature-Based Architecture (Kiến trúc theo Tính năng)** kết hợp với **Clean Architecture**, giúp mã nguồn dễ bảo trì, dễ mở rộng và dễ dàng làm việc nhóm.

---

## 📌 Cấu Trúc Tổng Quan (Cấp Cao)

```text
fams-front-web-project/
├── .next/                  # Thư mục build tự động của Next.js
├── node_modules/           # Các thư viện phụ thuộc cài đặt qua npm
├── public/                 # Các tài nguyên tĩnh (hình ảnh, fonts, icons, v.v.)
├── src/                    # Thư mục chứa mã nguồn chính của ứng dụng
│   ├── app/                # Next.js App Router (Routing, Layouts, API Routes)
│   ├── components/         # Các component UI dùng chung cho toàn bộ dự án
│   ├── config/             # Cấu hình hệ thống (môi trường, menu điều hướng)
│   ├── constants/          # Các giá trị hằng số (routes, roles, permissions)
│   ├── features/           # Module các tính năng nghiệp vụ của ứng dụng
│   ├── hooks/              # Custom React Hooks dùng chung toàn hệ thống
│   ├── layouts/            # Các layout giao diện chính (AuthLayout, DashboardLayout)
│   ├── lib/                # Cấu hình & khởi tạo thư viện bên thứ ba (Axios, React Query)
│   ├── schemas/            # Zod validation schemas dùng chung
│   ├── services/           # Các dịch vụ gọi API chung toàn hệ thống
│   ├── stores/             # Zustand stores quản lý global state
│   ├── types/              # Định nghĩa kiểu dữ liệu (TypeScript Types/Interfaces)
│   └── utils/              # Các hàm tiện ích bổ trợ (helpers, formatters)
├── eslint.config.mjs       # Cấu hình kiểm tra lỗi mã nguồn (ESLint)
├── next.config.ts          # Cấu hình của Next.js
├── package.json            # Thông tin dự án và quản lý các package dependencies
├── postcss.config.mjs      # Cấu hình PostCSS cho Tailwind
├── tsconfig.json           # Cấu hình TypeScript cho dự án
└── TAILIEU.md              # Tài liệu cấu trúc thư mục này
```

---

## 📂 Chi Tiết Từng Thư Mục Trong `src/`

### 1. `src/app/` (Next.js App Router)
Thư mục này chịu trách nhiệm định tuyến (routing) dựa trên cấu trúc thư mục của Next.js.
*   `layout.tsx`: Root Layout định nghĩa khung HTML cơ bản, font chữ và các thiết lập toàn cục.
*   `page.tsx`: Trang chủ `/`, hiện tại đang thực hiện chuyển hướng (`redirect("/login")`) sang trang đăng nhập.
*   `globals.css`: File CSS chứa cấu hình Tailwind CSS v4 và styles toàn cục.
*   `api/health/route.ts`: API Route kiểm tra sức khỏe của dịch vụ (Health Check).
*   `(auth)/`: Nhóm route phục vụ cho phần xác thực người dùng (Authentication). Sử dụng cặp ngoặc đơn `()` để gom nhóm route mà không làm ảnh hưởng đến đường dẫn URL.
    *   `login/page.tsx`: Trang đăng nhập hệ thống.
    *   `forgot-password/`: Trang yêu cầu khôi phục mật khẩu.
    *   `reset-password/`: Trang đặt lại mật khẩu mới.
    *   `layout.tsx`: Layout riêng cho các trang xác thực (giao diện đơn giản, không có sidebar/header).
*   `(dashboard)/`: Nhóm route chứa các trang nghiệp vụ sau khi người dùng đăng nhập thành công.
    *   `layout.tsx`: Layout quản trị bao gồm Sidebar bên trái, Header bên trên và khu vực hiển thị nội dung chính.
    *   `dashboard/`: Trang thống kê tổng quan (Dashboard).
    *   `assignments/`: Quản lý việc phân công công việc/nhiệm vụ.
    *   `attendance/`: Quản lý chấm công, theo dõi giờ giấc làm việc.
    *   `employees/`: Quản lý thông tin nhân viên.
    *   `random-checks/`: Quản lý các ca kiểm tra đột xuất/ngẫu nhiên.
    *   `reports/`: Báo cáo, kết xuất dữ liệu và thống kê.
    *   `settings/`: Cài đặt hệ thống hoặc tài khoản cá nhân.
    *   `shifts/`: Quản lý ca làm việc.
    *   `sites/`: Quản lý các điểm làm việc/địa bàn thực địa.
    *   `violations/`: Quản lý các trường hợp vi phạm quy định (đi muộn, sai vị trí, v.v.).

### 2. `src/features/` (Mô hình Module theo Tính Năng)
Đây là phần quan trọng nhất trong cấu trúc mã nguồn. Thay vì đặt tất cả code vào các thư mục dùng chung, dự án phân tách theo từng **Domain/Feature** nghiệp vụ riêng biệt. Mỗi tính năng là một thư mục khép kín chứa đầy đủ tài nguyên cần thiết.

Các tính năng hiện có:
`assignment`, `attendance`, `auth`, `dashboard`, `employee`, `notification`, `random-check`, `report`, `role-permission`, `setting`, `shift`, `site`, `tenant`, `violation`.

Mỗi thư mục feature (ví dụ: `src/features/auth/`) được chia nhỏ như sau:
*   `components/`: Các component giao diện chỉ dùng riêng cho tính năng này.
*   `hooks/`: Custom React Hooks riêng cho nghiệp vụ này (ví dụ: `useAuthQuery`).
*   `schemas/`: Các validation schema riêng cho forms của tính năng này.
*   `services/`: Các API calls tương tác với backend thuộc phạm vi tính năng này.
*   `store/`: Zustand state nội bộ của tính năng.
*   `types/`: Các TypeScript interface/type chỉ dùng trong tính năng này.
*   `utils/`: Các hàm định dạng hoặc xử lý dữ liệu đặc thù.

> **Lưu ý quan trọng**: Việc đóng gói theo feature giúp chúng ta có thể dễ dàng di chuyển, xóa bỏ hoặc nâng cấp một tính năng cụ thể mà không làm ảnh hưởng hay gây lỗi lan truyền đến các phần khác của ứng dụng.

### 3. `src/components/` (Shared Components)
Chứa các UI Components có khả năng tái sử dụng cao trên toàn bộ dự án:
*   `ui/`: Chứa các component nguyên tử cơ bản như `Button.tsx`, `Input.tsx`, `Badge.tsx` (thiết kế theo phong cách tối giản/hướng thiết kế atomic).
*   `shared/`: Các component dùng chung phức tạp hơn (ví dụ: `PageHeader`, `Breadcrumb`).
*   `charts/`: Các component biểu đồ hiển thị dữ liệu (thường wrap từ thư viện Recharts).
*   `feedback/`: Các thành phần hiển thị phản hồi như `Loader`, `Skeleton`, `ModalConfirm`, `Toast`.
*   `forms/`: Các phần tử input form phức tạp hoặc lặp lại nhiều lần.
*   `maps/`: Biểu diễn bản đồ thực địa sử dụng thư viện Leaflet.
*   `tables/`: Data tables dùng chung hỗ trợ phân trang, sắp xếp và lọc dữ liệu.

### 4. `src/config/` (App Configuration)
*   `env.ts`: Định nghĩa và kiểm tra các biến môi trường (Environment Variables) như `NEXT_PUBLIC_API_URL`.
*   `menu.ts`: Cấu hình danh sách menu, đường dẫn (routes), icon và quyền hạn (permissions) hiển thị trên Sidebar của Admin.

### 5. `src/constants/` (Constants)
*   `app.ts`: Các giá trị hằng số dùng chung của ứng dụng (ví dụ: định dạng ngày tháng mặc định, giới hạn bản ghi phân trang).
*   `routes.ts`: Quản lý tập trung danh sách các đường dẫn tĩnh (URL paths) để tránh viết cứng (hardcode) trong code.
*   `roles.ts`: Định nghĩa các quyền vai trò trong hệ thống (như Admin, Manager, Employee, v.v.).
*   `permissions.ts`: Định nghĩa danh sách chi tiết các quyền hạn truy cập chức năng.

### 6. `src/hooks/` (Shared Hooks)
Các custom hook dùng chung cho nhiều trang/tính năng:
*   `useCurrentUser.ts`: Lấy thông tin tài khoản người dùng đang đăng nhập hiện tại từ store.
*   `usePermission.ts`: Kiểm tra xem người dùng hiện tại có đủ quyền thực hiện hành động cụ thể hay không.
*   `usePagination.ts`: Quản lý state phân trang (trang hiện tại, kích thước trang) của các danh sách.
*   `useDebounce.ts`: Trì hoãn việc cập nhật giá trị (thường dùng cho các ô tìm kiếm tức thời - search input).

### 7. `src/layouts/` (Layouts)
Các layout bọc ngoài giao diện chính của ứng dụng:
*   `AuthLayout.tsx`: Layout tối giản dùng cho màn hình Login, Reset Password.
*   `DashboardLayout.tsx`: Layout chính cho khu vực quản trị.
*   `Sidebar.tsx`: Thanh điều hướng bên trái chứa danh mục chức năng.
*   `Header.tsx`: Thanh công cụ trên cùng chứa thông tin người dùng, thông báo và nút đăng xuất.
*   `MobileNav.tsx`: Menu phụ khi hiển thị trên các thiết bị di động (màn hình nhỏ).

### 8. `src/lib/` (Third-party Libraries Configuration)
Nơi khởi tạo cấu hình các công cụ/thư viện bên thứ ba:
*   `axios.ts`: Cấu hình instance Axios (thiết lập Base URL, Interceptors tự động đính kèm Token và xử lý lỗi tập trung).
*   `query-client.ts`: Khởi tạo và thiết lập các tùy chọn mặc định cho React Query (Caching, Refetching).
*   `auth.ts`: Các tiện ích xử lý token, cookie hoặc session liên quan đến thư viện xác thực.
*   `date.ts`: Cấu hình xử lý múi giờ và định dạng thời gian.

### 9. `src/schemas/` (Zod Schemas)
Định nghĩa các Schema xác thực biểu mẫu bằng thư viện Zod dùng chung trên nhiều trang:
*   `auth.schema.ts`: Xác thực form Login, Forgot Password.
*   `employee.schema.ts`: Xác thực dữ liệu khi Thêm/Sửa nhân viên.
*   `site.schema.ts`: Xác thực dữ liệu khi tạo Điểm làm việc.

### 10. `src/services/` (Global API Services)
*   `api-client.ts`: Chứa instance gọi API cơ sở được xuất bản từ `lib/axios`.
*   `auth-token.service.ts`: Quản lý lưu trữ/truy xuất Access Token và Refresh Token từ Cookie hoặc LocalStorage.
*   `upload.service.ts`: Xử lý việc upload file (ảnh đại diện, tài liệu đính kèm) lên server.
*   `websocket.service.ts`: Xử lý kết nối Real-time qua giao thức WebSocket (nhận thông báo, cập nhật vị trí trực tiếp).

### 11. `src/stores/` (Zustand Global State)
Quản lý trạng thái toàn cục của ứng dụng:
*   `auth.store.ts`: Lưu trữ trạng thái đăng nhập và thông tin chi tiết của user hiện tại.
*   `app.store.ts`: Quản lý trạng thái giao diện ứng dụng (ví dụ: Sidebar đóng hay mở, chủ đề tối/sáng).
*   `notification.store.ts`: Quản lý danh sách và hiển thị các thông báo nhanh (toasts/notifications).

### 12. `src/types/` (TypeScript Declarations)
*   `api.ts`: Các kiểu dữ liệu của API response chuẩn (ví dụ: `ApiResponse<T>`, `PaginationMeta`).
*   `auth.ts`: Kiểu dữ liệu liên quan đến phiên làm việc, thông tin JWT token.
*   `user.ts`: Định nghĩa cấu trúc đối tượng User, Employee.
*   `tenant.ts`: Cấu trúc dữ liệu dành cho hệ thống đa công ty/chi nhánh (Multi-tenancy).
*   `common.ts`: Các kiểu dữ liệu tiện ích chung khác.

### 13. `src/utils/` (Helper Functions)
*   `cn.ts`: Hàm kết hợp `clsx` và `tailwind-merge` để xử lý class Tailwind một cách thông minh (ghi đè class bị trùng lặp).
*   `format-date.ts`: Chuyển đổi định dạng ngày tháng hiển thị thân thiện (ví dụ: `18/06/2026`).
*   `format-number.ts`: Định dạng số, tiền tệ, hiển thị phần trăm.
*   `file.ts`: Tiện ích tải file, chuyển đổi định dạng file hoặc kiểm tra dung lượng file.

---

## 🛠️ Quy Trình Thêm Một Tính Năng Mới (Best Practices)

Để giữ cho cấu trúc dự án luôn sạch sẽ và nhất quán, khi phát triển một tính năng mới (ví dụ: Quản lý thiết bị - `device`), lập trình viên nên tuân thủ quy trình sau:

1.  **Tạo thư mục feature**: Thêm `src/features/device/` với các thư mục con tương ứng (`components`, `services`, `types`, v.v.).
2.  **Định nghĩa kiểu dữ liệu & schemas**: Viết types trong `src/features/device/types/device.type.ts` và Zod validation trong `src/features/device/schemas/device.schema.ts`.
3.  **Tạo API service**: Viết các hàm gọi API GET/POST/PUT/DELETE trong `src/features/device/services/device.service.ts`.
4.  **Tạo hooks quản lý dữ liệu**: Viết các React Query hook trong `src/features/device/hooks/` để gọi service và cache dữ liệu.
5.  **Tạo components giao diện**: Xây dựng UI trong `src/features/device/components/`.
6.  **Đăng ký Route**: Tạo thư mục route mới trong App Router `src/app/(dashboard)/devices/page.tsx` và gọi component chính của feature từ bước 5 vào đây.
7.  **Cập nhật Sidebar**: Thêm route mới vào `src/config/menu.ts` để hiển thị trên Sidebar điều hướng.
