# 05. Môi trường, cấu hình và thư viện

> Snapshot ngày 23/07/2026. Version “khai báo” lấy từ `package.json`; version “đã cài” lấy từ dependency tree hiện tại. Không đưa nội dung `.env.local` vào tài liệu vì có thể chứa cấu hình riêng của máy.

## 1. Toolchain

| Thành phần | Khai báo/cấu hình | Đang cài trên workspace | Ghi chú |
|---|---:|---:|---|
| Next.js | `16.2.9` cố định | `16.2.9` | App Router; Turbopack mặc định của `next dev` |
| React | `19.2.4` | `19.2.4` | Dùng React `use(params)` ở dynamic page |
| React DOM | `19.2.4` | `19.2.4` | Khớp React |
| TypeScript | `^5` | `5.9.3` | `strict`, `noEmit`, bundler resolution |
| Node.js | Chưa có `engines`/`.nvmrc` | `v24.18.0` trên máy khảo sát | CI dùng Node 20; Next 16 yêu cầu tối thiểu Node 20.9 |
| npm | Lockfile npm | `11.16.0` trên máy khảo sát | Dùng `npm ci` cho cài đặt lặp lại được |
| ESLint | `^9` | `9.39.4` | Flat config; Next core-web-vitals + TypeScript |
| Tailwind CSS | `^4` | `4.3.1` | PostCSS plugin `@tailwindcss/postcss` |

Khuyến nghị cố định Node bằng `.nvmrc` hoặc `.node-version` và khai báo `package.json.engines`. Chọn cùng major với CI để tránh local Node 24 pass nhưng CI Node 20 fail.

## 2. Cài đặt và chạy local

### 2.1 Yêu cầu

- Node.js >= 20.9; nên dùng version đã chốt của team.
- npm và quyền truy cập registry dependency.
- Backend FAMS chạy local ở cổng 8080 nếu dùng rewrite mặc định.
- Firebase/Google project config nếu cần test social/phone auth.

### 2.2 Lệnh khởi động

```bash
npm ci
cp .env.example .env.local
npm run dev -- --webpack
```

Sau đó mở `http://localhost:3000`; `/` redirect sang `/login`.

Tài liệu trạng thái hiện tại khuyên dùng Webpack khi dev vì Turbopack từng hang/panic trong môi trường kiểm tra. Script `npm run dev` chưa cố định `--webpack`, nên mỗi developer cần biết khác biệt này.

### 2.3 Scripts

| Script | Lệnh thật | Mục đích |
|---|---|---|
| `npm run dev` | `next dev` | Dev server, mặc định Turbopack |
| `npm run build` | `next build` | Production build |
| `npm run start` | `next start` | Chạy output sau build |
| `npm run lint` | `eslint` | Static lint |
| `npm run typecheck` | `tsc --noEmit` | Type-check độc lập |
| `npm run test:e2e` | `playwright test` | E2E auth trên Chromium + production build |
| `npm run check` | lint + typecheck + build | Quality gate tổng hợp |

Chưa có unit/component test hoặc Storybook; Playwright hiện chỉ phủ nhóm auth.

## 3. Biến môi trường

`.env.example` hiện khai báo:

```dotenv
NEXT_PUBLIC_API_URL=/api/v1
FAMS_BACKEND_URL=http://localhost:8080/api/v1
NEXT_PUBLIC_GOOGLE_CLIENT_ID=
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

| Biến | Nơi dùng | Bắt buộc khi |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `services/api-client.ts` | Mọi feature gọi backend |
| `FAMS_BACKEND_URL` | `next.config.ts`, Route Handler verify email | Rewrite/BFF server-side; mặc định backend local |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | `app/(auth)/layout.tsx` | Google login |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | `lib/firebase.ts` | Firebase OTP login `/login/phone`; không dùng cho phone registration |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `lib/firebase.ts` | Phone auth |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `lib/firebase.ts` | Phone auth |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | `lib/firebase.ts` | Phone auth |

Tất cả biến có tiền tố `NEXT_PUBLIC_` được đưa vào browser bundle. Không đặt client secret, Firebase Admin credential, private key, database credential hoặc refresh token tĩnh trong các biến này.

`src/config/env.ts` đang rỗng, chưa có runtime validation. Nên bổ sung một module parse/validate biến bằng Zod hoặc logic tương đương để lỗi cấu hình được báo sớm và có thông điệp rõ, nhưng phải bảo đảm chỉ expose biến public thật sự cần cho client.

## 4. Kết nối frontend – backend

`next.config.ts`:

```text
Browser gọi /api/v1/auth/login
        ↓ khớp source /api/v1/:path*
Next.js rewrite
        ↓ FAMS_BACKEND_URL
http://localhost:8080/api/v1/auth/login (mặc định local)
```

Đặc điểm:

- Browser thấy request same-origin, thuận tiện tránh CORS ở local.
- `NEXT_PUBLIC_API_URL=/api/v1` phải khớp prefix backend.
- Rewrite không thay đổi URL hiển thị ở browser.
- Backend production có thể không ở localhost; cấu hình hiện hard-code destination, vì vậy cần chiến lược theo môi trường trước deploy (env-backed destination/reverse proxy/platform routing).

`src/proxy.ts` là logic khác với rewrite:

- Chỉ bắt GET của link email `/api/v1/invitations/accept` và `/api/v1/auth/reset-password`.
- Redirect sang page frontend tương ứng và giữ query string.
- POST cùng path đi tiếp qua rewrite tới backend.

`src/app/api/health/route.ts` là Route Handler frontend thật, trả `{status, timestamp}` và không kiểm tra backend/database.

## 5. TypeScript và module resolution

Các tuỳ chọn đáng chú ý trong `tsconfig.json`:

| Option | Giá trị | Ý nghĩa |
|---|---|---|
| `strict` | `true` | Bật strict family |
| `noEmit` | `true` | TypeScript chỉ kiểm tra, Next thực hiện build |
| `moduleResolution` | `bundler` | Phù hợp Next/bundler hiện đại |
| `isolatedModules` | `true` | Mỗi file phải transpile độc lập |
| `jsx` | `react-jsx` | JSX transform mới |
| `allowJs` | `true` | Cho phép JS nếu có |
| `skipLibCheck` | `true` | Bỏ type-check `.d.ts` dependency |
| `paths` | `@/* → ./src/*` | Import tuyệt đối như `@/services/api-client` |

Mã mới nên dùng `import type` cho type-only import khi phù hợp và tránh path tương đối xuyên nhiều tầng.

## 6. ESLint, CSS và CI

### ESLint

- `eslint-config-next/core-web-vitals`.
- `eslint-config-next/typescript`.
- `@typescript-eslint/no-explicit-any` bị hạ thành warning để code legacy không chặn build.
- `.next`, `out`, `build`, `next-env.d.ts` được ignore.

Warning không có nghĩa là an toàn. Quy tắc cho code mới nên là không tạo thêm `any`/warning.

### Styling

- `postcss.config.mjs` chỉ bật `@tailwindcss/postcss` cho Tailwind 4.
- Global theme/CSS ở `src/app/globals.css`.
- Ant Design theme runtime ở `TenantThemeProvider`.
- Utility class merge qua `cn()` (`clsx` + `tailwind-merge`).

### CI

`.github/workflows/ci.yml` chạy trên push `main`, `develop` và pull request:

```text
checkout
→ setup Node 20 + npm cache
→ npm ci
→ npm run lint
→ npm run typecheck
→ npm run build
```

CI hiện chưa gọi `npm run test:e2e`; E2E auth mới chạy local/on-demand và cần được thêm vào workflow khi môi trường CI có backend test.

## 7. Thư viện runtime theo trách nhiệm

### 7.1 Framework và UI

| Package | Version cài | Dùng để làm gì | Nơi dùng tiêu biểu |
|---|---:|---|---|
| `next` | 16.2.9 | App Router, page/layout, route handler, proxy, build | `src/app`, `src/proxy.ts` |
| `react`, `react-dom` | 19.2.4 | Component/hook/render | Toàn UI |
| `antd` | 6.4.4 | Table, Form control, Modal, Tabs, App/message, theme | Shared UI và feature components |
| `@ant-design/icons` | 6.2.5 | Icon tương thích AntD | Nhiều form/page |
| `lucide-react` | 1.18.0 | Icon SVG React | Menu, button, dashboard |

Ant Design và Tailwind đang dùng đồng thời: AntD cho component có hành vi phức tạp; Tailwind cho layout/spacing/responsive và override. Cần hạn chế override quá sâu vào class nội bộ của AntD vì có thể vỡ khi nâng version.

### 7.2 Data fetching và state

| Package | Version | Vai trò | Quy tắc |
|---|---:|---|---|
| `@tanstack/react-query` | 5.101.0 | Server-state cache, query, mutation, invalidation | Query key phải có tenantId/scope/filter |
| `zustand` | 5.0.14 | Client/global state nhẹ | Chỉ dùng cho state cross-app, không nhân bản server cache |
| `axios` | 1.18.0 | HTTP client/interceptor/blob/multipart | Chỉ dùng qua `apiClient`/service; component không gọi trực tiếp |

### 7.3 Form và validation

| Package | Version | Vai trò |
|---|---:|---|
| `react-hook-form` | 7.79.0 | Form state, validation lifecycle |
| `@hookform/resolvers` | 5.4.0 | Adapter Zod resolver |
| `zod` | 4.4.3 | Runtime schema + type inference |

Pattern: `schema → z.infer<FormData> → useForm({ resolver: zodResolver(schema) }) → payload typed`.

### 7.4 Auth và identity

| Package | Version | Vai trò |
|---|---:|---|
| `@react-oauth/google` | 0.13.5 | Nhận Google ID credential ở client |
| `firebase` | 12.16.0 | Gửi/xác minh SMS OTP phía client |
| `jwt-decode` | 4.0.0 | Đọc claims để dựng `AuthUser` |

Decode JWT không phải verify chữ ký. Frontend chỉ dùng claims cho UI; backend mới là nơi xác thực token.

### 7.5 Map và data visualization

| Package | Version | Vai trò | Hiện trạng |
|---|---:|---|---|
| `leaflet` | 1.9.4 | Map engine | Dùng cho location/geofence |
| `react-leaflet` | 5.0.0 | React bindings | Dùng ở map editor/view |
| `recharts` | 3.8.1 | Chart | Đã cài nhưng dashboard chart feature chưa triển khai thực chất |

Leaflet phụ thuộc DOM, nên component map phải là client-only/dynamic phù hợp.

### 7.6 Date và utility CSS

| Package | Version | Vai trò |
|---|---:|---|
| `date-fns` | 4.4.0 | Format/parse date ở auth, employee, role... |
| `clsx` | 2.1.1 | Ghép class có điều kiện |
| `tailwind-merge` | 3.6.0 | Resolve class Tailwind xung đột |

Code cũng import trực tiếp `dayjs` ở attendance/check-in và nhiều form. `dayjs@1.11.21` hiện tồn tại **chỉ là transitive dependency của Ant Design**, không có trong `package.json`. Đây là lỗi quản lý dependency: package được import trực tiếp phải được khai báo trực tiếp, nếu không một thay đổi dependency tree có thể làm build fail.

## 8. Dev dependencies

| Package | Version cài | Vai trò |
|---|---:|---|
| `typescript` | 5.9.3 | Type checker |
| `eslint` | 9.39.4 | Linter |
| `eslint-config-next` | 16.2.9 | Rule Next/React/TS |
| `tailwindcss` | 4.3.1 | CSS utilities |
| `@tailwindcss/postcss` | 4.3.1 | Tailwind PostCSS integration |
| `@types/node` | 20.19.43 | Node types |
| `@types/react` | 19.2.17 | React types |
| `@types/react-dom` | 19.2.3 | React DOM types |
| `@types/leaflet` | 1.9.21 | Leaflet types |
| `@playwright/test` | 1.61.1 | Chromium E2E cho các luồng auth |

## 9. Browser storage và security

LocalStorage keys đang dùng:

| Key | Nội dung |
|---|---|
| `fams_access_token` | Access token |
| `fams_refresh_token` | Refresh token |
| `fams_user` | AuthUser đã map, gồm role/permissions/tenant |
| `fams_device_id` | Device ID ổn định gửi trong login/register/Google |
| `sidebar-collapsed` | UI preference |

Hệ quả:

- Dữ liệu tồn tại qua refresh/browser restart.
- JavaScript cùng origin có thể đọc token; XSS là rủi ro nghiêm trọng.
- User/permissions trong localStorage có thể cũ hoặc bị sửa; backend không được tin dữ liệu này.
- Không log token hoặc đưa storage dump vào bug report.

## 10. Thành phần đã cài nhưng chưa hoàn thiện/không dùng đúng kỳ vọng

| Thành phần | Hiện trạng |
|---|---|
| Recharts | Package có, feature dashboard chart rỗng |
| WebSocket | `websocket.service.ts` rỗng; notification dùng polling 30 giây |
| Query client riêng | `lib/query-client.ts` rỗng; QueryClient được tạo trong `QueryProvider` |
| Axios lib | `lib/axios.ts` rỗng; client thật ở `services/api-client.ts` |
| Shared schemas/types | Nhiều file rỗng, không tham gia runtime |
| Docker | `docker` là file rỗng, không có Dockerfile/compose hợp lệ |
| Tests | Có Playwright E2E auth; chưa có unit/component và chưa nối CI |

## 11. Cấu hình nên bổ sung trước production

Ưu tiên:

1. Cố định Node version và đồng bộ local/CI.
2. Khai báo trực tiếp `dayjs` hoặc loại bỏ direct imports để chỉ dùng `date-fns`.
3. Cấu hình `FAMS_BACKEND_URL` đúng theo môi trường triển khai.
4. Validate env khi startup/build và thông báo feature nào thiếu config.
5. Bổ sung unit/component, mở rộng E2E ngoài auth và thêm CI job tương ứng.
6. Hoàn thiện Docker/deployment artifact nếu nền tảng triển khai yêu cầu.
7. Review CSP/XSS và chuyển refresh token sang HttpOnly cookie nếu backend hỗ trợ.
8. Bổ sung observability: error tracking, correlation ID, web vitals/log policy.
9. Xác minh Node/Next security updates định kỳ trước mỗi release.

## 12. Checklist xử lý lỗi môi trường

| Triệu chứng | Kiểm tra |
|---|---|
| API 404 từ frontend | `NEXT_PUBLIC_API_URL`, rewrite path, backend prefix |
| API 502/ECONNREFUSED | Backend có chạy ở `localhost:8080` không |
| Google button lỗi | Client ID + allowed origin + provider config |
| Phone auth lỗi khi bấm gửi OTP | Bốn Firebase env vars, Firebase Auth/phone provider, domain/reCAPTCHA |
| Map lỗi/hydration | Component có client boundary/dynamic import và CSS Leaflet không |
| Build local pass, CI fail | Node major, lockfile, import transitive package như `dayjs` |
| 401 lặp | Refresh endpoint/response shape/token storage/network |
| Màu theme sai | tenantId, tenant settings query, `brandPrimaryColor` |
| Dữ liệu tenant cũ | Query key có tenantId chưa; store/session đã switch chưa |
| Dev hang/panic | Thử `npm run dev -- --webpack`, sau đó tách lỗi Turbopack khỏi lỗi app |
