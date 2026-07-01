import type { Metadata } from "next";
import { RegisterForm } from "@/features/customer/auth/components";

export const metadata: Metadata = {
  title: "Đăng ký | FAMS",
  description: "Đăng ký tài khoản hệ thống quản lý chấm công thực địa FAMS",
};

/**
 * RegisterPage - Trang đăng ký hệ thống.
 * Route: /register
 *
 * Theo cấu trúc TAILIEU.md:
 * - Page chỉ làm nhiệm vụ gọi component chính từ features/auth.
 * - Logic, UI form nằm trong features/auth/components/RegisterForm.
 */
export default function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <RegisterForm />
    </main>
  );
}
