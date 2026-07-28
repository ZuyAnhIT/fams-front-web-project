# Báo cáo hoàn thiện UI Ca làm việc & Phân công — 27–28/07/2026

## 1. Phân chia nền tảng

- Company Portal (Web): tạo/sửa/ngừng dùng/xóa ca; cấu hình OT; danh sách, lọc,
  tạo, sửa và hủy phân công. `SITE_SUPERVISOR` chỉ xem theo site-scope.
- Mobile App: nhân viên chọn một trong các site được phép chấm công hôm nay.
  App dùng duy nhất `GET /checkin/available-sites`; không tự ghép Site, Shift và
  Geofence ở client.

Đợt 27/07 đã kiểm tra `fams-front-app-project` dùng đúng endpoint gộp. Contract
28/07 bổ sung `availabilityStatus`/cửa sổ chấm công và các error code mới nên
App cần một đợt tích hợp riêng. Phạm vi yêu cầu hiện tại là Web, vì vậy không sửa
mã nguồn App trong đợt này.

## 2. Luồng dữ liệu chuẩn

```text
Employee ─┐
          ├─ Assignment ─ Site ─ Geofence ─ Check-in
Shift ────┘

Department/Workspace chỉ mô tả cơ cấu tổ chức, không quyết định quyền check-in.
```

`shiftId` và `daysOfWeek` của Assignment có thể để trống. Trống `shiftId` là
không theo ca cố định; trống `daysOfWeek` là áp dụng mọi ngày trong khoảng.

## 3. Các điểm UI đã hoàn thiện

- Form phân công chỉ cho chọn ca active; ca inactive hiện tại vẫn được hiển thị
  khi sửa bản ghi cũ để người dùng hiểu dữ liệu lịch sử.
- Nhân viên `terminated` bị loại khỏi danh sách tạo phân công; `inactive` vẫn
  được chọn và có nhãn cảnh báo.
- Hỗ trợ chọn T2–CN và gửi đúng `daysOfWeek`; cập nhật dùng
  `clearDaysOfWeek`, `clearShift`, `clearEndDate` đúng hợp đồng API.
- Kiểm tra ngày kết thúc không trước ngày bắt đầu.
- Lỗi `409` giữ nguyên message backend (có tên site xung đột) và hướng dẫn người
  dùng kiểm tra lịch hiện hữu.
- Bảng phân công có lọc theo nhân viên/trạng thái/vai trò/ca, sort và phân trang;
  chỉ các cột backend hỗ trợ mới cho sort.
- Bảng ca có lọc active/inactive. Nút xóa giải thích rõ chỉ dùng cho ca chưa
  từng có lịch sử; ca đã dùng phải “Ngừng áp dụng”.
- Nút xóa dùng trực tiếp `canDelete`/`assignmentHistoryCount`; bảng phân công
  ưu tiên `employeeSummary`/`shiftSummary`, nên Supervisor vẫn thấy tên và ca
  mà không cần quyền gọi danh bạ nhân viên.
- Form ca chặn giờ bắt đầu bằng giờ kết thúc và yêu cầu bật “Làm xuyên đêm” khi
  giờ kết thúc thuộc ngày hôm sau. Khi đã bật xuyên đêm, UI chỉ yêu cầu hai giờ
  khác nhau, khớp validation backend mới.
- Nút tạo/sửa/xóa/hủy ẩn theo permission; supervisor vẫn xem được dữ liệu.
- Site `inactive` khóa tạo và sửa phân công ngay trên UI, nhưng vẫn cho xem và
  hủy phân công còn hiệu lực để HR dọn lịch cũ trước khi xóa Site.
- Form Site chỉ cho chọn timezone IANA hợp lệ (`Asia/Ho_Chi_Minh` hoặc `UTC`)
  và vẫn hiển thị nguyên message `400` từ backend nếu dữ liệu cũ/ngoài UI không
  hợp lệ.

| Nhóm quyền | Ca làm việc | Phân công |
|---|---|---|
| Tenant Admin/HR Manager | Tạo, sửa, cấu hình OT, ngừng dùng, xóa ca chưa dùng | Xem, lọc, sort, tạo, sửa, hủy |
| Site Supervisor | Chỉ xem tại site trong scope | Chỉ xem tại site trong scope |
| Không có `read/list` | Không hiện tab | Không hiện tab |

## 4. Các đề xuất backend đã được đồng bộ

### P0 — bảo toàn lịch sử ca: đã hoàn thành ở tầng tính toán

Backend đã snapshot giờ và chính sách ca vào Checkin tại thời điểm check-in.
Frontend dùng `shiftSummary` để hiển thị lịch hiện tại; màn payroll/audit phải
dùng snapshot trên Checkin, không diễn giải lịch sử từ Shift đang sống.

**Khoảng trống API còn lại khi kiểm tra trực tiếp code backend ngày 28/07**:
`CheckinRecord` đã có `shiftStartTime`/`shiftEndTime` và policy snapshot, nhưng
`CheckinDetailResponse` chưa trả các field này; object `shift` trong response
detail vẫn được dựng từ Shift hiện tại. Phép tính payroll đã được bảo vệ, nhưng
Web chưa thể hiển thị “khung giờ tại lúc check-in” làm bằng chứng tranh chấp.
Backend cần trả năm field snapshot trong `CheckinDetailResponse`, hoặc trả object
`shiftSnapshot` tách rõ khỏi `shiftCurrent`. Frontend không dùng Shift hiện tại
làm snapshot giả vì sẽ tạo bằng chứng audit sai.

### P0 — kiểm tra xung đột theo giờ thực: đã hoàn thành

Backend đã so sánh interval theo timezone và ca qua đêm. Frontend không tự chặn
nhiều site cùng ngày: ca sáng Site A và ca tối Site B được phép; chỉ hiển thị
`409` khi backend xác định giờ thực sự chồng nhau. Phân công không có ca được
coi là chiếm cả ngày.

### P0/P1 — bản vá check-in và Site inactive ngày 28/07

- Web không tự dựng logic `serverNow`/timezone/ca qua đêm; đây là dữ liệu dành
  cho màn chấm công nhân viên trên App.
- Các lỗi `EMPLOYEE_NOT_ACTIVE`, `SITE_INACTIVE`, `CHECKIN_TOO_LATE` và
  `DUPLICATE_RESOURCE` thuộc thao tác submit check-in trên App, không có màn
  tương ứng trên Company Portal.
- Tác động trực tiếp lên Web đã được xử lý: khóa tạo/sửa Assignment khi Site
  inactive; vẫn giữ nút hủy để kết thúc phân công cũ.
- Validation Shift trên Web đã đồng bộ với backend P1-1. Validation timezone
  Site đã được phòng ngừa bằng dropdown giá trị IANA hợp lệ và fallback message
  backend.

### P1 — response phục vụ danh sách: đã hoàn thành

- Bảng dùng trực tiếp `employeeSummary` và `shiftSummary`; danh sách Employee
  riêng chỉ còn phục vụ dropdown lọc và form tạo.
- Nút xóa ca dùng `canDelete`; khi không thể xóa, nút disable và tooltip hiển
  thị `assignmentHistoryCount`.
- Endpoint assignment tenant-wide chưa cần cho 9 tính năng hiện tại: màn hình
  đang được tổ chức theo từng Site và dùng đúng site-scope. Chỉ cân nhắc bổ sung
  sau này nếu sản phẩm có trang điều phối toàn công ty trên một bảng/lịch duy
  nhất; đây không phải blocker của đợt bàn giao.

### Lộ trình vận hành tiếp theo

- Lịch tuần/2 tuần theo site và nhân viên, hiển thị coverage và cảnh báo thiếu người.
- Định biên tối thiểu/tối đa theo ca, vị trí hoặc kỹ năng.
- Availability, nghỉ phép và ngày lễ; cảnh báo trước khi phân công.
- Publish/draft lịch và thông báo nhân viên khi lịch được phát hành/thay đổi.
- Chính sách rời geofence: chỉ cảnh báo, yêu cầu duyệt, hoặc auto check-out.

Các mục P2 chỉ nên triển khai sau khi có nhu cầu sản phẩm rõ; không nên nhồi vào
Shift template hoặc Department vì đây là các miền dữ liệu khác nhau.

## 5. Đối chiếu mô hình phổ biến

- Deputy tạo lịch theo location/area, xét quyền làm tại location, availability,
  leave và conflicting shift trước khi đề xuất nhân viên. Điều này ủng hộ việc
  giữ Assignment là lịch theo Site/Shift và bổ sung calendar/coverage ở giai đoạn
  sau, thay vì ghép vào Workspace.
- Deputy tách schedule (thời gian dự kiến làm) khỏi timesheet (thời gian thực tế
  đã làm), phù hợp việc không dùng Shift template làm dữ liệu chấm công thực tế.
- Connecteam gắn geofence với job/site, phù hợp việc giữ Geofence policy tách
  khỏi Shift và Workspace.

Nguồn chính thức:

- [Deputy — Creating shifts on your schedule](https://help.deputy.com/hc/en-au/articles/4688731978639-Creating-shifts-on-your-schedule)
- [Deputy — Schedule overview](https://help.deputy.com/hc/en-au/articles/4688713423759-Schedule-overview)
- [Deputy — Creating locations](https://help.deputy.com/hc/en-au/articles/4657694803087-Creating-your-Locations)
- [Connecteam — Create a geofence](https://help.connecteam.com/en/articles/3597710-how-to-create-a-geofence)

## 6. Kiểm thử

- Web typecheck: pass.
- Web lint: pass, 0 error; còn 150 warning kỹ thuật trên toàn dự án.
- Web production build Next.js 16.2.9/Webpack: pass.
- Web E2E Shift/Assignment: **5/5 pass**.
- Hồi quy chung Site/Geofence + Shift/Assignment: **9/9 pass**.
- App typecheck/lint: pass ở đợt 27/07; chưa triển khai contract App mới trong
  thay đổi Web ngày 28/07.

Các contract đã được xác minh:

1. danh sách ca chỉ gửi `status/page/size`, không gửi sort ngoài API;
2. tạo ca và cấu hình OT gửi đúng field;
3. deactivate gửi `{ "status": "inactive" }`;
4. `canDelete=false` khóa nút và hiện số lượt đã dùng; `canDelete=true` gọi
   DELETE thành công;
5. bảng dùng `employeeSummary`/`shiftSummary`; form không hiện employee
   terminated và ca inactive;
6. tạo phân công gửi đúng `daysOfWeek`, bắt lỗi 409 có tên site;
7. cập nhật xóa field gửi đúng `clearShift`, `clearEndDate`,
   `clearDaysOfWeek`;
8. Supervisor không có thao tác ghi.
9. Site inactive khóa tạo/sửa Assignment nhưng vẫn cho hủy bản ghi active.

Bằng chứng:

- `docs/test-evidence/shift-assignment-management/01-admin-shift-lifecycle.png`
- `docs/test-evidence/shift-assignment-management/02-hr-assignment-conflict.png`
- `docs/test-evidence/shift-assignment-management/03-assignment-clear-fields.png`
- `docs/test-evidence/shift-assignment-management/04-supervisor-read-only.png`
- `docs/test-evidence/shift-assignment-management/05-inactive-site-assignment-guard.png`

E2E dùng mock API để kiểm tra giao diện, permission và request contract. Happy
path tích hợp backend thật cần tenant test có đủ employee/site/shift và dịch vụ
backend đang hoạt động ổn định.
