# Báo cáo Web — vòng đời Random Check

Ngày kiểm tra: 01/08/2026  
Nhánh Web: `feature/random-check-lifecycle-ui`

> Ghi chú lịch sử: các đề xuất Backend tại mục 5 là trạng thái khi báo cáo này được lập. Backend sau đó đã xử lý các hạng mục P0/P1; kết quả đồng bộ lần tiếp theo được ghi trong báo cáo số 26.

## 1. Kết luận

Web đã có đúng phần nghiệp vụ dành cho HR/Admin: quản lý policy tenant/site, gửi check thủ công có lý do, tìm kiếm/lọc/phân trang, xem bằng chứng và hủy scheduled check theo quyền/site-scope. Đợt này bổ sung hiển thị toàn bộ `configSnapshot` trong chi tiết audit và cảnh báo chính xác tác động khi cho nhân viên nghỉ việc.

Sinh lịch, snapshot, delayed dispatch, tự hủy và gửi notification là công việc Backend. Web không dựng màn hình Bull/BullMQ vì Backend Java thực tế dùng Redis ZSET và worker polling; chi tiết hàng đợi nội bộ không phải nghiệp vụ HR thông thường.

## 2. Phân bổ 10 tính năng

| Tính năng | Nơi xử lý | Kết quả Web |
|---|---|---|
| Sinh scheduled checks đầu ca | Backend scheduler | Không tạo UI; Web chỉ theo dõi bản ghi đã sinh |
| Snapshot config | Backend + Web audit | Chi tiết hiển thị mode, khung giờ, response window, số lượt/khoảng cách và role từ snapshot |
| Delayed dispatch | Backend Redis ZSET/worker | Không lộ queue nội bộ ra màn HR |
| Hủy scheduled check | Backend + Web HR | Đã có hủy có confirm, phân quyền và site-scope |
| Gửi notification | Backend + App | Web không gửi thay worker; manual check gọi API tạo/gửi theo contract |
| App hiển thị check đang chờ | App | Không thuộc Web |
| Phản hồi GPS | App + Backend | Web chỉ xem bằng chứng |
| GPS + Face ID | App + AI/Backend | Web chỉ xem kết quả/score/ảnh theo quyền |
| GPS + Face ID + liveness | App + AI/Backend | Web hiển thị tách Face ID và liveness |
| Từ chối phản hồi trễ | Backend + App | Web hiển thị `no_response`/đã hết hạn, không cho sửa kết quả |

## 3. Thay đổi đã thực hiện

### 3.1 Snapshot là bằng chứng bất biến

Modal chi tiết đọc JSON snapshot an toàn và hiển thị:

- mode áp dụng cho chính check;
- khung giờ policy;
- thời gian cho phép phản hồi;
- số check mỗi ca và khoảng cách tối thiểu;
- vai trò tại site được áp dụng.

UI không tra cứu config hiện tại để diễn giải check cũ, vì policy có thể đã thay đổi sau khi check được sinh. Parser vẫn fallback mode cho snapshot legacy không phải JSON hoàn chỉnh.

### 3.2 Nghỉ việc không đồng nghĩa kết thúc assignment

Confirm `terminated` nói rõ ba hệ quả:

1. nhân viên bị chặn truy cập/chấm công;
2. check `pending`/`sent` chưa phản hồi tự động bị hủy, lịch sử được giữ;
3. assignment không tự kết thúc, HR phải rà soát/hủy riêng.

Cách này giữ ranh giới dữ liệu: trạng thái nhân viên, phân công và random check có liên kết nhưng không ghi đè lịch sử của nhau.

## 4. Kiểm thử

| Kiểm tra | Kết quả |
|---|---|
| `npm run typecheck` | PASS |
| ESLint các file thay đổi + test | PASS, 0 error; 5 warning cũ trong `EmployeeListPage` |
| `npm run build -- --webpack` | PASS, 39 route |
| Playwright Random Check + Employee | **9/9 PASS** |
| `git diff --check` | PASS |

E2E xác minh snapshot hiển thị đúng `08:00–17:00`, 300 giây, 2 lượt/cách 60 phút và hai role; đồng thời xác minh confirm nghỉ việc nêu đúng cả tự hủy check và assignment không tự kết thúc.

## 5. Giới hạn và đề xuất Backend

### Nên làm trước production

- Endpoint nhân viên không nên trả check `pending` tương lai; ẩn trên App không ngăn việc xem network response.
- FCM nên có data payload `eventType`, `checkId`, `siteId`, `expiresAt` và channel id để deep-link chính xác khi App bị tắt.
- Preference push và in-app cần độc lập; random check khẩn không nên mất push chỉ vì inbox bị tắt.
- Cần chốt retention và job xóa ảnh biometric; dữ liệu hiện không nên lưu vô thời hạn.

### P2 có thể lập kế hoạch

- Sửa giao khung giờ policy cho ca qua đêm.
- Thêm aggregate Face ID enrollment theo site/assignment để Web cảnh báo X/Y người chưa sẵn sàng.
- Tách AI `failed` khỏi `pending` và cung cấp `processedAt`.
- Reconcile trường hợp hiếm: DB đã ghi `sent` nhưng process crash trước khi notification được gửi.

## 6. Tham chiếu thực tế

- QuickBooks Time gắn location evidence với timesheet và cho quản lý kiểm tra chi tiết/flag, phù hợp với nguyên tắc Web chỉ audit chứ không tự thay Backend kết luận công: <https://quickbooks.intuit.com/learn-support/en-us/help-article/time-tracking/track-manage-quickbooks-time-quickbooks-online/L3kYVN7RC_US_en_US>.
- QuickBooks Time geofencing ràng buộc nhắc việc với location/work hours/assignment, tương đồng việc FAMS sinh check từ site, assignment và ca: <https://quickbooks.intuit.com/learn-support/en-us/help-article/feature-preferences/set-use-geofencing-quickbooks-time/L3pZUXKzW_US_en_US>.

## 7. File thay đổi

- `src/features/customer/random-check/components/ScheduledCheckDetailModal.tsx`
- `src/features/customer/employee/components/EmployeeListPage.tsx`
- `tests/e2e/random-check-management.spec.ts`
- `tests/e2e/employee-management.spec.ts`
