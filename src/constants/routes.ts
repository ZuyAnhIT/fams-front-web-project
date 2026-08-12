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
  ROLES: "/admin/settings/roles",
  USERS: "/admin/users",
  AUDIT_LOGS: "/admin/audit-logs",
  SYSTEM_STATUS: "/admin/system-status",
  HELP: "/admin/help",
};

export const CUSTOMER_ROUTES = {
  DASHBOARD: "/customer/dashboard",
  EMPLOYEES: "/customer/employees",
  ATTENDANCE: "/customer/attendance",
  SITES: "/customer/sites",
  VIOLATIONS: "/customer/violations",
  EXCEPTIONS: "/customer/exceptions",
  RANDOM_CHECKS: "/customer/random-checks",
  FACE_ID_REPORT: "/customer/reports/face-id-enrollment",
  REPORTS: "/customer/reports",
  SETTINGS: "/customer/settings",
  TENANT_SETTINGS: "/customer/settings/tenant",
  ROLES: "/customer/settings/roles",
  MY_PERMISSIONS: "/customer/settings/permissions",
  WORKSPACES: "/customer/workspaces",
  SELECT_COMPANY: "/customer/select-company",
  NOTIFICATIONS: "/customer/notifications",
  AUDIT_LOGS: "/customer/audit-logs",
  NOTIFICATION_TEMPLATES: "/customer/settings/notification-templates",
  HELP: "/customer/help",
};
