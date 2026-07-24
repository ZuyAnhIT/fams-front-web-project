"use client";

import { useAuthStore } from "@/stores/auth.store";
import {
  ChevronDown,
  LogOut,
  Menu,
  MonitorSmartphone,
  ShieldCheck,
  User as UserIcon,
} from "lucide-react";
import { App, Avatar, Dropdown, type MenuProps } from "antd";
import { usePathname, useRouter } from "next/navigation";
import { ROUTES, CUSTOMER_ROUTES } from "@/constants/routes";
import { useLogout } from "@/features/customer/auth/hooks/use-auth";
import { authTokenService } from "@/services/auth-token.service";
import NotificationBell from "@/features/customer/notification/components/NotificationBell";
import TenantSwitcher from "@/features/customer/tenant/components/TenantSwitcher";
import { SystemRole } from "@/features/customer/auth/types/auth.type";

interface HeaderProps {
  onOpenMenu: () => void;
}

const ROLE_LABELS: Record<SystemRole, string> = {
  [SystemRole.PLATFORM_ADMIN]: "Quản trị nền tảng",
  [SystemRole.PLATFORM_STAFF]: "Nhân viên nền tảng",
  [SystemRole.TENANT_ADMIN]: "Quản trị công ty",
  [SystemRole.HR_MANAGER]: "Quản lý nhân sự",
  [SystemRole.SITE_SUPERVISOR]: "Giám sát công trình",
  [SystemRole.EMPLOYEE]: "Nhân viên",
};

const PAGE_TITLES: Array<{ match: (path: string) => boolean; title: string; area: string }> = [
  { match: (path) => path === "/admin/dashboard", title: "Tổng quan nền tảng", area: "Quản trị nền tảng" },
  { match: (path) => path.startsWith("/admin/tenants/"), title: "Chi tiết công ty", area: "Công ty" },
  { match: (path) => path === "/admin/tenants", title: "Danh sách công ty", area: "Quản trị nền tảng" },
  { match: (path) => path === "/admin/plans", title: "Gói dịch vụ", area: "Quản trị nền tảng" },
  { match: (path) => path.startsWith("/admin/settings/roles"), title: "Vai trò và phân quyền", area: "Cài đặt" },
  { match: (path) => path === "/customer/dashboard", title: "Tổng quan hoạt động", area: "Không gian làm việc" },
  { match: (path) => path.startsWith("/customer/employees/"), title: "Hồ sơ nhân viên", area: "Nhân sự" },
  { match: (path) => path === "/customer/employees", title: "Quản lý nhân sự", area: "Nhân sự" },
  { match: (path) => path === "/customer/workspaces", title: "Cơ cấu tổ chức", area: "Nhân sự" },
  { match: (path) => path.startsWith("/customer/sites/"), title: "Chi tiết công trình", area: "Vận hành" },
  { match: (path) => path === "/customer/sites", title: "Quản lý công trình", area: "Vận hành" },
  { match: (path) => path === "/customer/attendance", title: "Quản lý chấm công", area: "Vận hành" },
  { match: (path) => path === "/customer/notifications", title: "Thông báo", area: "Tài khoản" },
  { match: (path) => path.startsWith("/customer/reports"), title: "Báo cáo Face ID", area: "Báo cáo" },
  { match: (path) => path.includes("tenant-settings") || path === "/customer/settings/tenant", title: "Cấu hình công ty", area: "Cài đặt" },
  { match: (path) => path.startsWith("/customer/settings"), title: "Cài đặt tài khoản", area: "Tài khoản" },
];

function getPageContext(pathname: string) {
  return PAGE_TITLES.find((item) => item.match(pathname)) ?? {
    title: "FAMS",
    area: "Hệ thống quản lý",
  };
}

export default function Header({ onOpenMenu }: HeaderProps) {
  const { message } = App.useApp();
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const logoutMutation = useLogout();
  const pageContext = getPageContext(pathname);

  const handleLogout = async () => {
    if (typeof window !== "undefined") {
      (window as Window & { __isLoggingOut?: boolean }).__isLoggingOut = true;
    }

    const refreshToken = authTokenService.getRefreshToken();
    if (refreshToken) {
      try {
        await logoutMutation.mutateAsync({ refreshToken });
      } catch {
        // Luôn xóa phiên cục bộ để người dùng không bị mắc kẹt khi backend lỗi.
      }
    }

    logout();
    message.success("Đăng xuất thành công");
    router.push(ROUTES.LOGIN);
  };

  const menuItems: MenuProps["items"] = [
    {
      key: "profile",
      icon: <UserIcon className="h-4 w-4" aria-hidden="true" />,
      label: "Thông tin cá nhân",
      onClick: () => router.push(CUSTOMER_ROUTES.SETTINGS),
    },
    {
      key: "security",
      icon: <ShieldCheck className="h-4 w-4" aria-hidden="true" />,
      label: "Bảo mật tài khoản",
      onClick: () => router.push("/customer/settings/totp"),
    },
    {
      key: "sessions",
      icon: <MonitorSmartphone className="h-4 w-4" aria-hidden="true" />,
      label: "Thiết bị và phiên",
      onClick: () => router.push("/customer/settings/sessions"),
    },
    { type: "divider" },
    {
      key: "logout",
      icon: <LogOut className="h-4 w-4" aria-hidden="true" />,
      label: "Đăng xuất",
      danger: true,
      onClick: () => void handleLogout(),
    },
  ];

  const displayName = user?.displayName || user?.email || "Người dùng";
  const avatarFallback = displayName.trim().charAt(0).toUpperCase() || "U";

  return (
    <header className="sticky top-0 z-30 flex h-[68px] items-center justify-between border-b border-slate-200 bg-white/95 px-4 shadow-sm backdrop-blur lg:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onOpenMenu}
          aria-label="Mở menu điều hướng"
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 lg:hidden"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>

        <div className="min-w-0">
          <p className="hidden text-xs font-medium text-slate-500 sm:block">{pageContext.area}</p>
          <p className="truncate text-base font-semibold text-slate-900 sm:text-lg">{pageContext.title}</p>
        </div>
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        {user?.tenantId && <TenantSwitcher />}
        {user?.tenantId && <NotificationBell />}

        <Dropdown menu={{ items: menuItems }} trigger={["click"]} placement="bottomRight">
          <button
            type="button"
            aria-label="Mở menu tài khoản"
            aria-haspopup="menu"
            className="flex min-w-0 items-center gap-2 rounded-xl border border-transparent p-1.5 text-left transition-colors hover:border-slate-200 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 sm:pr-2"
          >
            <Avatar src={user?.avatarUrl || undefined} className="shrink-0 bg-blue-600 font-semibold">
              {avatarFallback}
            </Avatar>
            <span className="hidden min-w-0 flex-col md:flex">
              <span className="max-w-40 truncate text-sm font-semibold text-slate-800">{displayName}</span>
              <span className="max-w-40 truncate text-xs text-slate-500">
                {user?.role ? ROLE_LABELS[user.role] : "Người dùng"}
              </span>
            </span>
            <ChevronDown className="hidden h-4 w-4 text-slate-400 sm:block" aria-hidden="true" />
          </button>
        </Dropdown>
      </div>
    </header>
  );
}
