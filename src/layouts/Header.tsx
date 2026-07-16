"use client";

import { useAuthStore } from "@/stores/auth.store";
import { LogOut, User as UserIcon, Settings, ShieldCheck } from "lucide-react";
import { App, Dropdown, type MenuProps } from "antd";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/constants/routes";
import { useLogout } from "@/features/customer/auth/hooks/use-auth";
import { authTokenService } from "@/services/auth-token.service";
import NotificationBell from "@/features/customer/notification/components/NotificationBell";

export default function Header() {
  const { message } = App.useApp();
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const logoutMutation = useLogout();

  const handleLogout = async () => {
    if (typeof window !== "undefined") {
      (window as any).__isLoggingOut = true;
    }
    const refreshToken = authTokenService.getRefreshToken();
    if (refreshToken) {
      try {
        await logoutMutation.mutateAsync({ refreshToken, deviceId: "unknown" });
      } catch (error) {
        // Ignored
      }
    }
    logout();
    message.success("Đăng xuất thành công!");
    router.push(ROUTES.LOGIN);
  };

  return (
    <header className="h-16 border-b border-slate-200/60 bg-white/80 backdrop-blur-xl text-slate-800 flex items-center justify-between px-6 sticky top-0 z-20 transition-all duration-300 shadow-sm">
      {/* Tiêu đề */}
      <div>
        <h2 className="text-sm md:text-base font-bold text-slate-800 tracking-wide select-none">
          HỆ THỐNG QUẢN LÝ FAMS
        </h2>
      </div>

      {/* Thông tin user & Đăng xuất */}
      <div className="flex items-center gap-4">
        {/* Notification Bell */}
        <NotificationBell />

        {/* Nút đăng xuất trực tiếp */}
        <div className="flex items-center gap-2 pl-4 border-l border-slate-200">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-rose-500 hover:text-rose-600 hover:bg-rose-50 transition-colors font-semibold text-sm cursor-pointer active:scale-95 border border-transparent hover:border-rose-100"
          >
            <LogOut className="h-4.5 w-4.5" />
            <span className="hidden sm:inline">Đăng xuất</span>
          </button>
        </div>
      </div>
    </header>
  );
}


