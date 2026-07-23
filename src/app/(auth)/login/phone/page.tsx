import type { Metadata } from "next";
import { PhoneLoginForm } from "@/features/customer/auth/components";

export const metadata: Metadata = {
  title: "Đăng nhập bằng SĐT | FAMS",
  description:
    "Đăng nhập vào hệ thống FAMS bằng số điện thoại và mã OTP",
};

/**
 * PhoneLoginPage - Trang đăng nhập bằng số điện thoại + OTP.
 * Route: /login/phone
 *
 * Theo cấu trúc TAILIEU.md:
 * - Page chỉ làm nhiệm vụ gọi component chính từ features/auth.
 * - Logic, UI form nằm trong features/auth/components/PhoneLoginForm.
 */
export default function PhoneLoginPage() {
  return (
    <main className="w-full">
      <PhoneLoginForm />
    </main>
  );
}
