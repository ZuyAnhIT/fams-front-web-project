# Báo cáo hoàn thiện UI chuyển đổi công ty đa tenant

Ngày thực hiện: 31/07/2026  
Phạm vi: Front Web, đối chiếu `multi-tenant-switching-ui-guide.md` của Backend.

## 1. Kết luận

Front Web đã đáp ứng luồng tài khoản thuộc nhiều công ty:

- Sau đăng nhập, Web gọi `GET /api/v1/roles/me`, gom dữ liệu theo `tenantId`; từ hai công ty trở lên sẽ chuyển đến màn **Chọn công ty làm việc**.
- Nhiều role trong cùng một tenant chỉ tạo một lựa chọn công ty. Quyền của các role thuộc tenant hiện hành được hợp nhất, không lấy nhầm quyền tenant khác.
- Menu header gọi lại `/roles/me` mỗi lần mở để cập nhật membership mới nhất.
- `POST /api/v1/auth/switch-tenant` gửi access token qua `Authorization` và refresh token trong body.
- Sau khi chuyển thành công, Web ghi đè cả hai token, tải lại profile/role, xóa toàn bộ React Query cache, xóa notification store và điều hướng về dashboard.
- Lỗi `403` làm mới membership và loại công ty đã mất quyền. Lỗi `401` kết thúc phiên và đưa về đăng nhập. `404` hiển thị thông báo Backend, không thay đổi tenant hiện tại.
- Tab trình duyệt khác tự reload khi token/user trong `localStorage` thay đổi, tránh dùng state `tenantId` cũ với access token mới.

## 2. Liên kết dữ liệu Face ID, nhân viên và chấm công

Web không lưu một `employeeId` dùng chung toàn hệ thống. Các màn quản trị nhân viên/Face ID lấy nhân viên trong ngữ cảnh tenant hiện hành. Khi switch, Web xóa toàn bộ cache và luôn quay về dashboard nên:

1. ID nhân viên hoặc chi tiết Face ID của tenant cũ không được tái sử dụng.
2. Danh sách nhân viên, site, ca, chấm công, báo cáo Face ID và thông báo được gọi lại trong tenant mới khi người dùng mở màn tương ứng.
3. Các API có `tenantId` trên URL tiếp tục dùng `user.tenantId` đã dựng lại từ JWT mới; đây là lớp nhất quán UI, trong khi Backend vẫn tự kiểm tra quyền theo tenant ở từng API.

Web là giao diện HR/Admin nên không triển khai luồng Face ID tự đăng ký của nhân viên. Luồng App phải tiếp tục tuân thủ yêu cầu riêng: lấy lại `employeeId` của tenant mới và gọi lại trạng thái Face ID ngay sau switch.

## 3. Thay đổi kỹ thuật chính

- Tạo transaction chuyển tenant dùng chung cho màn chọn công ty, menu header và self-service tạo công ty.
- Tạo utility group membership theo `tenantId`, giữ danh sách role và hợp nhất permission đúng tenant.
- Bổ sung reset notification store và xóa toàn bộ cache tenant-scoped.
- Bổ sung bảo vệ nhiều tab bằng sự kiện `storage`.
- Không tự refresh/retry riêng lỗi `401` của `switch-tenant`, vì endpoint yêu cầu access/refresh token phải là cùng một cặp; thay vào đó yêu cầu đăng nhập lại.

## 4. Kiểm thử đã thực hiện

File E2E: `tests/e2e/multi-tenant-switching.spec.ts`.

| Kịch bản | Kết quả |
|---|---|
| Login có active tenant nhưng thuộc từ hai tenant trở lên | PASS — hiện màn chọn công ty |
| Hai role trong cùng tenant | PASS — một card công ty, hiện đủ role |
| Switch request | PASS — đúng `Authorization`, `tenantId`, `refreshToken` |
| Lưu session sau switch | PASS — access token, refresh token, tenantId và permission đều thuộc tenant mới |
| Mở menu nhiều lần | PASS — `/roles/me` được gọi lại |
| Membership bị thu hồi khi switch | PASS — xử lý `403`, refetch và loại tenant khỏi UI |
| Token pair không hợp lệ khi switch | PASS — xử lý `401`, xóa phiên và về trang đăng nhập |
| Regression tenant/self-service | PASS |
| TypeScript | PASS |
| Production build Next.js 16.2.9 | PASS — 39/39 trang được tạo thành công |

Lệnh `npm run check` hoàn tất với exit code 0. ESLint toàn repository còn 141 cảnh báo kỹ thuật có sẵn ở các module cũ (không có error); các file mới/sửa của luồng multi-tenant không phát sinh cảnh báo.

Bằng chứng giao diện:

- `docs/test-evidence/multi-tenant-switching/01-select-company-grouped.png`
- `docs/test-evidence/multi-tenant-switching/02-revoked-membership-removed.png`

## 5. Trạng thái Backend

Không phát hiện yêu cầu sửa Backend mới trong phạm vi Web. Contract hiện tại đủ cho danh sách membership, chuyển tenant và phân tách dữ liệu Face ID. Việc Backend kiểm tra tenant tại từng endpoint vẫn là ranh giới bảo mật; các xử lý cache/điều hướng trong Web chỉ bảo đảm dữ liệu hiển thị nhất quán.
