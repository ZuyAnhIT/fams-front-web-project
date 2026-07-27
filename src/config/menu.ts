import { ADMIN_ROUTES, CUSTOMER_ROUTES } from "@/constants/routes";
import * as Icons from "lucide-react";
import { SystemRole } from "@/features/customer/auth/types/auth.type";

export interface MenuItem {
  title: string;
  path: string;
  icon: keyof typeof Icons;
  allowedRoles?: SystemRole[]; // Các role được phép xem menu này
  allowedPermissions?: string[];
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

  // -- CUSTOMER DASHBOARD --
  {
    title: "Tổng quan",
    path: CUSTOMER_ROUTES.DASHBOARD,
    icon: "LayoutDashboard",
    allowedRoles: [SystemRole.TENANT_ADMIN, SystemRole.HR_MANAGER, SystemRole.SITE_SUPERVISOR, SystemRole.EMPLOYEE]
  },

  // -- DÀNH CHO TENANT ADMIN & HR (CUSTOMER) --
  {
    title: "Nhân viên",
    path: CUSTOMER_ROUTES.EMPLOYEES,
    icon: "Users",
    allowedRoles: [SystemRole.TENANT_ADMIN, SystemRole.HR_MANAGER, SystemRole.SITE_SUPERVISOR],
    allowedPermissions: ["employees:list", "employees:read"],
  },
  {
    title: "Phòng ban",
    path: CUSTOMER_ROUTES.WORKSPACES,
    icon: "Network",
    allowedPermissions: ["workspaces:list", "workspaces:read"],
  },
  {
    title: "Chấm công",
    path: CUSTOMER_ROUTES.ATTENDANCE,
    icon: "CalendarCheck",
    allowedRoles: [SystemRole.TENANT_ADMIN, SystemRole.HR_MANAGER, SystemRole.SITE_SUPERVISOR]
  },
  {
    title: "Công trình",
    path: CUSTOMER_ROUTES.SITES,
    icon: "MapPin",
    allowedPermissions: ["sites:list", "sites:read"],
  },
  {
    title: "Báo cáo Face ID",
    path: CUSTOMER_ROUTES.FACE_ID_REPORT,
    icon: "ScanFace",
    allowedRoles: [SystemRole.TENANT_ADMIN, SystemRole.HR_MANAGER]
  },
  {
    title: "Kiểm tra ngẫu nhiên",
    path: CUSTOMER_ROUTES.RANDOM_CHECKS,
    icon: "RadioTower",
    allowedPermissions: ["randomchecks:list", "randomchecks:configure"]
  },

  // -- CẤU HÌNH HỆ THỐNG (CUSTOMER) --
  {
    title: "Cấu hình Công ty",
    path: CUSTOMER_ROUTES.TENANT_SETTINGS,
    icon: "Building",
    allowedRoles: [SystemRole.TENANT_ADMIN]
  },
  {
    title: "Vai trò & Phân quyền",
    path: CUSTOMER_ROUTES.ROLES,
    icon: "ShieldCheck",
    allowedPermissions: ["roles:read", "roles:create", "roles:update", "roles:delete"]
  },

];
