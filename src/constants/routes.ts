/**
 * Quản lý tập trung danh sách các đường dẫn tĩnh (URL paths).
 * Tránh viết cứng (hardcode) route trong code.
 */
export const ROUTES = {
  // Auth
  LOGIN: "/login",
  LOGIN_PHONE: "/login/phone",
  REGISTER: "/register",
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: "/reset-password",
  VERIFY_EMAIL: "/verify-email",
};

export const ADMIN_ROUTES = {
  DASHBOARD: "/admin/dashboard",
  PLANS: "/admin/plans",
  TENANTS: "/admin/tenants",
  REPORTS: "/admin/reports",
  ROLES: "/admin/settings/roles",
};

export const CUSTOMER_ROUTES = {
  DASHBOARD: "/customer/dashboard",
  EMPLOYEES: "/customer/employees",
  ATTENDANCE: "/customer/attendance",
  SITES: "/customer/sites",
  VIOLATIONS: "/customer/violations",
  RANDOM_CHECKS: "/customer/random-checks",
  FACE_ID_REPORT: "/customer/reports/face-id-enrollment",
  SETTINGS: "/customer/settings",
  TENANT_SETTINGS: "/customer/settings/tenant",
  WORKSPACES: "/customer/workspaces",
  SELECT_COMPANY: "/customer/select-company",
  NOTIFICATIONS: "/customer/notifications",
};
