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
  SHIFTS: "/customer/shifts",
  SITES: "/customer/sites",
  ASSIGNMENTS: "/customer/assignments",
  VIOLATIONS: "/customer/violations",
  RANDOM_CHECKS: "/customer/random-checks",
  SETTINGS: "/customer/settings",
  TENANT_SETTINGS: "/customer/settings/tenant",
  WORKSPACES: "/customer/workspaces",
};
