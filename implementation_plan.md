# Kế hoạch Xây dựng Lõi Phân quyền (RBAC Core) cho Frontend

Tài liệu này mô tả chi tiết các bước sẽ thực hiện để nâng cấp hệ thống Frontend, đảm bảo tuân thủ nghiêm ngặt mô hình 3 cấp độ phân quyền (Platform Admin, Tenant Admin, Employee) theo chuẩn Backend.

## User Review Required

> [!IMPORTANT]
> Vui lòng xem kỹ phần **Câu hỏi Mở (Open Questions)** bên dưới. Xác nhận giúp tôi danh sách các Role cố định mà chúng ta sẽ dùng để khớp với Backend.

## Open Questions

1. Ở mức độ cơ bản nhất, chúng ta sẽ định nghĩa 3 hằng số Role chính xác như sau phải không: `PLATFORM_ADMIN`, `TENANT_ADMIN`, và `EMPLOYEE`? (Với nhân viên bình thường mang role `EMPLOYEE` hoặc một mảng các permissions).
2. Tạm thời, do Backend chưa hoàn thiện phần Login cấp độ sâu, tôi sẽ tạo ra **3 tài khoản ảo (Mock Accounts)** ở màn hình Login để bạn có thể chọn đăng nhập thử nghiệm từng quyền nghiệm thu (VD: Nút "Đăng nhập với tư cách System Admin", "Đăng nhập với tư cách Giám đốc Công ty"). Bạn có đồng ý với cách tiếp cận này trong lúc code không?

## Proposed Changes

Dưới đây là chi tiết các thay đổi trên mã nguồn Frontend:

### Core Auth Types

#### [MODIFY] `src/features/auth/types/auth.type.ts`
- Bổ sung Enum `SystemRole` (chứa `PLATFORM_ADMIN`, `TENANT_ADMIN`, `EMPLOYEE`).
- Sửa kiểu dữ liệu `role?: string` thành `role?: SystemRole`.
- Sửa kiểu dữ liệu `tenantId?: string` để bắt buộc có nếu không phải là Platform Admin.

---

### Dynamic Navigation Menu

#### [MODIFY] `src/config/menu.ts`
- Cập nhật interface `MenuItem` để thêm thuộc tính tùy chọn `allowedRoles?: SystemRole[]`.
- Gắn quyền cụ thể cho từng menu. Ví dụ:
  - Công ty (`/tenants`): `['PLATFORM_ADMIN']`
  - Gói dịch vụ (`/plans`): `['PLATFORM_ADMIN']`
  - Nhân viên (`/employees`): `['TENANT_ADMIN']`
  - Cấu hình công ty (`/settings/tenant`): `['TENANT_ADMIN']`
  - Tổng quan (`/dashboard`): Tất cả mọi người.

#### [MODIFY] `src/layouts/Sidebar.tsx`
- Sửa lại hàm lặp `SIDEBAR_MENU.map`. Trước khi render, dùng lệnh `filter` kiểm tra xem `user.role` hiện tại có nằm trong mảng `allowedRoles` của menu đó không. Nếu không, loại bỏ khỏi thanh Sidebar.

---

### Security & Route Guards

#### [NEW] `src/components/guards/RoleGuard.tsx`
- Tạo một Component bọc ngoài (Wrapper). Nó sẽ nhận `allowedRoles` và đọc role từ `useAuthStore`.
- Nếu Role không khớp, Component sẽ chặn không render nội dung (Children) và hiển thị một Component thông báo lỗi thân thiện (VD: "403 - Bạn không có quyền truy cập trang này"), hoặc tự động đá người dùng về trang `/dashboard`.

#### [MODIFY] `src/app/(dashboard)/tenants/page.tsx` và các trang liên quan
- Sử dụng `<RoleGuard>` bọc xung quanh toàn bộ UI của trang để đảm bảo chặn tận gốc việc người dùng gõ URL lách luật.

---

### Cập nhật Dữ liệu Mẫu (Mock Data)

#### [MODIFY] `src/features/auth/stores/auth.store.ts` (hoặc mock service)
- Sửa lại hàm Mock Login để nhận diện email đăng nhập. 
- Nếu nhập `admin@fams.com` -> Gán cứng Role là `PLATFORM_ADMIN` và `tenantId = null`.
- Nếu nhập `alice@acme.com` -> Gán Role là `TENANT_ADMIN` và `tenantId = 'acme-id'`.
- Nếu nhập email khác -> Gán Role là `EMPLOYEE`.

## Verification Plan

### Manual Verification
1. Chọn Login bằng tài khoản `admin@fams.com`. Kỳ vọng: Nhìn thấy menu Quản lý công ty, Gói dịch vụ. Không có menu Nhân viên nội bộ (nếu áp dụng triệt để).
2. Chọn Login bằng tài khoản `alice@acme.com`. Kỳ vọng: Thanh Sidebar ngắn lại, chỉ thấy menu Nhân viên, Phân quyền, Cài đặt công ty. KHÔNG thấy Quản lý công ty.
3. Trong lúc đang đăng nhập tài khoản của `alice`, thử gõ URL trực tiếp `http://localhost:3000/tenants`. Kỳ vọng: Giao diện chớp màn hình báo lỗi "403 - Không có quyền truy cập" thay vì hiển thị dữ liệu trái phép.
