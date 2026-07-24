# 01. Cấu trúc thư mục dự án FAMS Frontend

> Phạm vi khảo sát: mã nguồn tại ngày 23/07/2026. Cây dưới đây không liệt kê nội dung sinh tự động của `.git/`, `.next/`, `node_modules/`, `package-lock.json` và các ảnh nhị phân. Đây là tài liệu hiện trạng, không phải khẳng định rằng mọi file đang có đều đã hoàn thiện.

## 1. Cách đọc cấu trúc

- `src/app/` là Next.js App Router. Thư mục quyết định URL; `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `route.ts` là file có ý nghĩa đặc biệt.
- `(auth)` và `(personal)` là route group: dùng để tổ chức/layout, dấu ngoặc không xuất hiện trên URL.
- `[id]` là dynamic segment. Trong Next.js 16, `params` là Promise ở API page/layout tương ứng.
- `src/features/` chứa code theo nghiệp vụ; `src/components/` chỉ nên chứa thành phần dùng chung, không sở hữu nghiệp vụ.
- File có kích thước 0 byte được đánh dấu `[RỖNG]`. Không được xem file rỗng là tính năng đã triển khai.

## 2. Cây tổng thể repository

```text
fams-front-web-project/
├── .github/
│   └── workflows/
│       └── ci.yml                    # CI: install → lint → typecheck → build
├── docs/
│   ├── onboarding/                   # Bộ tài liệu bàn giao theo từng chủ đề
│   ├── CURRENT_PROJECT_STATUS.md      # Trạng thái/rủi ro đã ghi nhận trước đó
│   └── FAMS_FRONTEND_ARCHITECTURE.md  # Tài liệu kiến trúc tổng hợp trước đó
├── public/                            # Static assets được phục vụ từ URL gốc
│   ├── BGR_LOGIN.jpg
│   ├── BGR_LOGIN_REGISTER.jpg
│   ├── BGR_LOGIN_REGISTER1.jpg
│   ├── bg-login.png
│   ├── file.svg
│   ├── globe.svg
│   ├── next.svg
│   ├── vercel.svg
│   └── window.svg
├── src/                               # Toàn bộ mã ứng dụng
│   ├── app/                           # Router, page, layout, error boundary
│   ├── components/                    # UI dùng chung giữa nhiều feature
│   ├── config/                        # Menu và cấu hình app
│   ├── constants/                     # Route, màu, trạng thái, permission
│   ├── features/                      # Các module nghiệp vụ admin/customer
│   ├── hooks/                         # Hook dùng chung
│   ├── layouts/                       # Shell auth/dashboard
│   ├── lib/                           # Provider/integration cấp thấp
│   ├── providers/                     # Provider theme theo tenant
│   ├── schemas/                       # Schema dùng chung, hiện đều rỗng
│   ├── services/                      # HTTP/token/service dùng toàn ứng dụng
│   ├── stores/                        # Zustand store dùng toàn ứng dụng
│   ├── types/                         # Type dùng chung/API envelope
│   ├── utils/                         # Helper dùng chung
│   └── proxy.ts                       # Next.js 16 Proxy cho link email GET
├── .env.example                       # Danh sách biến môi trường public
├── .gitignore
├── AGENTS.md                           # Quy tắc: phải đọc docs Next.js local
├── CAUTRUCWEB.md                       # Tài liệu cũ, có thể lệch mã nguồn
├── CLAUDE.md                           # Ghi chú công cụ cũ
├── README.md                           # Khởi động nhanh/trạng thái
├── TAILIEU.md                          # Tài liệu cũ, có thể lệch mã nguồn
├── docker                              # File rỗng, chưa phải Dockerfile
├── eslint.config.mjs                   # ESLint 9 + Next core web vitals
├── next-env.d.ts                       # Type do Next.js sinh
├── next.config.ts                      # Rewrite /api/* → backend :8080
├── package.json                        # Script và dependency trực tiếp
├── package-lock.json                   # Khoá dependency cho npm ci
├── playwright.config.ts                # E2E Chromium; chạy production build
├── postcss.config.mjs                  # Tailwind CSS 4 PostCSS plugin
├── role.md                             # Ghi chú role ngoài runtime
└── tsconfig.json                       # TypeScript strict + alias @/*
```

## 3. Cây `src/app`: URL và điểm vào của trang

```text
src/app/
├── (auth)/                             # Group public; URL không có /(auth)
│   ├── accept-invite/page.tsx          # /accept-invite
│   ├── forgot-password/page.tsx        # /forgot-password
│   ├── login/
│   │   ├── phone/page.tsx              # /login/phone
│   │   └── page.tsx                    # /login
│   ├── register/page.tsx               # /register
│   ├── reset-password/page.tsx         # /reset-password
│   ├── verify-email/page.tsx            # /verify-email: kết quả link xác thực
│   └── layout.tsx                      # Auth shell + GoogleOAuthProvider
├── admin/
│   ├── dashboard/page.tsx              # /admin/dashboard
│   ├── plans/page.tsx                  # /admin/plans
│   ├── reports/page.tsx                # /admin/reports [PLACEHOLDER]
│   ├── settings/roles/
│   │   ├── [id]/page.tsx               # /admin/settings/roles/:id
│   │   ├── create/page.tsx             # /admin/settings/roles/create
│   │   └── page.tsx                    # /admin/settings/roles
│   ├── tenants/
│   │   ├── [id]/page.tsx               # /admin/tenants/:id
│   │   └── page.tsx                    # /admin/tenants
│   ├── error.tsx                       # Error boundary vùng admin
│   ├── layout.tsx                      # DashboardLayout
│   └── loading.tsx                     # Loading fallback vùng admin
├── api/
│   ├── auth/verify-email/route.ts       # BFF gọi backend verify, tránh Proxy loop
│   └── health/route.ts                  # GET /api/health của frontend
├── customer/
│   ├── attendance/page.tsx             # /customer/attendance
│   ├── dashboard/page.tsx              # /customer/dashboard
│   ├── employees/
│   │   ├── [id]/page.tsx               # /customer/employees/:id
│   │   ├── create/page.tsx             # /customer/employees/create
│   │   └── page.tsx                    # /customer/employees
│   ├── notifications/page.tsx          # /customer/notifications
│   ├── random-checks/page.tsx           # /customer/random-checks [PLACEHOLDER]
│   ├── reports/
│   │   └── face-id-enrollment/page.tsx # /customer/reports/face-id-enrollment
│   ├── select-company/page.tsx          # /customer/select-company
│   ├── settings/
│   │   ├── (personal)/                 # URL vẫn là /customer/settings/...
│   │   │   ├── password/page.tsx        # .../password
│   │   │   ├── sessions/page.tsx        # .../sessions
│   │   │   ├── totp/page.tsx            # .../totp
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx                # /customer/settings
│   │   └── tenant/page.tsx             # /customer/settings/tenant (canonical)
│   ├── sites/
│   │   ├── [id]/page.tsx               # /customer/sites/:id
│   │   ├── create/page.tsx             # /customer/sites/create [PLACEHOLDER]
│   │   └── page.tsx                    # /customer/sites
│   ├── tenant-settings/page.tsx         # Route cũ, redirect sang settings/tenant
│   ├── violations/page.tsx              # /customer/violations [PLACEHOLDER]
│   ├── workspaces/page.tsx              # /customer/workspaces
│   ├── error.tsx
│   ├── layout.tsx                      # DashboardLayout
│   └── loading.tsx
├── error.tsx                           # Error boundary cấp root segment
├── global-error.tsx                    # Error boundary cuối cùng
├── globals.css                         # Tailwind/theme/global styles
├── layout.tsx                          # Root: QueryProvider → TenantThemeProvider
├── loading.tsx
├── not-found.tsx
└── page.tsx                            # / → redirect /login
```

## 4. Cây UI dùng chung

```text
src/components/
├── charts/
│   └── StatCard.tsx                    # Card chỉ số dùng chung
├── feedback/
│   ├── EmptyState.tsx
│   ├── PageLoading.tsx
│   └── RouteError.tsx
├── forms/                              # Adapter React Hook Form → Base UI
│   ├── FormDatePicker.tsx
│   ├── FormInput.tsx
│   ├── FormSelect.tsx
│   ├── FormTextArea.tsx
│   ├── FormTreeSelect.tsx
│   └── index.ts
├── guards/
│   └── RoleGuard.tsx                   # Chặn UI theo SystemRole; không thay backend authz
├── icons/
│   ├── GoogleIcon.tsx
│   ├── MicrosoftIcon.tsx
│   └── index.ts
├── maps/
│   ├── GeofenceMap.tsx                 # [RỖNG]
│   ├── LocationPickerMap.tsx
│   └── MapWrapper.tsx                  # Dynamic/client wrapper cho Leaflet
├── shared/layout/
│   ├── ContentCard.tsx
│   ├── DetailHeader.tsx
│   └── ListHeader.tsx
├── tables/
│   └── DataTable.tsx                   # Table + pagination + empty state chuẩn
└── ui/                                 # Design primitives bọc Ant Design
    ├── BaseButton.tsx
    ├── BaseCheckbox.tsx
    ├── BaseConfirmModal.tsx
    ├── BaseDatePicker.tsx
    ├── BaseInput.tsx
    ├── BaseInputPassword.tsx
    ├── BaseModal.tsx
    ├── BaseSelect.tsx
    ├── BaseSwitch.tsx
    ├── BaseTextArea.tsx
    ├── BaseTimePicker.tsx
    ├── BaseTreeSelect.tsx
    ├── GlassCard.tsx
    ├── StatusBadge.tsx
    └── index.ts
```

## 5. Cây feature nghiệp vụ Admin

```text
src/features/admin/
├── dashboard/                          # Toàn bộ 7 file scaffold đang [RỖNG]
│   ├── components/dashboard.component.tsx
│   ├── hooks/use-dashboard.ts
│   ├── schemas/dashboard.schema.ts
│   ├── services/dashboard.service.ts
│   ├── store/dashboard.store.ts
│   ├── types/dashboard.type.ts
│   └── utils/dashboard.mapper.ts
├── report/                             # Toàn bộ 7 file scaffold đang [RỖNG]
│   ├── components/report.component.tsx
│   ├── hooks/use-report.ts
│   ├── schemas/report.schema.ts
│   ├── services/report.service.ts
│   ├── store/report.store.ts
│   ├── types/report.type.ts
│   └── utils/report.mapper.ts
├── role/                               # Luồng role dạng page/form cũ
│   ├── components/
│   │   ├── PermissionMatrix.tsx
│   │   ├── RoleForm.tsx
│   │   └── RoleListPage.tsx
│   ├── hooks/use-role.ts
│   ├── schemas/role.schema.ts
│   ├── services/role.service.ts
│   └── types/role.type.ts
├── role-permission/                    # Luồng role/permission đang dùng ở list chính
│   ├── components/
│   │   ├── AssignRoleModal.tsx
│   │   ├── RoleFormModal.tsx
│   │   ├── RoleManagementPage.tsx
│   │   └── role-permission.component.tsx [RỖNG]
│   ├── hooks/use-role-permission.ts
│   ├── schemas/role-permission.schema.ts [RỖNG]
│   ├── services/role-permission.service.ts
│   ├── store/role-permission.store.ts   [RỖNG]
│   ├── types/
│   │   ├── index.ts
│   │   └── role-permission.type.ts      [RỖNG]
│   └── utils/
│       ├── permission.mapper.ts         [RỖNG]
│       └── role-permission.mapper.ts    [RỖNG]
├── subscription/
│   ├── components/
│   │   ├── PlanFormModal.tsx
│   │   ├── PlanLimitsDrawer.tsx
│   │   ├── PlanListPage.tsx
│   │   └── SubscriptionManager.tsx
│   ├── hooks/
│   │   ├── use-subscription.ts
│   │   └── use-tenant-subscription.ts
│   ├── schemas/subscription.schema.ts
│   ├── services/
│   │   ├── subscription.service.ts
│   │   └── tenant-subscription.service.ts
│   └── types/subscription.type.ts
└── tenant/
    ├── components/
    │   ├── CreateTenantModal.tsx
    │   ├── IpWhitelistTable.tsx
    │   ├── TenantConfigurationPage.tsx
    │   ├── TenantDetailPage.tsx
    │   ├── TenantListPage.tsx
    │   ├── TenantSettingsPage.tsx
    │   ├── UpdateTenantForm.tsx
    │   └── tenant.component.tsx         [RỖNG]
    ├── hooks/use-tenant.ts
    ├── schemas/tenant.schema.ts
    ├── services/tenant.service.ts
    ├── store/tenant.store.ts            [RỖNG]
    ├── types/tenant.type.ts
    └── utils/tenant.mapper.ts           [RỖNG]
```

## 6. Cây feature nghiệp vụ Customer

```text
src/features/customer/
├── assignment/
│   ├── components/{AssignmentFormModal,AssignmentManagementTab}.tsx
│   ├── components/assignment.component.tsx [RỖNG]
│   ├── hooks/{use-assignment,use-assignments}.ts
│   ├── schemas/assignment.schema.ts
│   ├── services/assignment.service.ts
│   ├── store/assignment.store.ts [RỖNG]
│   ├── types/assignment.type.ts
│   └── utils/assignment.mapper.ts [RỖNG]
├── attendance/
│   ├── components/{AttendanceMonthlyTab,AttendanceSummaryTab}.tsx
│   ├── components/attendance.component.tsx [RỖNG]
│   ├── hooks/use-attendance.ts
│   ├── schemas/attendance.schema.ts [RỖNG]
│   ├── services/attendance.service.ts
│   ├── store/attendance.store.ts [RỖNG]
│   ├── types/attendance.type.ts
│   └── utils/attendance.mapper.ts [RỖNG]
├── auth/
│   ├── components/
│   │   ├── ForgotPasswordForm.tsx
│   │   ├── LoginForm.tsx
│   │   ├── PhoneLoginForm.tsx
│   │   ├── RegisterForm.tsx
│   │   ├── ResetPasswordForm.tsx
│   │   ├── SessionManagement.tsx
│   │   ├── VerifyEmailResult.tsx
│   │   ├── auth.component.tsx [RỖNG]
│   │   └── index.ts
│   ├── hooks/{use-auth,use-firebase-phone-auth}.ts
│   ├── schemas/auth.schema.ts
│   ├── services/auth.service.ts
│   ├── store/auth.store.ts [RỖNG; store thật ở src/stores/auth.store.ts]
│   ├── types/auth.type.ts
│   └── utils/{auth-device.util,auth.mapper,firebase-phone.util,jwt}.ts
├── checkin/
│   ├── components/{CheckinDetailModal,CheckinListTab}.tsx
│   ├── hooks/use-checkin.ts
│   ├── services/checkin.service.ts
│   └── types/checkin.type.ts
├── dashboard/                          # Scaffold feature đang [RỖNG]
│   ├── components/dashboard.component.tsx
│   ├── hooks/use-dashboard.ts
│   ├── schemas/dashboard.schema.ts
│   ├── services/dashboard.service.ts
│   ├── store/dashboard.store.ts
│   ├── types/dashboard.type.ts
│   └── utils/dashboard.mapper.ts
├── employee/
│   ├── components/
│   │   ├── CancelInvitationModal.tsx
│   │   ├── EmployeeFaceIdTab.tsx
│   │   ├── EmployeeForm.tsx
│   │   ├── EmployeeFormModal.tsx
│   │   ├── EmployeeListPage.tsx
│   │   ├── EmployeeRolesTab.tsx
│   │   ├── EmployeeTabs.tsx
│   │   ├── ImportEmployeeModal.tsx
│   │   ├── InvitationListPage.tsx
│   │   ├── InviteEmployeeModal.tsx
│   │   └── employee.component.tsx [RỖNG]
│   ├── hooks/use-employee.ts
│   ├── schemas/employee.schema.ts
│   ├── services/employee.service.ts
│   ├── store/employee.store.ts [RỖNG]
│   ├── types/employee.type.ts
│   └── utils/employee.mapper.ts [RỖNG]
├── geofence/
│   ├── components/
│   │   ├── EditGeofenceModal.tsx
│   │   ├── GeofenceEditorMap.tsx
│   │   ├── GeofenceHistoryTab.tsx
│   │   └── MapEvents.tsx
│   ├── hooks/use-geofence.ts
│   ├── services/geofence.service.ts
│   └── types/geofence.type.ts
├── notification/
│   ├── components/
│   │   ├── NotificationBell.tsx
│   │   ├── NotificationPage.tsx
│   │   ├── NotificationWatcher.tsx
│   │   └── notification.component.tsx [RỖNG]
│   ├── hooks/use-notification.ts [RỖNG]
│   ├── schemas/notification.schema.ts [RỖNG]
│   ├── services/notification.service.ts
│   ├── store/notification.store.ts [RỖNG]
│   ├── stores/notification.store.ts   # Store thật
│   ├── types/notification.type.ts
│   └── utils/notification.mapper.ts [RỖNG]
├── random-check/                       # Toàn bộ feature đang [RỖNG]
│   ├── components/random-check.component.tsx
│   ├── hooks/use-random-check.ts
│   ├── schemas/random-check.schema.ts
│   ├── services/random-check.service.ts
│   ├── store/random-check.store.ts
│   ├── types/random-check.type.ts
│   └── utils/random-check.mapper.ts
├── report/
│   ├── components/FaceIdEnrollmentReportPage.tsx
│   ├── hooks/use-face-id-report.ts
│   ├── services/face-id-report.service.ts
│   └── types/face-id-report.type.ts
├── setting/
│   ├── components/
│   │   ├── ChangePasswordForm.tsx
│   │   ├── ProfileSettingForm.tsx
│   │   ├── TotpSettingForm.tsx
│   │   └── setting.component.tsx [RỖNG]
│   ├── hooks/use-setting.ts [RỖNG]
│   ├── schemas/setting.schema.ts
│   ├── services/setting.service.ts [RỖNG]
│   ├── store/setting.store.ts [RỖNG]
│   ├── types/setting.type.ts [RỖNG]
│   └── utils/setting.mapper.ts [RỖNG]
├── shift/
│   ├── components/{ShiftFormModal,ShiftManagementTab,ShiftOtConfigModal}.tsx
│   ├── components/shift.component.tsx [RỖNG]
│   ├── hooks/use-shift.ts
│   ├── schemas/shift.schema.ts [RỖNG]
│   ├── services/shift.service.ts
│   ├── store/shift.store.ts [RỖNG]
│   ├── types/shift.type.ts
│   └── utils/shift.mapper.ts [RỖNG]
├── site/
│   ├── components/
│   │   ├── ActiveGeofenceCard.tsx
│   │   ├── CreateSiteModal.tsx
│   │   ├── GeofenceMap.tsx
│   │   ├── SitePage.tsx
│   │   ├── UpdateSiteModal.tsx
│   │   └── site.component.tsx [RỖNG]
│   ├── hooks/use-site.ts
│   ├── schemas/site.schema.ts [RỖNG]
│   ├── services/site.service.ts
│   ├── store/site.store.ts [RỖNG]
│   ├── types/site.type.ts
│   └── utils/site.mapper.ts [RỖNG]
├── tenant/
│   ├── components/{CreateCompanyForm,SelectCompanyPage,TenantSwitcher}.tsx
│   ├── hooks/use-my-memberships.ts
│   └── schemas/create-company.schema.ts
├── violation/                          # Toàn bộ feature đang [RỖNG]
│   ├── components/violation.component.tsx
│   ├── hooks/use-violation.ts
│   ├── schemas/violation.schema.ts
│   ├── services/violation.service.ts
│   ├── store/violation.store.ts
│   ├── types/violation.type.ts
│   └── utils/violation.mapper.ts
└── workspace/
    ├── components/
    │   ├── AddMemberModal.tsx
    │   ├── CreateWorkspaceModal.tsx
    │   ├── TransferMemberModal.tsx
    │   ├── UpdateWorkspaceModal.tsx
    │   ├── WorkspaceCard.tsx
    │   ├── WorkspaceDetailDrawer.tsx
    │   └── WorkspacePage.tsx
    ├── hooks/use-workspace.ts
    ├── schemas/workspace.schema.ts
    ├── services/workspace.service.ts
    └── types/{index,workspace.type}.ts
```

Ghi chú: ký pháp `{A,B}.tsx` ở cây trên là cách viết gọn cho hai file `A.tsx` và `B.tsx`, không phải tên file thật.

## 7. Cây hạ tầng dùng chung

```text
src/
├── config/
│   ├── env.ts                          # [RỖNG]
│   └── menu.ts                         # Sidebar menu theo SystemRole
├── constants/
│   ├── app.ts
│   ├── colors.ts
│   ├── permissions.ts                  # [RỖNG]
│   ├── roles.ts                        # [RỖNG]
│   ├── routes.ts
│   └── status.ts
├── hooks/
│   ├── use-user.ts
│   ├── useCurrentUser.ts               # [RỖNG]
│   ├── useDebounce.ts
│   ├── usePagination.ts                # Đồng bộ filter/page với URL
│   └── usePermission.ts                # [RỖNG]
├── layouts/
│   ├── AuthLayout.tsx                  # [RỖNG; auth thật ở app/(auth)/layout]
│   ├── DashboardLayout.tsx
│   ├── Header.tsx
│   ├── MobileNav.tsx
│   └── Sidebar.tsx
├── lib/
│   ├── QueryProvider.tsx
│   ├── auth.ts                         # [RỖNG]
│   ├── axios.ts                        # [RỖNG; client thật ở services]
│   ├── date.ts                         # [RỖNG]
│   ├── firebase.ts
│   ├── permissions.ts                  # [RỖNG]
│   └── query-client.ts                 # [RỖNG]
├── providers/
│   └── TenantThemeProvider.tsx
├── schemas/
│   ├── auth.schema.ts                  # [RỖNG]
│   ├── employee.schema.ts              # [RỖNG]
│   └── site.schema.ts                  # [RỖNG]
├── services/
│   ├── api-client.ts                   # Axios + auth header + refresh queue
│   ├── auth-token.service.ts           # Token trong localStorage
│   ├── upload.service.ts               # [RỖNG]
│   ├── user.service.ts
│   └── websocket.service.ts            # [RỖNG]
├── stores/
│   ├── app.store.ts                    # [RỖNG]
│   ├── auth.store.ts                   # Store auth thật
│   ├── notification.store.ts           # [RỖNG]
│   └── tenant.store.ts
├── types/
│   ├── api.ts                          # ApiResponse và PageResponse
│   ├── auth.ts                         # [RỖNG]
│   ├── common.ts                       # [RỖNG]
│   ├── tenant.ts                       # [RỖNG]
│   └── user.ts                         # [RỖNG]
└── utils/
    ├── cn.ts                           # clsx + tailwind-merge
    ├── file.ts                         # [RỖNG]
    ├── format-date.ts                  # [RỖNG]
    ├── format-number.ts                # [RỖNG]
    ├── name.util.ts
    └── route.util.ts                   # Route sau login/dashboard
```

## 8. Quy ước vị trí file khi đọc hoặc thêm code

| Câu hỏi | Nơi tìm/đặt đúng |
|---|---|
| URL nào render màn hình? | `src/app/**/page.tsx` |
| Layout/loading/error của route? | `src/app/**/{layout,loading,error}.tsx` |
| UI nghiệp vụ nằm đâu? | `src/features/<area>/<feature>/components/` |
| Gọi API nghiệp vụ? | `src/features/<area>/<feature>/services/` |
| Cache/query/mutation? | `src/features/<area>/<feature>/hooks/` |
| Request/response/domain type? | `src/features/<area>/<feature>/types/` |
| Validate form? | `src/features/<area>/<feature>/schemas/` |
| Chuyển đổi API model ↔ UI model? | `src/features/<area>/<feature>/utils/` |
| UI primitive dùng chung? | `src/components/ui`, `forms`, `tables`, `shared` |
| Session, HTTP, provider toàn app? | `src/services`, `src/lib`, `src/providers`, `src/stores` |

Không tạo thêm file placeholder chỉ để “đủ bộ thư mục”. Chỉ tạo `store/`, `utils/mapper`, hoặc `schemas/` khi feature thực sự có nhu cầu; hiện tại số lượng file rỗng lớn đang làm sai lệch cảm nhận về độ hoàn thiện.
