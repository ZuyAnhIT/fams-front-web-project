import { Metadata } from "next";
import ForgotPasswordForm from "@/features/customer/auth/components/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Quên mật khẩu | FAMS",
  description: "Khôi phục mật khẩu tài khoản FAMS của bạn",
};

export default function ForgotPasswordPage() {
  return (
    <main className="w-full">
      <ForgotPasswordForm />
    </main>
  );
}
