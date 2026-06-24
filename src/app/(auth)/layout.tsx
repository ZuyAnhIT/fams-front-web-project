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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden">
      {/* Ảnh nền núi B&W */}
      <Image
        src="/BGR_LOGIN.png"
        alt="Background"
        fill
        className="object-cover"
        priority
      />

      {/* Overlay tối nhẹ và làm mờ nền nhẹ để tăng contrast mà không bị đục */}
      <div className="absolute inset-0 bg-slate-950/10 backdrop-blur-[3px] transition-all duration-300" />

      {/* Nội dung chính */}
      <div className="relative z-10 w-full px-4">
        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""}>
          {children}
        </GoogleOAuthProvider>
      </div>
    </div>
  );
}