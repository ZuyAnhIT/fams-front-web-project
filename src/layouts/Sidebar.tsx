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

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
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
  const sidebarWidthClass = !isMounted
    ? "w-64"
    : isCollapsed
      ? "w-16"
      : "w-64";

  return (
    <aside className={cn(
      "border-r border-brand-950 bg-brand-900 text-brand-100 flex flex-col h-screen sticky top-0 transition-all duration-300 ease-in-out shrink-0 overflow-hidden",
      sidebarWidthClass
    )}>
      {/* Brand Logo & Toggle */}
      <div className={cn(
        "h-16 flex items-center px-6 border-b border-brand-800/40 justify-between transition-all duration-300",
        isCollapsed ? "px-0 justify-center" : ""
      )}>
        {isCollapsed ? (
          <button
            onClick={toggleSidebar}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 font-black text-brand-950 text-lg shadow-sm hover:bg-brand-100 hover:scale-105 active:scale-95 transition-all group/logo cursor-pointer"
          >
            <span className="group-hover/logo:hidden">Q</span>
            <Icons.ChevronRight className="hidden group-hover/logo:block h-5 w-5 text-brand-950" />
          </button>
        ) : (
          <>
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 font-black text-white text-lg shadow-sm">
                Q
              </div>
              <span className="text-xl font-bold tracking-wider bg-gradient-to-r from-blue-500 to-cyan-400 bg-clip-text text-transparent truncate select-none">
                {APP_NAME}
              </span>
            </div>
            <button
              onClick={toggleSidebar}
              className="p-1.5 rounded-lg hover:bg-brand-800 text-brand-400 hover:text-brand-50 transition-colors border border-transparent hover:border-brand-700 cursor-pointer active:scale-95 shrink-0"
            >
              <Icons.ChevronLeft className="h-4.5 w-4.5" />
            </button>
          </>
        )}
      </div>

      {/* Nav Menu */}
      <nav className={cn(
        "flex-1 overflow-y-auto overflow-x-hidden py-4 space-y-1 transition-all duration-300",
        isCollapsed ? "px-2" : "px-4"
      )}>
        {SIDEBAR_MENU.filter((item) => {
          // Nếu item không yêu cầu role cụ thể, ai cũng xem được
          if (!item.allowedRoles || item.allowedRoles.length === 0) return true;
          // Nếu user hiện tại có role khớp với mảng allowedRoles
          if (user?.role && item.allowedRoles.includes(user.role)) return true;
          return false;
        }).map((item) => {
          const IconComponent = (Icons[item.icon] as React.ComponentType<{ className?: string }>) || Icons.HelpCircle;
          const isActive = pathname === item.path;

          const linkContent = (
            <Link
              key={item.path}
              href={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 group border border-transparent hover:scale-[1.02]",
                isCollapsed ? "justify-center px-0 w-10 h-10 mx-auto" : "",
                isActive
                  ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/25"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              )}
            >
              <IconComponent
                className={cn(
                  "h-5 w-5 transition-transform group-hover:scale-110 shrink-0",
                  isActive ? "text-white" : "text-slate-400 group-hover:text-white"
                )}
              />
              {!isCollapsed && <span className={cn("truncate", isActive ? "text-white font-bold" : "")}>{item.title}</span>}
            </Link>
          );

          return isCollapsed ? (
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
        {!isCollapsed ? (
          <div className="p-4 flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 overflow-hidden cursor-pointer" onClick={() => router.push(CUSTOMER_ROUTES.SETTINGS)}>
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user?.displayName || "Avatar"}
                  className="h-10 w-10 shrink-0 rounded-full bg-slate-100 border border-brand-700 object-cover shadow-sm"
                />
              ) : (
                <div className="h-10 w-10 shrink-0 rounded-full bg-brand-800 border border-brand-700 flex items-center justify-center shadow-sm">
                  <Icons.User className="h-5 w-5 text-brand-400" />
                </div>
              )}
              <div className="flex flex-col truncate">
                <span className="text-sm font-bold text-white truncate">{user?.displayName || user?.email}</span>
                <span className="text-[10px] text-brand-400 font-semibold tracking-wide truncate">{user?.role || "USER"}</span>
              </div>
            </div>
            
            <Tooltip title="Cài đặt tài khoản" placement="top">
              <button
                onClick={() => router.push(CUSTOMER_ROUTES.SETTINGS)}
                className="p-2 shrink-0 rounded-lg text-brand-400 hover:text-brand-300 hover:bg-brand-800 transition-colors cursor-pointer"
              >
                <Icons.Settings className="h-4.5 w-4.5" />
              </button>
            </Tooltip>
          </div>
        ) : (
          <div className="p-3 flex flex-col gap-3 items-center">
            <Tooltip title={user?.displayName || user?.email} placement="right">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="Avatar" className="h-8 w-8 rounded-full border border-brand-700 object-cover" />
              ) : (
                <div className="h-8 w-8 rounded-full bg-brand-800 border border-brand-700 flex items-center justify-center">
                  <Icons.User className="h-4 w-4 text-brand-400" />
                </div>
              )}
            </Tooltip>
            <div className="h-[1px] w-8 bg-brand-800/60" />
            <Tooltip title="Cài đặt tài khoản" placement="right">
              <button
                onClick={() => router.push(CUSTOMER_ROUTES.SETTINGS)}
                className="p-2 rounded-lg text-brand-400 hover:text-brand-300 hover:bg-brand-800 transition-colors cursor-pointer"
              >
                <Icons.Settings className="h-5 w-5" />
              </button>
            </Tooltip>
          </div>
        )}
        
        {!isCollapsed && (
          <div className="pb-3 text-[10px] text-brand-500/60 text-center whitespace-nowrap overflow-hidden">
            &copy; 2026 {APP_NAME}. All rights reserved.
          </div>
        )}
      </div>
    </aside>
  );
}
