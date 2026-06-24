# 📘 FAMS Frontend Web — Tài Liệu Kiến Trúc & Cấu Trúc Dự Án

> **FAMS** — Field Attendance Management System  
> Web Portal dành cho Admin, HR, Manager và Supervisor.  
> Tài liệu này tổng hợp kiến trúc, cấu trúc thư mục thực tế và nguyên tắc phát triển.

---

## 1. Tổng Quan Dự Án

| Hạng mục | Chi tiết |
|---|---|
| **Mục tiêu** | Xây dựng Web Portal quản lý chấm công thực địa |
| **Đối tượng sử dụng** | Admin, HR, Manager, Supervisor |
| **Kiến trúc** | Feature-Based Architecture + Clean Architecture |
| **Framework** | Next.js 16 (App Router) |
| **Ngôn ngữ** | TypeScript strict mode |
| **Styling** | Tailwind CSS v4 |
| **State Management** | Zustand (client) + TanStack React Query (server) |
| **Form** | React Hook Form + Zod validation |
| **UI Library** | Ant Design 6 + Lucide React Icons |
| **HTTP Client** | Axios |
| **Bản đồ** | Leaflet + React Leaflet |
| **Biểu đồ** | Recharts |
| **Path alias** | `@/*` → `./src/*` |

---

## 2. Cấu Trúc Repository Thực Tế

```text
fams-front-web-project/
├── public/                             # Tài nguyên tĩnh
│   ├── BGR_LOGIN.png                   # Ảnh nền đăng nhập (chính)
│   ├── BGR_LOGIN_REGISTER.jpg          # Ảnh nền đăng ký
│   ├── BGR_LOGIN_REGISTER1.jpg         # Ảnh nền đăng ký (backup)
│   ├── bg-login.png                    # Ảnh nền login phụ
│   ├── file.svg                        # Icon file
│   ├── globe.svg                       # Icon globe
│   ├── next.svg                        # Next.js logo
│   ├── vercel.svg                      # Vercel logo
│   └── window.svg                      # Icon window
│
├── src/                                # *** MÃ NGUỒN CHÍNH ***
│   ├── app/                            # [App Router] Routing & Layouts
│   ├── features/                       # [Core] Module nghiệp vụ theo Feature
│   ├── components/                     # [Shared] UI Components dùng chung
│   ├── layouts/                        # [Layout] Bố cục giao diện chính
│   ├── services/                       # [Infra] Dịch vụ API toàn cục
│   ├── lib/                            # [Infra] Cấu hình thư viện bên thứ 3
│   ├── hooks/                          # [Shared] Custom Hooks dùng chung
│   ├── stores/                         # [State] Zustand global stores
│   ├── types/                          # [Type] TypeScript interfaces/types
│   ├── constants/                      # [Config] Hằng số hệ thống
│   ├── config/                         # [Config] Cấu hình ứng dụng
│   ├── utils/                          # [Util] Hàm tiện ích
│   └── schemas/                        # [Validate] Zod schemas dùng chung
│
├── .gitignore
├── eslint.config.mjs                   # Cấu hình ESLint
├── next.config.ts                      # Cấu hình Next.js
├── package.json                        # Dependencies & scripts
├── postcss.config.mjs                  # PostCSS cho Tailwind
├── tsconfig.json                       # Cấu hình TypeScript
├── TAILIEU.md                          # Tài liệu cấu trúc thư mục
├── CAUTRUCWEB.md                       # Tài liệu kiến trúc (file này)
└── README.md                           # Hướng dẫn sử dụng
```

---

## 3. Chi Tiết `src/app/` — App Router

Thư mục `app/` chỉ chứa **routing, layouts và entry pages**. Mọi logic nghiệp vụ được ủy quyền cho `features/`.

```text
src/app/
├── globals.css                         # Tailwind CSS v4 + styles toàn cục
├── layout.tsx                          # Root Layout (HTML, fonts, providers)
├── page.tsx                            # Trang chủ "/" → redirect("/login")
│
├── api/
│   └── health/
│       └── route.ts                    # GET /api/health — Health Check
│
├── (auth)/                             # ═══ NHÓM ROUTE XÁC THỰC ═══
│   ├── layout.tsx                      # AuthLayout (giao diện tối giản)
│   ├── login/
│   │   └── page.tsx                    # /login
│   ├── register/
│   │   └── page.tsx                    # /register
│   ├── forgot-password/
│   │   └── page.tsx                    # /forgot-password
│   └── reset-password/
│       └── page.tsx                    # /reset-password
│
└── (dashboard)/                        # ═══ NHÓM ROUTE QUẢN TRỊ ═══
    ├── layout.tsx                      # DashboardLayout (Sidebar + Header)
    ├── dashboard/
    │   └── page.tsx                    # /dashboard — Tổng quan
    ├── employees/
    │   ├── page.tsx                    # /employees — Danh sách nhân viên
    │   ├── create/
    │   │   └── page.tsx               # /employees/create — Thêm mới
    │   └── [id]/
    │       └── page.tsx               # /employees/:id — Chi tiết/Sửa
    ├── sites/
    │   ├── page.tsx                    # /sites — Danh sách điểm làm việc
    │   ├── create/
    │   │   └── page.tsx               # /sites/create — Thêm mới
    │   └── [id]/
    │       └── page.tsx               # /sites/:id — Chi tiết/Sửa
    ├── shifts/
    │   └── page.tsx                    # /shifts — Quản lý ca làm
    ├── assignments/
    │   └── page.tsx                    # /assignments — Phân công
    ├── attendance/
    │   └── page.tsx                    # /attendance — Chấm công
    ├── random-checks/
    │   └── page.tsx                    # /random-checks — Kiểm tra đột xuất
    ├── violations/
    │   └── page.tsx                    # /violations — Vi phạm
    ├── reports/
    │   └── page.tsx                    # /reports — Báo cáo
    └── settings/
        └── page.tsx                    # /settings — Cài đặt
```

> **Nguyên tắc**: Mỗi `page.tsx` chỉ đóng vai trò **entry point**, gọi component từ `features/`.

---

## 4. Chi Tiết `src/features/` — Module Nghiệp Vụ

Đây là **trung tâm kiến trúc**. Mỗi domain nghiệp vụ là một feature **khép kín**, có thể phát triển và test độc lập.

### 4.1 Danh Sách Features

| Feature | Mô tả |
|---|---|
| `auth` | Đăng nhập, đăng ký, quên/đổi mật khẩu |
| `dashboard` | Tổng quan thống kê, biểu đồ |
| `employee` | CRUD nhân viên |
| `tenant` | Quản lý công ty/chi nhánh (Multi-tenancy) |
| `site` | Quản lý điểm làm việc, geofence |
| `shift` | Quản lý ca làm việc |
| `assignment` | Phân công nhân viên vào ca/site |
| `attendance` | Chấm công, check-in/check-out |
| `random-check` | Kiểm tra đột xuất ngẫu nhiên |
| `violation` | Quản lý vi phạm (đi muộn, sai vị trí…) |
| `notification` | Thông báo real-time |
| `report` | Báo cáo, xuất dữ liệu |
| `role-permission` | Phân quyền vai trò |
| `setting` | Cài đặt hệ thống/cá nhân |

### 4.2 Cấu Trúc Chuẩn Mỗi Feature

```text
src/features/<feature-name>/
├── components/
│   └── <feature>.component.tsx         # Component giao diện chính
├── hooks/
│   └── use-<feature>.ts                # React Query hooks (CRUD)
├── services/
│   └── <feature>.service.ts            # Gọi API backend
├── store/
│   └── <feature>.store.ts              # Zustand store nội bộ (nếu cần)
├── types/
│   └── <feature>.type.ts               # TypeScript interfaces
├── schemas/
│   └── <feature>.schema.ts             # Zod validation
└── utils/
    └── <feature>.mapper.ts             # Data mapping/transform
```

### 4.3 Ví Dụ: Feature `auth`

```text
src/features/auth/
├── components/
│   ├── LoginForm.tsx                   # Form đăng nhập (RHF + Zod)
│   ├── RegisterForm.tsx                # Form đăng ký
│   ├── auth.component.tsx              # Component wrapper
│   └── index.ts                        # Barrel export
├── hooks/
│   └── use-auth.ts                     # useLogin, useRegister, useLogout
├── services/
│   └── auth.service.ts                 # login(), register(), refreshToken()
├── store/
│   └── auth.store.ts                   # Auth state nội bộ feature
├── types/
│   └── auth.type.ts                    # LoginDTO, RegisterDTO, AuthResponse
├── schemas/
│   └── auth.schema.ts                  # loginSchema, registerSchema
└── utils/
    └── auth.mapper.ts                  # Map API response → UI model
```

---

## 5. Chi Tiết `src/components/` — Shared UI

Components **tái sử dụng** trên toàn bộ dự án, không chứa logic nghiệp vụ.

```text
src/components/
├── ui/                                 # ═══ ATOMIC COMPONENTS ═══
│   ├── BaseButton.tsx                  # Button cơ bản (variants, sizes)
│   ├── BaseCheckbox.tsx                # Checkbox component
│   ├── BaseInput.tsx                   # Input text component
│   ├── BaseInputPassword.tsx           # Input password (show/hide)
│   └── index.ts                        # Barrel export
│
├── icons/                              # ═══ CUSTOM SVG ICONS ═══
│   ├── GoogleIcon.tsx                  # Icon Google (Social Login)
│   ├── MicrosoftIcon.tsx               # Icon Microsoft (Social Login)
│   └── index.ts                        # Barrel export
│
├── shared/                             # ═══ COMPLEX SHARED ═══
│   └── PageHeader.tsx                  # Header chung cho các trang
│
├── forms/                              # ═══ FORM COMPONENTS ═══
│   └── FormInput.tsx                   # Form input tích hợp RHF
│
├── tables/                             # ═══ DATA TABLE ═══
│   └── DataTable.tsx                   # Table dùng chung (sort, filter, paginate)
│
├── charts/                             # ═══ BIỂU ĐỒ ═══
│   └── StatCard.tsx                    # Card thống kê dashboard
│
├── maps/                               # ═══ BẢN ĐỒ ═══
│   └── GeofenceMap.tsx                 # Leaflet map + geofence
│
└── feedback/                           # ═══ PHẢN HỒI UI ═══
    └── EmptyState.tsx                  # Trạng thái rỗng (no data)
```

---

## 6. Chi Tiết `src/layouts/` — Bố Cục Giao Diện

```text
src/layouts/
├── AuthLayout.tsx                      # Layout xác thực (tối giản, full-screen)
├── DashboardLayout.tsx                 # Layout quản trị (Sidebar + Header + Content)
├── Sidebar.tsx                         # Thanh điều hướng trái
├── Header.tsx                          # Thanh công cụ trên (user info, notifications, logout)
└── MobileNav.tsx                       # Menu responsive cho mobile
```

---

## 7. Các Thư Mục Hỗ Trợ

### 7.1 `src/services/` — Dịch Vụ API Toàn Cục

```text
src/services/
├── api-client.ts                       # Axios instance xuất bản từ lib/axios
├── auth-token.service.ts               # Quản lý Access/Refresh Token (Cookie/localStorage)
├── upload.service.ts                   # Upload file (ảnh, tài liệu)
└── websocket.service.ts                # WebSocket real-time (thông báo, vị trí)
```

### 7.2 `src/lib/` — Cấu Hình Thư Viện

```text
src/lib/
├── axios.ts                            # Axios: Base URL, Interceptors, Token attach
├── query-client.ts                     # TanStack Query: defaults, cache, refetch
├── auth.ts                             # Tiện ích token/cookie/session
├── date.ts                             # Múi giờ, định dạng thời gian
└── permissions.ts                      # Tiện ích kiểm tra quyền hạn
```

### 7.3 `src/stores/` — Zustand Global State

```text
src/stores/
├── auth.store.ts                       # Trạng thái đăng nhập, user hiện tại
├── app.store.ts                        # UI state (sidebar toggle, theme)
└── notification.store.ts               # Danh sách thông báo, toasts
```

### 7.4 `src/hooks/` — Custom Hooks Dùng Chung

```text
src/hooks/
├── useCurrentUser.ts                   # Lấy thông tin user đang đăng nhập
├── usePermission.ts                    # Kiểm tra quyền thực hiện hành động
├── usePagination.ts                    # State phân trang (page, pageSize)
└── useDebounce.ts                      # Debounce giá trị (search input)
```

### 7.5 `src/types/` — TypeScript Declarations

```text
src/types/
├── api.ts                              # ApiResponse<T>, PaginationMeta
├── auth.ts                             # Session, JWT token types
├── user.ts                             # User, Employee interfaces
├── tenant.ts                           # Multi-tenancy data structures
└── common.ts                           # Shared utility types
```

### 7.6 `src/constants/` — Hằng Số

```text
src/constants/
├── app.ts                              # DATE_FORMAT, PAGE_SIZE, APP_NAME
├── routes.ts                           # ROUTES.LOGIN, ROUTES.DASHBOARD...
├── roles.ts                            # ADMIN, MANAGER, EMPLOYEE...
├── permissions.ts                      # Danh sách quyền hạn chi tiết
└── colors.ts                           # Bảng màu hệ thống (color scale)
```

### 7.7 `src/config/` — Cấu Hình Ứng Dụng

```text
src/config/
├── env.ts                              # Biến môi trường (NEXT_PUBLIC_API_URL)
└── menu.ts                             # Sidebar menu (routes, icons, permissions)
```

### 7.8 `src/schemas/` — Zod Schemas Dùng Chung

```text
src/schemas/
├── auth.schema.ts                      # Validation: Login, Forgot Password
├── employee.schema.ts                  # Validation: Thêm/Sửa nhân viên
└── site.schema.ts                      # Validation: Tạo điểm làm việc
```

### 7.9 `src/utils/` — Hàm Tiện Ích

```text
src/utils/
├── cn.ts                               # clsx + tailwind-merge (class merging)
├── format-date.ts                      # Định dạng ngày (18/06/2026)
├── format-number.ts                    # Định dạng số, tiền tệ, phần trăm
└── file.ts                             # Upload, chuyển đổi, kiểm tra file
```

---

## 8. Kiến Trúc State Management

```
┌──────────────────────────────────────────────────────┐
│                    COMPONENT LAYER                    │
├──────────────────────────────────────────────────────┤
│                                                      │
│  ┌─────────────────┐    ┌──────────────────────┐     │
│  │   TanStack Query │    │      Zustand          │    │
│  │   (Server State) │    │   (Client State)      │    │
│  │                  │    │                       │    │
│  │  • API data      │    │  • auth.store.ts      │    │
│  │  • Cache & Refetch│   │  • app.store.ts       │    │
│  │  • Pagination    │    │  • notification.store  │    │
│  │  • Mutations     │    │                       │    │
│  └────────┬─────────┘    └───────────────────────┘   │
│           │                                          │
├───────────┼──────────────────────────────────────────┤
│           ▼                                          │
│  ┌─────────────────┐                                 │
│  │   Feature Hooks  │  use-auth.ts, use-employee.ts  │
│  └────────┬─────────┘                                │
│           ▼                                          │
│  ┌─────────────────┐                                 │
│  │ Feature Services │  auth.service.ts               │
│  └────────┬─────────┘                                │
│           ▼                                          │
│  ┌─────────────────┐                                 │
│  │   lib/axios.ts   │  Interceptors, Token attach    │
│  └────────┬─────────┘                                │
│           ▼                                          │
│      Backend API                                     │
└──────────────────────────────────────────────────────┘
```

**Nguyên tắc:**
- **TanStack Query**: Mọi dữ liệu CRUD từ server (employees, sites, shifts…)
- **Zustand**: Chỉ cho client state (auth, UI, notifications)
- **Không** lưu dữ liệu CRUD lớn trong global store

---

## 9. Luồng Dữ Liệu Trong Feature

```
Page (app/) → Feature Component → Feature Hook → Feature Service → API
     ↑              ↑                    ↑
     │              │                    │
  Chỉ render    UI + Logic        TanStack Query
  & điều phối   nghiệp vụ        cache & state
```

**Ví dụ luồng xem danh sách nhân viên:**

1. `src/app/(dashboard)/employees/page.tsx` → render `<EmployeeListPage />`
2. `src/features/employee/components/` → gọi `useEmployees()` hook
3. `src/features/employee/hooks/use-employee.ts` → gọi `employeeService.getAll()`
4. `src/features/employee/services/employee.service.ts` → `axios.get("/employees")`
5. Kết quả được **cache** bởi TanStack Query, component tự re-render

---

## 10. Nguyên Tắc Phát Triển

### 10.1 Nguyên Tắc Kiến Trúc

| # | Nguyên tắc | Giải thích |
|---|---|---|
| 1 | **Page chỉ điều phối** | `page.tsx` không chứa logic, chỉ import và render component từ `features/` |
| 2 | **Feature khép kín** | Mỗi feature chứa đủ: components, hooks, services, types, schemas, utils |
| 3 | **Không import chéo** | Feature A không import từ Feature B (trừ trường hợp thật sự cần thiết) |
| 4 | **UI chung → components/** | Component dùng ở ≥2 features → đưa vào `src/components/` |
| 5 | **Server state → TanStack Query** | Không lưu API data vào Zustand |
| 6 | **Client state → Zustand** | Auth, UI toggle, theme → Zustand store |

### 10.2 Quy Tắc Đặt Tên File

| Loại | Pattern | Ví dụ |
|---|---|---|
| Component | `PascalCase.tsx` | `LoginForm.tsx`, `DataTable.tsx` |
| Hook | `use-kebab-case.ts` | `use-auth.ts`, `use-employee.ts` |
| Service | `kebab-case.service.ts` | `auth.service.ts` |
| Store | `kebab-case.store.ts` | `auth.store.ts` |
| Type | `kebab-case.type.ts` | `auth.type.ts` |
| Schema | `kebab-case.schema.ts` | `auth.schema.ts` |
| Util/Mapper | `kebab-case.mapper.ts` | `auth.mapper.ts` |
| Constant | `kebab-case.ts` | `routes.ts`, `roles.ts` |

---

## 11. Quy Trình Thêm Tính Năng Mới

> Ví dụ: Thêm tính năng **Quản lý thiết bị** (`device`)

**Bước 1 — Tạo feature module:**
```text
src/features/device/
├── components/device.component.tsx
├── hooks/use-device.ts
├── services/device.service.ts
├── store/device.store.ts
├── types/device.type.ts
├── schemas/device.schema.ts
└── utils/device.mapper.ts
```

**Bước 2 — Định nghĩa types & schemas:**
```typescript
// src/features/device/types/device.type.ts
export interface Device {
  id: string;
  name: string;
  serialNumber: string;
  siteId: string;
  status: 'active' | 'inactive';
}

// src/features/device/schemas/device.schema.ts
import { z } from 'zod';
export const deviceSchema = z.object({
  name: z.string().min(1, 'Tên thiết bị bắt buộc'),
  serialNumber: z.string().min(1, 'Số serial bắt buộc'),
  siteId: z.string().min(1, 'Chọn điểm làm việc'),
});
```

**Bước 3 — Tạo service & hook:**
```typescript
// src/features/device/services/device.service.ts
import apiClient from '@/services/api-client';
export const deviceService = {
  getAll: () => apiClient.get('/devices'),
  getById: (id: string) => apiClient.get(`/devices/${id}`),
  create: (data: CreateDeviceDTO) => apiClient.post('/devices', data),
};
```

**Bước 4 — Đăng ký route:**
```text
src/app/(dashboard)/devices/page.tsx    → import DeviceListPage
```

**Bước 5 — Cập nhật sidebar:**
```typescript
// src/config/menu.ts → thêm item mới
{ label: 'Thiết bị', path: '/devices', icon: MonitorIcon }
```

---

## 12. Công Nghệ & Dependencies

### 12.1 Production Dependencies

| Package | Version | Vai trò |
|---|---|---|
| `next` | 16.2.9 | Framework chính (App Router) |
| `react` / `react-dom` | 19.2.4 | UI Library |
| `typescript` | ^5 | Type safety |
| `@tanstack/react-query` | ^5.101.0 | Server state management |
| `zustand` | ^5.0.14 | Client state management |
| `axios` | ^1.18.0 | HTTP client |
| `react-hook-form` | ^7.79.0 | Form management |
| `@hookform/resolvers` | ^5.4.0 | RHF + Zod integration |
| `zod` | ^4.4.3 | Schema validation |
| `antd` | ^6.4.4 | UI component library |
| `@ant-design/icons` | ^6.2.5 | Ant Design icons |
| `lucide-react` | ^1.18.0 | Modern icon set |
| `recharts` | ^3.8.1 | Biểu đồ thống kê |
| `leaflet` / `react-leaflet` | ^1.9.4 / ^5.0.0 | Bản đồ geofence |
| `clsx` | ^2.1.1 | Conditional classNames |
| `tailwind-merge` | ^3.6.0 | Tailwind class merging |

### 12.2 Dev Dependencies

| Package | Vai trò |
|---|---|
| `tailwindcss` ^4 | CSS framework |
| `@tailwindcss/postcss` ^4 | PostCSS plugin |
| `eslint` + `eslint-config-next` | Linting |
| `@types/leaflet` | Leaflet TypeScript types |

### 12.3 Scripts

```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint"
}
```

---

## 13. Cấu Hình TypeScript

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "strict": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "paths": { "@/*": ["./src/*"] }
  }
}
```

---

> **Ghi chú**: Tài liệu này được tổng hợp từ cấu trúc thư mục thực tế của dự án, kết hợp với tài liệu `TAILIEU.md` và FAMS Frontend Web Architecture Guide. Cập nhật lần cuối: 22/06/2026.
