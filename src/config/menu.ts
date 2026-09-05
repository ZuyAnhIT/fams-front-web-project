import { ADMIN_ROUTES, CUSTOMER_ROUTES } from "@/constants/routes";
import * as Icons from "lucide-react";
import { SystemRole } from "@/features/customer/auth/types/auth.type";

export interface MenuItem {
  title: string;
  path: string;
  icon: keyof typeof Icons;
  allowedRoles?: SystemRole[]; // Các role được phép xem menu này
  allowedPermissions?: string[];
  excludedRoles?: SystemRole[];
  requiresTenant?: boolean;
}

export const SIDEBAR_MENU: MenuItem[] = [
  // -- ADMIN DASHBOARD --
  {
    title: "Tổng quan",
    path: ADMIN_ROUTES.DASHBOARD,
    icon: "LayoutDashboard",
    allowedRoles: [SystemRole.PLATFORM_ADMIN]
  },

  // -- DÀNH CHO PLATFORM ADMIN --
  {
    title: "Gói dịch vụ",
    path: ADMIN_ROUTES.PLANS,
    icon: "CreditCard",
    allowedRoles: [SystemRole.PLATFORM_ADMIN]
  },
  {
    title: "Thanh toán",
    path: ADMIN_ROUTES.BILLING,
    icon: "ReceiptText",
    allowedRoles: [SystemRole.PLATFORM_ADMIN, SystemRole.PLATFORM_STAFF],
    allowedPermissions: ["billing:list", "billing:read"],
  },
  {
    title: "Công ty",
    path: ADMIN_ROUTES.TENANTS,
    icon: "Building2",
    allowedRoles: [SystemRole.PLATFORM_ADMIN],
    allowedPermissions: ["tenants:list"],
  },
  {
    title: "Vai trò nền tảng",
    path: ADMIN_ROUTES.ROLES,
    icon: "ShieldCheck",
    allowedRoles: [SystemRole.PLATFORM_ADMIN]
  },
  {
    title: "Nhân sự FAMS",
    path: ADMIN_ROUTES.USERS,
    icon: "Users",
    allowedRoles: [SystemRole.PLATFORM_ADMIN]
  },
  {
    title: "Audit toàn hệ thống",
    path: ADMIN_ROUTES.AUDIT_LOGS,
    icon: "ScrollText",
    allowedRoles: [SystemRole.PLATFORM_ADMIN],
  },
  {
    title: "Vận hành hệ thống",
    path: ADMIN_ROUTES.SYSTEM_STATUS,
    icon: "Activity",
    allowedRoles: [SystemRole.PLATFORM_ADMIN],
    allowedPermissions: ["system:read", "golive:manage"],
  },
  {
    title: "Hướng dẫn sử dụng",
    path: ADMIN_ROUTES.HELP,
    icon: "BookOpenCheck",
    allowedRoles: [SystemRole.PLATFORM_ADMIN, SystemRole.PLATFORM_STAFF],
  },

  // -- CUSTOMER DASHBOARD --
  {
    title: "Tổng quan",
    path: CUSTOMER_ROUTES.DASHBOARD,
    icon: "LayoutDashboard",
    excludedRoles: [SystemRole.PLATFORM_ADMIN, SystemRole.PLATFORM_STAFF],
    requiresTenant: true,
  },

  // -- DÀNH CHO TENANT ADMIN & HR (CUSTOMER) --
  {
    title: "Nhân viên",
    path: CUSTOMER_ROUTES.EMPLOYEES,
    icon: "Users",
    allowedRoles: [SystemRole.PLATFORM_ADMIN],
    allowedPermissions: ["employees:list", "employees:read"],
    requiresTenant: true,
  },
  {
    title: "Phòng ban",
    path: CUSTOMER_ROUTES.WORKSPACES,
    icon: "Network",
    allowedPermissions: ["workspaces:list", "workspaces:read"],
    requiresTenant: true,
  },
  {
    title: "Chấm công",
    path: CUSTOMER_ROUTES.ATTENDANCE,
    icon: "CalendarCheck",
    allowedRoles: [SystemRole.PLATFORM_ADMIN],
    allowedPermissions: ["checkins:list", "attendance:list"],
    requiresTenant: true,
  },
  {
    title: "Công trình",
    path: CUSTOMER_ROUTES.SITES,
    icon: "MapPin",
    allowedPermissions: ["sites:list", "sites:read"],
    requiresTenant: true,
  },
  {
    title: "Báo cáo",
    path: CUSTOMER_ROUTES.REPORTS,
    icon: "ChartNoAxesCombined",
    allowedPermissions: ["reports:list"],
    requiresTenant: true,
  },
  {
    title: "Kiểm tra ngẫu nhiên",
    path: CUSTOMER_ROUTES.RANDOM_CHECKS,
    icon: "RadioTower",
    allowedPermissions: ["randomchecks:list", "randomchecks:configure"],
    requiresTenant: true,
  },
  {
    title: "Vi phạm",
    path: CUSTOMER_ROUTES.VIOLATIONS,
    icon: "AlertTriangle",
    allowedPermissions: ["violations:list", "violations:read"],
    allowedRoles: [SystemRole.PLATFORM_ADMIN],
    requiresTenant: true,
  },
  {
    title: "Nhật ký audit",
    path: CUSTOMER_ROUTES.AUDIT_LOGS,
    icon: "ScrollText",
    allowedPermissions: ["audit:list"],
    excludedRoles: [SystemRole.PLATFORM_ADMIN],
    requiresTenant: true,
  },
  {
    title: "Cần giải thích",
    path: CUSTOMER_ROUTES.EXCEPTIONS,
    icon: "MessageSquareText",
    excludedRoles: [SystemRole.PLATFORM_ADMIN, SystemRole.PLATFORM_STAFF],
    requiresTenant: true,
  },
  {
    title: "Hướng dẫn sử dụng",
    path: CUSTOMER_ROUTES.HELP,
    icon: "BookOpenCheck",
    excludedRoles: [SystemRole.PLATFORM_ADMIN, SystemRole.PLATFORM_STAFF],
    requiresTenant: true,
  },

  // -- CẤU HÌNH HỆ THỐNG (CUSTOMER) --
  {
    title: "Cấu hình Công ty",
    path: CUSTOMER_ROUTES.TENANT_SETTINGS,
    icon: "Building",
    requiresTenant: true,
  },
  {
    title: "Gói & thanh toán",
    path: CUSTOMER_ROUTES.BILLING,
    icon: "CreditCard",
    requiresTenant: true,
  },
  {
    title: "Thành viên công ty",
    path: CUSTOMER_ROUTES.TENANT_MEMBERS,
    icon: "Users",
    allowedRoles: [SystemRole.TENANT_ADMIN],
    allowedPermissions: ["roles:read", "roles:update", "employees:list"],
    requiresTenant: true,
  },
  {
    title: "Vai trò & Phân quyền",
    path: CUSTOMER_ROUTES.ROLES,
    icon: "ShieldCheck",
    allowedPermissions: ["roles:read", "roles:create", "roles:update", "roles:delete"],
    requiresTenant: true,
  },
  {
    title: "Mẫu thông báo",
    path: CUSTOMER_ROUTES.NOTIFICATION_TEMPLATES,
    icon: "MessagesSquare",
    allowedRoles: [SystemRole.PLATFORM_ADMIN],
    allowedPermissions: ["notifications:manage", "tenant:admin"],
    requiresTenant: true,
  },

];
