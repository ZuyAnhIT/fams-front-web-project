# #16 — Bản đồ app không hiện & #17 — Kết quả tìm kiếm toàn hệ thống không nhảy trang

Ngày: 2026-09-03 · Repos: `fams-front-app-project`, `fams-front-web-project`

## #17 — Bấm kết quả tìm kiếm toàn hệ thống không có gì xảy ra

`GlobalSearch` dùng antd `Popover` với `trigger="focus"`. Khi bấm vào một kết quả:
`mousedown` → ô input **mất focus** → Popover đóng và **gỡ nút kết quả khỏi DOM** trước khi
`click` kịp bắn → `onClick` không bao giờ chạy.

**Đã sửa** [GlobalSearch.tsx](../../../src/features/customer/report/components/GlobalSearch.tsx):
thêm `onMouseDown={e => e.preventDefault()}` trên nút kết quả → giữ focus cho input → `click`
thật sự đến được `onClick` (vẫn chạy tốt với phím Enter/Space). Route sau đó mới đóng dropdown.

Đã verify: gõ "Chung " → bấm "Chung Cư Light Mon" → điều hướng tới `/customer/sites/{id}`
(ảnh `results.png`, `after-click.png`).

### Về việc "tìm kiếm/lọc không truyền id"
Đã rà soát — hầu hết bộ lọc/tìm kiếm đã **tìm theo tên / mã / vai trò / email**, không đòi
UUID:
- Tìm kiếm toàn hệ thống: backend `SearchService` khớp theo tên/mã NV/email/tên site.
- Bộ lọc trang danh sách (ListHeader): đều là select theo tên hoặc ô tìm theo tên.
- Nhật ký audit: lọc "Người thao tác" là ô search theo tên/email; "Loại đối tượng" và
  "Hành động" là dropdown nhãn tiếng Việt (sửa ở đợt trước).
- Còn 2 ô nhập ID thô, đều là **tuỳ chọn nâng cao / fallback**, không bắt buộc:
  `AuditLogViewerPage` "ID đối tượng (nếu biết)" (dùng để trace), và `GoLiveReadinessPanel`
  "Nhập UUID tenant" (chỉ hiện khi tài khoản không đọc được tenant directory).

## #16 — App mobile không hiện bản đồ ở Chấm Công

Ảnh người dùng: ô xám trống + logo "Google" = `react-native-maps` render nhưng không tải
được tile. Nguyên nhân: **Expo Go (SDK 53+) đã bỏ `react-native-maps`**, và build thật cần
key Google Maps hợp lệ/không bị chặn theo SHA-1.

**Đã sửa** — bỏ hẳn `react-native-maps`, chuyển sang **bản đồ OpenStreetMap (Leaflet) trong
WebView** — không cần API key, chạy giống nhau trên Expo Go / dev client / production, và
thống nhất với bản web:
- [CheckinLocationMap.tsx](../../../../fams-front-app-project/src/features/checkin/components/CheckinLocationMap.tsx)
  (native): WebView + Leaflet — marker công trình, polygon/vòng tròn geofence, vị trí hiện
  tại + vòng độ chính xác khi bấm nút định vị. Nút định vị + cảnh báo GPS yếu giữ nguyên.
- [SiteLocationMap.tsx](../../../../fams-front-app-project/src/features/site/components/SiteLocationMap.tsx)
  (native, màn chi tiết công trình): tương tự, bản đồ tĩnh.
- `*.web.tsx` của cả hai: nhúng `<iframe>` OpenStreetMap embed (đợt trước + bổ sung
  SiteLocationMap.web).
- `SiteDetail.tsx` bỏ nhánh `Platform.OS !== 'web'` — giờ luôn render bản đồ.
- `npx expo install react-native-webview` (đã có sẵn trong bundle Expo Go SDK 54);
  `npm uninstall react-native-maps`.

> Không tự chạy được emulator/Expo Web ở đây — cần QA xác nhận trực quan trên thiết bị.
> Sau khi merge: dev client cần **rebuild** (thêm/bớt module native); Expo Go chạy ngay.

## Test
- Web: `tests/e2e/global-search-navigation.spec.ts` — pass (#17).
- App: `tsc` + `eslint` (checkin/ + site/) sạch. `react-native-maps` đã gỡ khỏi
  `package.json` + lock.
