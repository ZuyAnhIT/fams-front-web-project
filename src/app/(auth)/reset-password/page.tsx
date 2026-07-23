import { Suspense } from "react";
import { Metadata } from "next";
import ResetPasswordForm from "@/features/customer/auth/components/ResetPasswordForm";

export const metadata: Metadata = {
  title: "Đặt lại mật khẩu | FAMS",
  description: "Đặt lại mật khẩu cho tài khoản của bạn",
};

export default function ResetPasswordPage() {
  return (
    <main className="w-full">
      <Suspense 
        fallback={
          <div className="text-center text-white p-4">
            Đang tải giao diện...
          </div>
        }
      >
        <ResetPasswordForm />
      </Suspense>
    </main>
  );
}
