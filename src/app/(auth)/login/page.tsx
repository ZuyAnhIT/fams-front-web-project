import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/features/customer/auth/components";

export const metadata: Metadata = {
  title: "Đăng nhập | FAMS",
  description: "Đăng nhập vào hệ thống quản lý chấm công thực địa FAMS",
};

/**
 * LoginPage - Trang đăng nhập hệ thống.
 * Route: /login
 *
 * Theo cấu trúc TAILIEU.md:
 * - Page chỉ làm nhiệm vụ gọi component chính từ features/auth.
 * - Logic, UI form nằm trong features/auth/components/LoginForm.
 */
export default function LoginPage() {
  return (
    <main className="w-full">
      <Suspense fallback={<div className="text-white text-lg">Đang tải biểu mẫu...</div>}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
