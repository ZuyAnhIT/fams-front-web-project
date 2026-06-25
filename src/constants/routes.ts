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

  // Dashboard
  DASHBOARD: "/dashboard",
  EMPLOYEES: "/employees",
  ATTENDANCE: "/attendance",
  SHIFTS: "/shifts",
  SITES: "/sites",
  ASSIGNMENTS: "/assignments",
  VIOLATIONS: "/violations",
  RANDOM_CHECKS: "/random-checks",
  REPORTS: "/reports",
  SETTINGS: "/settings",
  TENANTS: "/tenants",
  SUBSCRIPTIONS: "/subscriptions",
} as const;
