import Image from "next/image";
import { GoogleOAuthProvider } from "@react-oauth/google";

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
      <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""}>
        {/* Cột trái: Brand Panel (Ẩn trên mobile) */}
        <div className="hidden lg:flex lg:w-1/2 relative bg-brand-900 flex-col justify-between p-12 overflow-hidden">
          {/* Background Image / Pattern */}
          <div className="absolute inset-0 opacity-40">
            <Image
              src="/BGR_LOGIN.png"
              alt="FAMS Background"
              fill
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
            
            <div className="mt-12 flex items-center gap-4">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-10 w-10 rounded-full border-2 border-brand-800 bg-brand-200 overflow-hidden relative">
                    <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt={`User ${i}`} className="h-full w-full object-cover" />
                  </div>
                ))}
              </div>
              <div className="text-sm font-medium text-brand-200">
                Được tin dùng bởi <strong className="text-white">500+</strong> doanh nghiệp
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
        <div className="flex w-full lg:w-1/2 flex-col justify-center px-6 py-12 lg:px-16 xl:px-24 bg-white relative">
          <div className="mx-auto w-full max-w-[420px]">
            {/* Hiển thị logo trên mobile nếu cột trái bị ẩn */}
            <div className="mb-10 lg:hidden flex justify-center">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 shadow-xl shadow-brand-600/20">
                  <span className="text-2xl font-extrabold text-white">F</span>
                </div>
                <span className="text-2xl font-bold text-slate-900 tracking-tight">FAMS</span>
              </div>
            </div>

            {children}
          </div>
        </div>
      </GoogleOAuthProvider>
    </div>
  );
}