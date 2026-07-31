"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth.store";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { ROUTES } from "@/constants/routes";
import NotificationWatcher from "@/features/customer/notification/components/NotificationWatcher";
import MobileNav from "./MobileNav";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { isAuthenticated, isInitialized, initialize } = useAuthStore();
  const router = useRouter();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Khởi tạo trạng thái xác thực từ localStorage khi mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Switching company in another tab replaces the shared localStorage tokens/user.
  // Reload this tab immediately so its in-memory tenantId and all tenant-scoped queries
  // cannot continue using the previous company alongside the new access token.
  useEffect(() => {
    const handleAuthStorageChange = (event: StorageEvent) => {
      if (
        event.oldValue !== event.newValue &&
        (event.key === "fams_access_token" || event.key === "fams_user")
      ) {
        window.location.reload();
      }
    };

    window.addEventListener("storage", handleAuthStorageChange);
    return () => window.removeEventListener("storage", handleAuthStorageChange);
  }, []);

  // Bảo vệ route: Nếu đã khởi tạo xong mà chưa đăng nhập, đá về trang login
  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.replace(ROUTES.LOGIN);
    }
  }, [isInitialized, isAuthenticated, router]);

  // Loading state khi đang kiểm tra token hoặc đang redirect
  if (!isInitialized || !isAuthenticated) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-slate-50 text-slate-900" role="status" aria-live="polite">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" aria-hidden="true" />
          <p className="text-slate-600 text-sm">Đang xác thực thông tin...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh bg-slate-50 text-slate-900">
      <a
        href="#main-content"
        className="sr-only z-[100] rounded-md bg-white px-4 py-2 text-blue-700 shadow-lg focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Chuyển đến nội dung chính
      </a>

      {/* Sidebar cố định */}
      <Sidebar />
      <MobileNav open={isMobileNavOpen} onClose={() => setIsMobileNavOpen(false)} />

      {/* Khu vực nội dung bên phải */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header trên cùng */}
        <Header onOpenMenu={() => setIsMobileNavOpen(true)} />

        {/* Nội dung trang hiện tại */}
        <main id="main-content" tabIndex={-1} className="flex-1 p-4 sm:p-6 xl:p-8">
          {children}
        </main>
      </div>

      {/* Watcher: poll + show toast on new notifications */}
      <NotificationWatcher />
    </div>
  );
}
