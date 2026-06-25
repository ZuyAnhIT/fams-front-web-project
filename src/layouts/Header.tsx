"use client";

import { useAuthStore } from "@/stores/auth.store";
import { LogOut, User as UserIcon, Bell, Settings, ShieldCheck } from "lucide-react";
import { message, Dropdown, type MenuProps } from "antd";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/constants/routes";
import { useLogout } from "@/features/auth/hooks/use-auth";
import { authTokenService } from "@/services/auth-token.service";

export default function Header() {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const logoutMutation = useLogout();

  const handleLogout = () => {
    const refreshToken = authTokenService.getRefreshToken();
    if (refreshToken) {
      logoutMutation.mutate({ refreshToken, deviceId: "unknown" });
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
    <header className="h-16 border-b border-brand-300/65 bg-brand-200/75 backdrop-blur-md text-brand-950 flex items-center justify-between px-6 sticky top-0 z-20 transition-all duration-300">
      {/* Tiêu đề */}
      <div>
        <h2 className="text-sm md:text-base font-semibold text-brand-950 tracking-wide select-none">
          HỆ THỐNG QUẢN LÝ FAMS
        </h2>
      </div>

      {/* Thông tin user & Đăng xuất */}
      <div className="flex items-center gap-4">
        {/* Chuông thông báo */}
        <button className="text-brand-800 hover:text-brand-950 transition-colors relative p-1.5 rounded-lg hover:bg-brand-300 cursor-pointer">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-brand-950 ring-2 ring-brand-200" />
        </button>

        {/* Thông tin user */}
        {user && (
          <Dropdown menu={{ items: userMenu }} trigger={['click']} placement="bottomRight">
            <div className="flex items-center gap-3 pl-4 border-l border-brand-300 cursor-pointer hover:bg-brand-300/30 p-1.5 rounded-lg transition-colors">
              {/* Avatar */}
              {user.avatarUrl ? (
                // Sử dụng thẻ img thay vì next/image để hỗ trợ link ảnh bất kỳ từ bên ngoài
                <img
                  src={user.avatarUrl}
                  alt={user.displayName || "Avatar"}
                  className="h-8.5 w-8.5 rounded-full bg-brand-300 border border-brand-400 object-cover"
                />
              ) : (
                <div className="h-8.5 w-8.5 rounded-full bg-brand-300 border border-brand-400 flex items-center justify-center">
                  <UserIcon className="h-4.5 w-4.5 text-brand-700" />
                </div>
              )}

              {/* Tên & vai trò */}
              <div className="hidden sm:block text-left select-none">
                <p className="text-sm font-semibold text-brand-950 leading-tight">
                  {user.displayName || user.email}
                </p>
                <p className="text-[11px] text-brand-700 font-medium">
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


