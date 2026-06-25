import { ROUTES } from "@/constants/routes";
import * as Icons from "lucide-react";
import { SystemRole } from "@/features/auth/types/auth.type";

export interface MenuItem {
  title: string;
  path: string;
  icon: keyof typeof Icons;
  allowedRoles?: SystemRole[]; // Các role được phép xem menu này
}

export const SIDEBAR_MENU: MenuItem[] = [
  { 
    title: "Tổng quan", 
    path: ROUTES.DASHBOARD, 
    icon: "LayoutDashboard" 
    // Không khai báo allowedRoles có nghĩa là public cho mọi user đã login
  },
  
  // -- DÀNH CHO PLATFORM ADMIN --
  { 
    title: "Gói dịch vụ", 
    path: "/plans", 
    icon: "CreditCard",
    allowedRoles: [SystemRole.PLATFORM_ADMIN]
  },
  { 
    title: "Công ty", 
    path: "/tenants", 
    icon: "Building2",
    allowedRoles: [SystemRole.PLATFORM_ADMIN]
  },

  // -- DÀNH CHO TENANT ADMIN & HR --
  { 
    title: "Nhân viên", 
    path: ROUTES.EMPLOYEES, 
    icon: "Users",
    allowedRoles: [SystemRole.TENANT_ADMIN, SystemRole.HR_MANAGER, SystemRole.SITE_SUPERVISOR, SystemRole.PLATFORM_ADMIN]
  },
  { 
    title: "Chấm công", 
    path: ROUTES.ATTENDANCE, 
    icon: "CalendarCheck",
    allowedRoles: [SystemRole.TENANT_ADMIN, SystemRole.HR_MANAGER, SystemRole.SITE_SUPERVISOR, SystemRole.PLATFORM_ADMIN]
  },
  { 
    title: "Ca làm việc", 
    path: ROUTES.SHIFTS, 
    icon: "Clock",
    allowedRoles: [SystemRole.TENANT_ADMIN, SystemRole.HR_MANAGER, SystemRole.PLATFORM_ADMIN]
  },
  { 
    title: "Địa bàn", 
    path: ROUTES.SITES, 
    icon: "MapPin",
    allowedRoles: [SystemRole.TENANT_ADMIN, SystemRole.SITE_SUPERVISOR, SystemRole.PLATFORM_ADMIN]
  },
  { 
    title: "Phân công", 
    path: ROUTES.ASSIGNMENTS, 
    icon: "ClipboardList",
    allowedRoles: [SystemRole.TENANT_ADMIN, SystemRole.HR_MANAGER, SystemRole.PLATFORM_ADMIN]
  },
  { 
    title: "Vi phạm", 
    path: ROUTES.VIOLATIONS, 
    icon: "AlertTriangle",
    allowedRoles: [SystemRole.TENANT_ADMIN, SystemRole.HR_MANAGER, SystemRole.SITE_SUPERVISOR, SystemRole.PLATFORM_ADMIN]
  },
  { 
    title: "Kiểm tra đột xuất", 
    path: ROUTES.RANDOM_CHECKS, 
    icon: "ShieldAlert",
    allowedRoles: [SystemRole.TENANT_ADMIN, SystemRole.SITE_SUPERVISOR, SystemRole.PLATFORM_ADMIN]
  },
  { 
    title: "Báo cáo", 
    path: ROUTES.REPORTS, 
    icon: "BarChart3",
    allowedRoles: [SystemRole.TENANT_ADMIN, SystemRole.HR_MANAGER, SystemRole.PLATFORM_ADMIN]
  },

  // -- CẤU HÌNH HỆ THỐNG --
  { 
    title: "Cấu hình Công ty", 
    path: "/settings/tenant", 
    icon: "Building",
    allowedRoles: [SystemRole.TENANT_ADMIN, SystemRole.PLATFORM_ADMIN]
  },
  { 
    title: "Vai trò & Quyền", 
    path: "/settings/roles", 
    icon: "ShieldCheck",
    allowedRoles: [SystemRole.TENANT_ADMIN, SystemRole.PLATFORM_ADMIN]
  },
  
];
