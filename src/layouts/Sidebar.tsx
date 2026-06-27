"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import * as Icons from "lucide-react";
import { Tooltip } from "antd";
import { cn } from "@/utils/cn";
import { APP_NAME } from "@/constants/app";
import { SIDEBAR_MENU } from "@/config/menu";
import { useAuthStore } from "@/stores/auth.store";

export default function Sidebar() {
  const pathname = usePathname();
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

      {/* Footer */}
      {!isCollapsed && (
        <div className="p-4 border-t border-brand-800/40 text-xs text-brand-500 text-center whitespace-nowrap overflow-hidden">
          &copy; 2026 {APP_NAME}. All rights reserved.
        </div>
      )}
    </aside>
  );
}
