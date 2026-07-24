import type { Metadata } from "next";
import { Suspense } from "react";
import VerifyEmailResult from "@/features/customer/auth/components/VerifyEmailResult";

export const metadata: Metadata = {
  title: "Xác thực email | FAMS",
  description: "Kết quả xác thực email tài khoản FAMS",
};

export default function VerifyEmailPage() {
  return (
    <main className="w-full">
      <Suspense fallback={<p className="text-center text-slate-600">Đang tải...</p>}>
        <VerifyEmailResult />
      </Suspense>
    </main>
  );
}
