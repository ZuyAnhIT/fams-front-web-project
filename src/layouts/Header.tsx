"use client";

import { useAuthStore } from "@/stores/auth.store";
import { LogOut, User as UserIcon, Bell, Settings, ShieldCheck } from "lucide-react";
import { App, Dropdown, type MenuProps } from "antd";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/constants/routes";
import { useLogout } from "@/features/auth/hooks/use-auth";
import { authTokenService } from "@/services/auth-token.service";

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

  const userMenu: MenuProps["items"] = [
    {
      key: "settings",
      icon: <Settings className="h-4 w-4" />,
      label: "Cài đặt tài khoản",
      onClick: () => router.push("/settings"),
    },
    {
      key: "totp",
      icon: <ShieldCheck className="h-4 w-4 text-brand-600" />,
      label: "Bảo mật 2 Lớp (TOTP)",
      onClick: () => router.push("/settings/totp"),
    },
    {
      type: "divider",
    },
    {
      key: "logout",
      icon: <LogOut className="h-4 w-4 text-rose-500" />,
      label: <span className="text-rose-500 font-medium">Đăng xuất</span>,
      onClick: handleLogout,
    },
  ];

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
        {/* Chuông thông báo */}
        <button className="text-slate-500 hover:text-brand-600 transition-colors relative p-2 rounded-xl hover:bg-slate-100 cursor-pointer active:scale-95">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
        </button>

        {/* Thông tin user */}
        {user && (
          <Dropdown menu={{ items: userMenu }} trigger={['click']} placement="bottomRight">
            <div className="flex items-center gap-3 pl-4 border-l border-slate-200 cursor-pointer hover:bg-slate-50 p-1.5 rounded-xl transition-all active:scale-95">
              {/* Avatar */}
              {user.avatarUrl ? (
                // Sử dụng thẻ img thay vì next/image để hỗ trợ link ảnh bất kỳ từ bên ngoài
                <img
                  src={user.avatarUrl}
                  alt={user.displayName || "Avatar"}
                  className="h-9 w-9 rounded-full bg-slate-100 border border-slate-200 object-cover shadow-sm"
                />
              ) : (
                <div className="h-9 w-9 rounded-full bg-brand-50 border border-brand-100 flex items-center justify-center shadow-sm">
                  <UserIcon className="h-4.5 w-4.5 text-brand-600" />
                </div>
              )}

              {/* Tên & vai trò */}
              <div className="hidden sm:block text-left select-none">
                <p className="text-sm font-bold text-slate-800 leading-tight">
                  {user.displayName || user.email}
                </p>
                <p className="text-[11px] text-brand-600 font-semibold tracking-wide">
                  {user.role || "USER"}
                </p>
              </div>
            </div>
          </Dropdown>
        )}
      </div>
    </header>
  );
}


