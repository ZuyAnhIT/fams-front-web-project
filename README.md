# FAMS Frontend Web

FAMS (Field Attendance Management System) là web portal quản lý chấm công thực địa, nhân sự, công trình, ca làm, phân công, tenant và phân quyền. Ứng dụng phục vụ hai khu vực chính:

- Platform Admin: quản lý công ty, gói dịch vụ, vai trò và quyền.
- Customer/Tenant: quản lý nhân viên, phòng ban, công trình, chấm công, Face ID và cấu hình công ty.

> Trạng thái tại ngày 19/08/2026: dự án có CI, kiểm tra dependency production, TypeScript, lint, production build và 93 kịch bản Playwright. Lần kiểm chứng gần nhất đạt 90/90 kịch bản độc lập với dịch vụ thật; ba kịch bản live-integration được skip theo cấu hình. Các tích hợp email/SMS/Google/FCM/Face ID vẫn phải được UAT trên staging hoặc thiết bị thật trước khi phát hành production.

## Tài liệu dự án

Khi bắt đầu một chat hoặc phiên phát triển mới, hãy đọc tài liệu bàn giao trạng thái trước:

- [docs/CURRENT_PROJECT_STATUS.md](docs/CURRENT_PROJECT_STATUS.md) — kết luận hiện tại, phần đã sửa, vấn đề còn mở và thứ tự ưu tiên tiếp theo.

Tài liệu đầy đủ về kiến trúc, cấu trúc thư mục, thư viện, luồng API → service → hook → component → page, danh mục tính năng và đánh giá kỹ thuật nằm tại:

- [docs/FAMS_FRONTEND_ARCHITECTURE.md](docs/FAMS_FRONTEND_ARCHITECTURE.md)

`CAUTRUCWEB.md` và `TAILIEU.md` là tài liệu cũ, có nhiều route/module không còn khớp mã nguồn. Khi có khác biệt, dùng tài liệu trong `docs/` làm nguồn chính.

## Công nghệ chính

- Next.js 16.3.0, App Router, React 19.2.4, TypeScript strict.
- Tailwind CSS 4 và Ant Design 6.
- TanStack React Query 5 cho server state; Zustand 5 cho client/global state.
- Axios 1.18 với access-token interceptor và refresh-token queue.
- React Hook Form 7 + Zod 4.
- Leaflet/React Leaflet, Recharts, Firebase Phone Auth và Google OAuth.

## Chạy local

Repository khóa Node.js 20 qua `.nvmrc` và `package.json.engines` để đồng nhất với CI. Yêu cầu tối thiểu là Node.js 20.9 và npm 10.

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Mở `http://localhost:3000`. Route `/` chuyển đến `/login`.

Các biến môi trường client đang được mã nguồn sử dụng:

```dotenv
NEXT_PUBLIC_API_URL=/api/v1
FAMS_BACKEND_URL=http://localhost:8080/api/v1
FAMS_DEV_ORIGINS=localhost,127.0.0.1
NEXT_PUBLIC_GOOGLE_CLIENT_ID=
NEXT_PUBLIC_MOBILE_APP_SCHEME=famsfrontappproject
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_MAP_TILE_URL=https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png
FAMS_GEOCODING_URL=https://nominatim.openstreetmap.org
FAMS_GEOCODING_USER_AGENT=FAMS-Web/0.1 (ops@example.com)
```

Trong development, `next.config.ts` rewrite `/api/v1/*` sang `FAMS_BACKEND_URL`; mặc định backend chạy tại `http://localhost:8080/api/v1`. Khi truy cập Web qua IP LAN, thêm hostname/IP mới vào `FAMS_DEV_ORIGINS` rồi khởi động lại `npm run dev`. Mọi biến `NEXT_PUBLIC_*` được đóng vào browser bundle và không được chứa secret.

Google OAuth và Firebase phải khai báo origin/domain của môi trường tương ứng trong Google Cloud/Firebase Console. Firebase phone auth chỉ được bật khi đủ cả bốn biến Firebase; thiếu một biến sẽ trả lỗi cấu hình thân thiện thay vì làm hỏng toàn bộ trang đăng nhập.

Tìm kiếm địa điểm đi qua Route Handler `/api/maps/geocode`, không gọi thẳng nhà cung cấp từ trình duyệt. Khi production, nên thay tile/geocoding endpoint bằng nhà cung cấp có quota/SLA và đặt `FAMS_GEOCODING_USER_AGENT` nhận diện hệ thống cùng email vận hành hợp lệ.

## Scripts

```bash
npm run dev       # development server
npm run build     # production build + type-check
npm run start     # chạy production server sau khi build thành công
npm run lint      # ESLint
npm run typecheck # kiểm tra TypeScript độc lập
npm run audit     # chặn lỗ hổng production mức high trở lên
npm run test:e2e  # chạy regression trình duyệt
npm run check     # audit + lint + typecheck + production build
```

Mặc định Playwright bỏ qua ba kịch bản cần dịch vụ thật (đăng ký OTP, xác thực email và Face ID live) để CI không phụ thuộc Docker Backend. Khi stack Backend/Postgres/Redis đã chạy, dùng `LIVE_BACKEND=true npm run test:e2e` để chạy cả ba kịch bản này.

Repository có CI cho audit dependency, lint, typecheck, production build và Playwright trên Chromium.

## Trạng thái kiểm chứng gần nhất

| Kiểm tra | Kết quả |
|---|---|
| `npm ls --depth=0` | Pass, dependency tree hợp lệ |
| `npm run typecheck` | Pass |
| `npm run lint` | Pass, không có error; warning kỹ thuật được theo dõi riêng |
| `npm run audit` | Pass; không có lỗ hổng production được phát hiện |
| `npm run build -- --webpack` | Pass; 49 route được build thành công ở lần kiểm chứng gần nhất |
| `npm run test:e2e -- --workers=1` | 93 kịch bản; 90 pass, 3 live-integration skip, 0 fail |

Xem nguyên nhân, mức ưu tiên và kế hoạch khắc phục trong [tài liệu kiến trúc](docs/FAMS_FRONTEND_ARCHITECTURE.md#12-kế-hoạch-khắc-phục-đề-xuất).
