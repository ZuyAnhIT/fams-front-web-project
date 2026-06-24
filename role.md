# TÀI LIỆU: CHI TIẾT LUỒNG HOẠT ĐỘNG HỆ THỐNG FAMS (DỰA TRÊN BACKEND HIỆN TẠI)

Tài liệu này mô tả chi tiết các phân cấp người dùng và các luồng chức năng **đã được phát triển** ở phía Backend (Spring Boot). Nó đóng vai trò làm kim chỉ nam để phát triển giao diện (UI) và phân quyền tương ứng trên Frontend.

---

## I. CÁC SYSTEM ROLE (CHỨC VỤ HỆ THỐNG CỐ ĐỊNH)

Hệ thống B2B SaaS FAMS được thiết kế với cơ chế Multi-tenancy (Đa khách hàng). Dựa vào cấu hình Database của Backend, hệ thống đã "gieo" (seed) sẵn **5 System Role cố định** (được đánh dấu `is_system = true` và không thể xóa). Các Role này được chia thành 3 cấp độ quyền hạn từ cao xuống thấp:

### CẤP ĐỘ 1: QUẢN TRỊ NỀN TẢNG
#### 1. PLATFORM_ADMIN
- **Bản chất:** Là chủ sở hữu của phần mềm SaaS FAMS (ví dụ: `admin@fams.com`). Người này có quyền lực tối cao nhất.
- **Phạm vi dữ liệu:** Có thể nhìn thấy và can thiệp toàn bộ dữ liệu của tất cả các Công ty (Tenants) đang thuê phần mềm.

### CẤP ĐỘ 2: QUẢN TRỊ CÔNG TY
#### 2. TENANT_ADMIN
- **Bản chất:** Là người chủ hoặc người quản lý cấp cao của một công ty khách hàng (ví dụ: Giám đốc của Acme Corp).
- **Phạm vi dữ liệu:** Được cấp full quyền quản trị nội bộ. Dữ liệu bị giới hạn (Isolated) 100% trong phạm vi công ty của họ (dựa trên `tenantId`). 

### CẤP ĐỘ 3: NHÂN VIÊN VÀ QUẢN LÝ TẦM TRUNG
Ba Role dưới đây đều là người dùng thuộc nội bộ một công ty khách hàng, nhưng được chia sẵn quyền hạn theo mảng nghiệp vụ:

#### 3. HR_MANAGER (Trưởng phòng Nhân sự)
- **Bản chất:** Quản lý nhân sự và các vấn đề liên quan đến con người.
- **Quyền hạn cốt lõi:** Thêm/sửa nhân viên, quản lý ca làm việc, xem lịch sử chấm công, xử lý vi phạm.

#### 4. SITE_SUPERVISOR (Giám sát viên Địa bàn)
- **Bản chất:** Người quản lý và giám sát trực tiếp tại hiện trường.
- **Quyền hạn cốt lõi:** Quản lý danh sách địa bàn, tạo các cuộc kiểm tra đột xuất (Random checks), xem lượt check-in của nhân viên.

#### 5. EMPLOYEE (Nhân viên hiện trường)
- **Bản chất:** Nhân viên bình thường làm nhiệm vụ hàng ngày.
- **Quyền hạn cốt lõi:** Thấp nhất. Chỉ được quyền tự chấm công (check-in) và xem thông báo/lịch sử của chính mình.

*(Lưu ý: Ngoài 5 Role hệ thống này, các Công ty hoàn toàn có quyền tự tạo thêm các "Custom Roles" của riêng họ thông qua tính năng Quản lý Phân quyền).*

---

## II. CHI TIẾT CHỨC NĂNG DỰA THEO 5 SYSTEM ROLES

Dưới đây là danh sách các tính năng **đã có API ở Backend**, được đối chiếu chính xác với bộ quyền (Permissions) mà Backend đã cấp cho từng Role.

### 1. Dành cho PLATFORM_ADMIN

Luồng quản trị nền tảng cốt lõi (Có toàn bộ các quyền của hệ thống):
- **Quản lý Gói Dịch vụ (Plans):** Tạo mới, cập nhật giá, cài đặt giới hạn (Limits), vô hiệu hóa gói (`plans:create, read, update, list`).
- **Quản lý Khách hàng (Tenants):** Khởi tạo Công ty mới, xem danh sách toàn bộ Công ty (`tenants:create, read, update, list`).
- **Gán Gói Dịch Vụ:** Cấp phép và ấn định chu kỳ thanh toán cho Công ty.
- **Quản lý Hộ (Super Override):** Can thiệp thẳng vào cấu hình Giao diện (Settings) hoặc IP Whitelist của bất kỳ Công ty nào để hỗ trợ kỹ thuật.

---

### 2. Dành cho TENANT_ADMIN

Quản trị nội bộ toàn quyền của một Công ty (Có gần như mọi quyền, TRỪ các quyền thao tác trên `tenants` và `plans` của hệ thống):
- **Cấu hình Công ty:** Thay đổi Domain, Múi giờ, Định dạng hiển thị, Màu thương hiệu, và thiết lập IP Whitelist.
- **Quản lý Phân quyền (RBAC):** Tạo chức danh mới, cấp phát quyền, xóa chức danh (`roles:*`, `permissions:*`).
- **Nghiệp vụ Toàn diện:** Có quyền truy cập toàn bộ các module nghiệp vụ nội bộ (Nhân viên, Chấm công, Ca làm việc, Địa bàn, Kiểm tra đột xuất, Vi phạm, Báo cáo...).

---

### 3. Dành cho HR_MANAGER

Chuyên viên Nhân sự của Công ty:
- **Quản lý Nhân viên:** Tạo mới (thủ công hoặc Import Excel), sửa, vô hiệu hóa nhân viên (`employees:create, read, update, list`).
- **Quản lý Ca làm việc & Phân công:** Xem danh sách ca làm việc (`shifts:read, list`), tạo và cập nhật phân công công việc (`assignments:create, read, update, list`).
- **Chấm công & Kỷ luật:** Đọc lịch sử chấm công, xử lý vi phạm (`violations:create, read, update, list`).
- **Báo cáo:** Truy xuất và Export các báo cáo hệ thống (`reports:read, list, export`).
- 🚫 **Bị cấm:** Không được xóa nhân viên (`employees:delete`), không được chạm vào cấu hình Công ty, không được tạo Role mới.

---

### 4. Dành cho SITE_SUPERVISOR

Giám sát viên hiện trường của Công ty:
- **Quản lý Địa bàn (Sites):** Xem danh sách các địa điểm làm việc (`sites:read, list`).
- **Kiểm tra đột xuất (Spot-checks):** Khởi tạo và xem lịch sử kiểm tra đột xuất tại hiện trường (`randomchecks:*`).
- **Chấm công hiện trường:** Xác nhận Check-in (`checkins:create, read, list`).
- **Ghi nhận Vi phạm:** Được phép báo cáo vi phạm nhưng không được duyệt/sửa vi phạm của người khác (`violations:create, read, list`).
- 🚫 **Bị cấm:** Không được quản lý danh sách nhân sự, không được phân công ca làm việc, không được xem báo cáo tổng thể.

---

### 5. Dành cho EMPLOYEE

Nhân viên hiện trường cơ bản:
- **Thao tác cá nhân:** Tự chấm công (`checkins:create`), xem lịch sử chấm công của mình (`checkins:read`, `attendance:read`).
- **Nhận thông báo:** Đọc và xem danh sách thông báo gửi đến (`notifications:read, list`).
- **Hồ sơ cá nhân:** Đăng nhập, đổi mật khẩu, xem hồ sơ (`auth:*`).
- 🚫 **Bị cấm:** Hoàn toàn không được xem dữ liệu của nhân viên khác hay quản lý hệ thống.

---

## III. NGUYÊN TẮC HOẠT ĐỘNG CỦA LUỒNG BẢO MẬT (SECURITY FLOW)

Để đảm bảo an toàn dữ liệu giữa các công ty, Backend đã thiết lập cơ chế kiểm duyệt 3 lớp cho mỗi Request (Yêu cầu API) gửi từ Frontend lên:

1. **Lớp 1 - Xác thực (Authentication):** Người dùng phải có Token hợp lệ (Đã đăng nhập).
2. **Lớp 2 - Kiểm tra IP (IP Whitelisting):** Nếu Tenant Admin đã bật cấu hình IP Whitelist, Backend sẽ soi địa chỉ IP của Request. Nếu không nằm trong danh sách cho phép -> Chặn (403 Access Denied).
3. **Lớp 3 - Cô lập Dữ liệu (Tenant Isolation):** Backend đọc `tenantId` từ Token của người dùng và tự động gắn vào các câu lệnh truy vấn Database. Do đó, Frontend không bao giờ có thể truy xuất nhầm dữ liệu của công ty A sang công ty B.
