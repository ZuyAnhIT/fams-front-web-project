"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth.store";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { ROUTES } from "@/constants/routes";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { isAuthenticated, isInitialized, initialize } = useAuthStore();
  const router = useRouter();

  // Khởi tạo trạng thái xác thực từ localStorage khi mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Bảo vệ route: Nếu đã khởi tạo xong mà chưa đăng nhập, đá về trang login
  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.replace(ROUTES.LOGIN);
    }
  }, [isInitialized, isAuthenticated, router]);

  // Loading state khi đang kiểm tra token hoặc đang redirect
  if (!isInitialized || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500/80 border-t-transparent shadow-[0_0_15px_rgba(37,99,235,0.3)]" />
          <p className="text-slate-400 text-sm animate-pulse">Đang xác thực thông tin...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-brand-50 text-brand-900">
      {/* Sidebar cố định */}
      <Sidebar />

      {/* Khu vực nội dung bên phải */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header trên cùng */}
        <Header />

        {/* Nội dung trang hiện tại */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
