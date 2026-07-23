# FAMS Frontend Web

FAMS (Field Attendance Management System) là web portal quản lý chấm công thực địa, nhân sự, công trình, ca làm, phân công, tenant và phân quyền. Ứng dụng phục vụ hai khu vực chính:

- Platform Admin: quản lý công ty, gói dịch vụ, vai trò và quyền.
- Customer/Tenant: quản lý nhân viên, phòng ban, công trình, chấm công, Face ID và cấu hình công ty.

> Trạng thái tại ngày 23/07/2026: lint, TypeScript và production build đã chạy thành công. Dashboard không còn hiển thị số liệu giả và các mục placeholder đã được ẩn khỏi điều hướng. Dự án vẫn chưa nên phát hành production cho đến khi hoàn tất kiểm thử tự động, hardening phiên đăng nhập/phân quyền và triển khai các nghiệp vụ còn thiếu ở backend.

## Tài liệu dự án

Khi bắt đầu một chat hoặc phiên phát triển mới, hãy đọc tài liệu bàn giao trạng thái trước:

- [docs/CURRENT_PROJECT_STATUS.md](docs/CURRENT_PROJECT_STATUS.md) — kết luận hiện tại, phần đã sửa, vấn đề còn mở và thứ tự ưu tiên tiếp theo.

Tài liệu đầy đủ về kiến trúc, cấu trúc thư mục, thư viện, luồng API → service → hook → component → page, danh mục tính năng và đánh giá kỹ thuật nằm tại:

- [docs/FAMS_FRONTEND_ARCHITECTURE.md](docs/FAMS_FRONTEND_ARCHITECTURE.md)

`CAUTRUCWEB.md` và `TAILIEU.md` là tài liệu cũ, có nhiều route/module không còn khớp mã nguồn. Khi có khác biệt, dùng tài liệu trong `docs/` làm nguồn chính.

## Công nghệ chính

- Next.js 16.2.9, App Router, React 19.2.4, TypeScript strict.
- Tailwind CSS 4 và Ant Design 6.
- TanStack React Query 5 cho server state; Zustand 5 cho client/global state.
- Axios 1.18 với access-token interceptor và refresh-token queue.
- React Hook Form 7 + Zod 4.
- Leaflet/React Leaflet, Recharts, Firebase Phone Auth và Google OAuth.

## Chạy local

Yêu cầu tối thiểu của Next.js 16 là Node.js 20.9. Repository hiện dùng npm lockfile; môi trường đã kiểm tra là Node.js 24.18.0 và npm 11.16.0.

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Mở `http://localhost:3000`. Route `/` chuyển đến `/login`.

Các biến môi trường client đang được mã nguồn sử dụng:

```dotenv
NEXT_PUBLIC_API_URL=/api/v1
NEXT_PUBLIC_GOOGLE_CLIENT_ID=
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

Trong development, `next.config.ts` rewrite `/api/*` sang `http://localhost:8080/api/*`; vì vậy backend mặc định cần chạy ở cổng `8080`. Mọi biến `NEXT_PUBLIC_*` được đóng vào browser bundle và không được chứa secret.

## Scripts

```bash
npm run dev       # development server
npm run build     # production build + type-check
npm run start     # chạy production server sau khi build thành công
npm run lint      # ESLint
npm run typecheck # kiểm tra TypeScript độc lập
npm run check     # lint + typecheck + production build
```

Repository đã có CI cho lint, typecheck và production build. Hiện vẫn chưa có test script/test suite hoặc cấu hình container hợp lệ (`docker` chỉ là file rỗng).

## Trạng thái kiểm chứng gần nhất

| Kiểm tra | Kết quả |
|---|---|
| `npm ls --depth=0` | Pass, dependency tree hợp lệ |
| `npm run typecheck` | Pass |
| `npm run lint` | Pass với 209 warnings; không còn error |
| `npx next build --webpack` | Pass; 34 route được build thành công (Turbopack không thể bind cổng phụ trong sandbox kiểm tra) |

Xem nguyên nhân, mức ưu tiên và kế hoạch khắc phục trong [tài liệu kiến trúc](docs/FAMS_FRONTEND_ARCHITECTURE.md#12-kế-hoạch-khắc-phục-đề-xuất).
