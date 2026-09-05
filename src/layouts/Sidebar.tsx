"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import * as Icons from "lucide-react";
import { Tooltip } from "antd";
import { cn } from "@/utils/cn";
import { APP_NAME } from "@/constants/app";
import { SIDEBAR_MENU } from "@/config/menu";
import { useAuthStore } from "@/stores/auth.store";
import { CUSTOMER_ROUTES } from "@/constants/routes";
import { SystemRole } from "@/features/customer/auth/types/auth.type";
import { useTenantDetail } from "@/features/admin/tenant/hooks/use-tenant";
import Image from "next/image";

interface SidebarProps {
  variant?: "desktop" | "mobile";
  onNavigate?: () => void;
}

const ROLE_LABELS: Record<string, string> = {
  PLATFORM_ADMIN: "Quản trị nền tảng",
  PLATFORM_STAFF: "Nhân viên nền tảng",
  TENANT_ADMIN: "Quản trị công ty",
  HR_MANAGER: "Quản lý nhân sự",
  SITE_SUPERVISOR: "Giám sát công trình",
  EMPLOYEE: "Nhân viên",
};

export default function Sidebar({ variant = "desktop", onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isPlatformSession = user?.role === SystemRole.PLATFORM_ADMIN
    || user?.role === SystemRole.PLATFORM_STAFF;
  const shouldCheckOwner = Boolean(
    !isPlatformSession && user?.tenantId && (
      user.role === SystemRole.TENANT_ADMIN ||
      user.memberships?.some(
        (membership) =>
          membership.tenantId === user.tenantId &&
          membership.roleName === SystemRole.TENANT_ADMIN,
      )
    ),
  );
  const { data: activeTenantDetail } = useTenantDetail(user?.tenantId || "", shouldCheckOwner);
  const isActiveTenantOwner = Boolean(
    activeTenantDetail && user?.id && activeTenantDetail.ownerId === user.id,
  );
  const isMobile = variant === "mobile";
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Sync state with localStorage on mount (hydration safe)
  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved === "true") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsCollapsed(true);
    }
    setIsMounted(true);
  }, []);

  const toggleSidebar = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("sidebar-collapsed", String(next));
      return next;
    });
  };

  // Avoid layout shift during server-side rendering hydration
  const sidebarWidthClass = isMobile
    ? "w-full"
    : !isMounted
    ? "w-64"
    : isCollapsed
      ? "w-16"
      : "w-64";

  return (
    <aside className={cn(
      "border-r border-slate-800 bg-slate-950 text-slate-100 flex-col shrink-0 overflow-hidden",
      isMobile ? "flex h-full" : "hidden lg:flex h-dvh sticky top-0 transition-all duration-300 ease-in-out",
      sidebarWidthClass
    )}>
      {/* Brand Logo & Toggle */}
      <div className={cn(
        "h-16 flex items-center px-6 border-b border-brand-800/40 justify-between transition-all duration-300",
        !isMobile && isCollapsed ? "px-0 justify-center" : ""
      )}>
        {!isMobile && isCollapsed ? (
          <button
            type="button"
            onClick={toggleSidebar}
            aria-label="Mở rộng thanh điều hướng"
            aria-expanded={false}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white font-black text-blue-700 text-lg shadow-sm hover:bg-blue-50 active:scale-95 transition-all group/logo cursor-pointer"
          >
            <span className="group-hover/logo:hidden">F</span>
            <Icons.ChevronRight className="hidden group-hover/logo:block h-5 w-5" aria-hidden="true" />
          </button>
        ) : (
          <>
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 font-black text-white text-lg shadow-lg shadow-blue-950/40">
                F
              </div>
              <span className="text-xl font-bold tracking-wide text-white truncate select-none">
                {APP_NAME}
              </span>
            </div>
            {isMobile ? (
              <button
                type="button"
                onClick={onNavigate}
                aria-label="Đóng menu điều hướng"
                className="shrink-0 rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
              >
                <Icons.X className="h-5 w-5" aria-hidden="true" />
              </button>
            ) : (
              <button
                type="button"
                onClick={toggleSidebar}
                aria-label="Thu gọn thanh điều hướng"
                aria-expanded={true}
                className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors border border-transparent hover:border-slate-700 cursor-pointer active:scale-95 shrink-0"
              >
                <Icons.ChevronLeft className="h-4.5 w-4.5" aria-hidden="true" />
              </button>
            )}
          </>
        )}
      </div>

      {/* Nav Menu */}
      <nav className={cn(
        "flex-1 overflow-y-auto overflow-x-hidden py-4 space-y-1 transition-all duration-300",
        !isMobile && isCollapsed ? "px-2" : "px-4"
      )}>
        {SIDEBAR_MENU.filter((item) => {
          const isPlatformMenu = item.path.startsWith("/admin");
          // Platform and company workspaces are separate security scopes. Platform
          // permissions must never make company navigation appear in a platform session.
          if (isPlatformSession !== isPlatformMenu) return false;
          if (item.requiresTenant && !user?.tenantId) return false;
          if (user?.role && item.excludedRoles?.includes(user.role)) return false;
          const isOwnerMenu = [
            CUSTOMER_ROUTES.TENANT_SETTINGS,
            CUSTOMER_ROUTES.TENANT_MEMBERS,
            CUSTOMER_ROUTES.BILLING,
          ].includes(item.path);
          if ([CUSTOMER_ROUTES.TENANT_SETTINGS, CUSTOMER_ROUTES.BILLING].includes(item.path)
              && !isActiveTenantOwner) {
            return false;
          }
          if (isOwnerMenu && isActiveTenantOwner) return true;
          // Platform Admin bypasses permission gating within the platform menu only.
          if (user?.role === "PLATFORM_ADMIN") return true;
          // Nếu item không yêu cầu role cụ thể, ai cũng xem được
          if (
            (!item.allowedRoles || item.allowedRoles.length === 0)
            && (!item.allowedPermissions || item.allowedPermissions.length === 0)
          ) return true;
          // Nếu user hiện tại có role khớp với mảng allowedRoles
          if (user?.role && item.allowedRoles?.includes(user.role)) return true;
          if (user?.permissions?.some((permission) => item.allowedPermissions?.includes(permission))) return true;
          return false;
        }).map((item) => {
          const IconComponent = Icons[item.icon] as React.ComponentType<{ className?: string }>;
          const isActive = pathname === item.path || pathname.startsWith(`${item.path}/`);

          const linkContent = (
            <Link
              key={item.path}
              href={item.path}
              onClick={onNavigate}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200 group border border-transparent",
                !isMobile && isCollapsed ? "justify-center px-0 w-10 h-10 mx-auto" : "",
                isActive
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-300 hover:text-white hover:bg-slate-800"
              )}
            >
              <IconComponent
                className={cn(
                  "h-5 w-5 transition-transform group-hover:scale-110 shrink-0",
                  isActive ? "text-white" : "text-slate-400 group-hover:text-white"
                )}
              />
              {(isMobile || !isCollapsed) && <span className={cn("truncate", isActive ? "text-white font-semibold" : "")}>{item.title}</span>}
            </Link>
          );

          return !isMobile && isCollapsed ? (
            <Tooltip
              key={item.path}
              title={item.title}
              placement="right"
              arrow={false}
              mouseEnterDelay={0.1}
            >
              {linkContent}
            </Tooltip>
          ) : (
            linkContent
          );
        })}
      </nav>

      {/* Footer & User Profile */}
      <div className="border-t border-brand-800/40 bg-brand-950/20 flex flex-col mt-auto">
        {(isMobile || !isCollapsed) ? (
          <div className="p-4 flex items-center justify-between gap-2">
            <button
              type="button"
              className="flex min-w-0 flex-1 items-center gap-3 overflow-hidden rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
              onClick={() => {
                router.push(CUSTOMER_ROUTES.SETTINGS);
                onNavigate?.();
              }}
            >
              {user?.avatarUrl ? (
                <Image
                  src={user.avatarUrl}
                  alt={user?.displayName || "Avatar"}
                  width={40}
                  height={40}
                  unoptimized
                  className="h-10 w-10 shrink-0 rounded-full bg-slate-100 border border-brand-700 object-cover shadow-sm"
                />
              ) : (
                <div className="h-10 w-10 shrink-0 rounded-full bg-brand-800 border border-brand-700 flex items-center justify-center shadow-sm">
                  <Icons.User className="h-5 w-5 text-brand-400" aria-hidden="true" />
                </div>
              )}
              <div className="flex flex-col truncate">
                <span className="text-sm font-bold text-white truncate">{user?.displayName || user?.email}</span>
                <span className="text-xs text-slate-400 truncate">{ROLE_LABELS[user?.role || ""] || user?.role || "Người dùng"}</span>
              </div>
            </button>
            
            <Tooltip title="Cài đặt tài khoản" placement="top">
              <button
                type="button"
                aria-label="Mở cài đặt tài khoản"
                onClick={() => {
                  router.push(CUSTOMER_ROUTES.SETTINGS);
                  onNavigate?.();
                }}
                className="p-2 shrink-0 rounded-lg text-brand-400 hover:text-brand-300 hover:bg-brand-800 transition-colors cursor-pointer"
              >
                <Icons.Settings className="h-4.5 w-4.5" aria-hidden="true" />
              </button>
            </Tooltip>
          </div>
        ) : (
          <div className="p-3 flex flex-col gap-3 items-center">
            <Tooltip title={user?.displayName || user?.email} placement="right">
              {user?.avatarUrl ? (
                <Image src={user.avatarUrl} alt="Avatar" width={32} height={32} unoptimized className="h-8 w-8 rounded-full border border-brand-700 object-cover" />
              ) : (
                <div className="h-8 w-8 rounded-full bg-brand-800 border border-brand-700 flex items-center justify-center">
                  <Icons.User className="h-4 w-4 text-brand-400" aria-hidden="true" />
                </div>
              )}
            </Tooltip>
            <div className="h-[1px] w-8 bg-brand-800/60" />
            <Tooltip title="Cài đặt tài khoản" placement="right">
              <button
                type="button"
                aria-label="Mở cài đặt tài khoản"
                onClick={() => router.push(CUSTOMER_ROUTES.SETTINGS)}
                className="p-2 rounded-lg text-brand-400 hover:text-brand-300 hover:bg-brand-800 transition-colors cursor-pointer"
              >
                <Icons.Settings className="h-5 w-5" aria-hidden="true" />
              </button>
            </Tooltip>
          </div>
        )}
        
        {(isMobile || !isCollapsed) && (
          <div className="pb-3 text-[10px] text-brand-500/60 text-center whitespace-nowrap overflow-hidden">
            &copy; 2026 {APP_NAME}. All rights reserved.
          </div>
        )}
      </div>
    </aside>
  );
}
