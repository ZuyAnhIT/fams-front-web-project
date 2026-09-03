import Image from "next/image";
import { CalendarCheck2, MapPinned, ShieldCheck } from "lucide-react";
import OptionalGoogleOAuthProvider from "@/components/providers/OptionalGoogleOAuthProvider";

/**
 * AuthLayout - Layout tối giản cho các trang xác thực (Login, Reset Password).
 * Hiển thị ảnh nền toàn màn hình với nội dung form ở giữa.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-white">
      <OptionalGoogleOAuthProvider>
        {/* Cột trái: Brand Panel (Ẩn trên mobile) */}
        <div className="hidden lg:flex lg:w-1/2 relative bg-brand-900 flex-col justify-between p-12 overflow-hidden">
          {/* Background Image / Pattern */}
          <div className="absolute inset-0 opacity-40">
            <Image
              src="/BGR_LOGIN.jpg"
              alt="FAMS Background"
              fill
              sizes="50vw"
              className="object-cover mix-blend-overlay"
              priority
            />
          </div>
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-brand-900/90 to-brand-800/80" />

          {/* Top Brand Logo */}
          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-xl shadow-white/10">
                <span className="text-2xl font-extrabold text-brand-600">F</span>
              </div>
              <span className="text-2xl font-bold text-white tracking-tight">FAMS</span>
            </div>
          </div>

          {/* Center Message */}
          <div className="relative z-10 max-w-lg mt-20">
            <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-6">
              Giải pháp quản lý nhân sự thực địa hàng đầu
            </h1>
            <p className="text-lg text-brand-100 font-medium leading-relaxed">
              Tối ưu hóa quy trình chấm công, theo dõi vị trí và quản lý lịch trình làm việc. Đơn giản, minh bạch và hiệu quả cho doanh nghiệp của bạn.
            </p>
            
            <div className="mt-10 grid gap-3 text-sm text-slate-200">
              <div className="flex items-center gap-3">
                <CalendarCheck2 className="h-5 w-5 text-blue-300" aria-hidden="true" />
                <span>Chấm công và theo dõi ca làm việc tập trung</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPinned className="h-5 w-5 text-blue-300" aria-hidden="true" />
                <span>Quản lý công trình và vùng chấm công minh bạch</span>
              </div>
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-blue-300" aria-hidden="true" />
                <span>Phân quyền theo vai trò và phạm vi công việc</span>
              </div>
            </div>
          </div>

          {/* Bottom Footer */}
          <div className="relative z-10 mt-auto pt-12">
            <p className="text-sm font-medium text-brand-300">
              © {new Date().getFullYear()} FAMS Platform. All rights reserved.
            </p>
          </div>
        </div>

        {/* Cột phải: Auth Form */}
        <div className="flex min-h-dvh w-full flex-col justify-center overflow-y-auto bg-white px-5 py-10 sm:px-8 lg:w-1/2 lg:px-16 xl:px-24">
          <div className="mx-auto w-full max-w-[420px]">
            {/* Hiển thị logo trên mobile nếu cột trái bị ẩn */}
            <div className="mb-10 lg:hidden flex justify-center">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 shadow-xl shadow-blue-600/20">
                  <span className="text-2xl font-extrabold text-white">F</span>
                </div>
                <span className="text-2xl font-bold text-slate-900 tracking-tight">FAMS</span>
              </div>
            </div>

            {children}
          </div>
        </div>
      </OptionalGoogleOAuthProvider>
    </div>
  );
}
