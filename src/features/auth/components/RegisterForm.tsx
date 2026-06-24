"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { message } from "antd";
import { cn } from "@/utils/cn";
import GlassCard from "@/components/ui/GlassCard";
import FormInput from "@/components/forms/FormInput";

import { useState } from "react";
import BaseButton from "@/components/ui/BaseButton";
import { registerSchema, type RegisterFormData } from "@/features/auth/schemas/auth.schema";
import { useRegister } from "@/features/auth/hooks/use-auth";
import { useAuthStore } from "@/stores/auth.store";
import { ROUTES } from "@/constants/routes";
import { APP_NAME } from "@/constants/app";
import { authService } from "@/features/auth/services/auth.service";
import { authTokenService } from "@/services/auth-token.service";
import { authMapper } from "@/features/auth/utils/auth.mapper";

/**
 * RegisterForm - Form đăng ký tài khoản hệ thống FAMS.
 *
 * Giao diện phong cách Dark Glassmorphism đồng nhất với trang đăng nhập.
 * Có tích hợp bộ đo độ mạnh mật khẩu theo thời gian thực.
 */
export default function RegisterForm() {
  const router = useRouter();

  // State quản lý luồng UI
  const [step, setStep] = useState<"register" | "waiting_email">("register");
  const [registeredEmail, setRegisteredEmail] = useState("");

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: "onBlur",
    defaultValues: {
      fullName: "",
      emailOrPhone: "",
      password: "",
      confirmPassword: "",
    },
  });


  const { mutateAsync: registerMutation } = useRegister();
  const setAuth = useAuthStore((state) => state.setAuth);

  const onSubmit = async (data: RegisterFormData) => {
    try {
      const isEmail = data.emailOrPhone.includes("@");

      // Chuyển đổi định dạng số điện thoại (0xxx -> +84xxx) để hợp lệ với backend E.164
      let formattedPhone = undefined;
      if (!isEmail) {
        formattedPhone = data.emailOrPhone;
        if (formattedPhone.startsWith("0")) {
          formattedPhone = "+84" + formattedPhone.substring(1);
        }
      }

      const response = await registerMutation({
        displayName: data.fullName,
        password: data.password,
        email: isEmail ? data.emailOrPhone : undefined,
        phone: formattedPhone,
      });

      if (response.emailVerificationRequired) {
        // Đăng ký bằng Email: Yêu cầu xác thực
        setRegisteredEmail(data.emailOrPhone);
        setStep("waiting_email");
        message.success("Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản.");
      } else if (response.accessToken && response.refreshToken) {
        // Đăng ký bằng Phone: Tự động đăng nhập
        authTokenService.setAccessToken(response.accessToken);
        authTokenService.setRefreshToken(response.refreshToken);
        
        const profile = await authService.getProfile();
        const authUser = authMapper.toAuthUser(profile, response.accessToken);

        setAuth(authUser, response.accessToken, response.refreshToken);
        message.success("Đăng ký và đăng nhập thành công!");
        router.push(ROUTES.DASHBOARD);
      } else {
        // Fallback
        message.success("Đăng ký thành công!");
        if (!isEmail) {
          router.push(`${ROUTES.LOGIN_PHONE}?phone=${encodeURIComponent(data.emailOrPhone)}`);
        } else {
          router.push(`${ROUTES.LOGIN}?email=${encodeURIComponent(data.emailOrPhone)}`);
        }
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      // Backend error format
      const errorMessage = error.response?.data?.message || "Đăng ký không thành công. Vui lòng thử lại.";
      message.error(errorMessage);
    }
  }; return (
    <div className="w-full max-w-md">
      {/* Card chính phong cách Dark Glassmorphism */}
      <GlassCard>
        {/* Logo */}
        <div className="mb-6 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-dashed border-violet-500/60 bg-violet-500/10 shadow-[0_0_20px_rgba(124,92,252,0.2)]">
            <span className="text-4xl font-extrabold text-white">Q</span>
          </div>
        </div>

        {/* Tiêu đề */}
        <h1 className="mb-8 text-center text-2xl font-semibold text-white">
          Tạo tài khoản {APP_NAME}
        </h1>

        {step === "waiting_email" ? (
          <div className="flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-300">
            {/* Email Icon */}
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border-2 border-violet-400/40 bg-violet-500/20 text-violet-200 shadow-[0_0_30px_rgba(124,92,252,0.4)]">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>

            <h2 className="mb-4 text-2xl font-bold text-white">Xác thực Email</h2>

            <p className="mb-4 text-base text-gray-100">
              Chúng tôi đã gửi link kích hoạt đến email<br />
              <strong className="mt-2 block text-lg tracking-wide text-white">{registeredEmail}</strong>
            </p>

            <p className="mb-8 text-base leading-relaxed text-gray-200">
              Vui lòng kiểm tra hòm thư (bao gồm cả mục Spam) và nhấn vào link bên trong để xác thực. Sau khi xác thực xong, hãy nhấn nút bên dưới.
            </p>

            <BaseButton
              customVariant="auth"
              size="large"
              block
              onClick={() => {
                router.push(`${ROUTES.LOGIN}?email=${encodeURIComponent(registeredEmail)}`);
              }}
              className="w-full text-base font-semibold h-12 shadow-[0_0_15px_rgba(124,92,252,0.3)]"
            >
              Đi tới Đăng nhập
            </BaseButton>

            <p className="mt-8 text-sm text-gray-300">
              Chưa nhận được email?{" "}
              <span
                className="cursor-pointer font-semibold text-white underline hover:text-brand-300 transition-colors"
                onClick={() => message.info("Chức năng gửi lại email sẽ được cập nhật sau.")}
              >
                Gửi lại email
              </span>
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Họ và tên */}
            <FormInput
              control={control}
              name="fullName"
              label="Họ và tên"
              placeholder="Nhập họ và tên của bạn"
              id="register-fullname"
              error={errors.fullName}
            />

            {/* Email hoặc số điện thoại */}
            <FormInput
              control={control}
              name="emailOrPhone"
              label="Email hoặc số điện thoại"
              placeholder="Nhập email hoặc số điện thoại"
              id="register-email-phone"
              error={errors.emailOrPhone}
            />

            {/* Mật khẩu */}
            <FormInput
              control={control}
              name="password"
              label="Mật khẩu"
              placeholder="Tạo mật khẩu của bạn"
              type="password"
              id="register-password"
              error={errors.password}
            />

            {/* Xác nhận mật khẩu */}
            <FormInput
              control={control}
              name="confirmPassword"
              label="Xác nhận mật khẩu"
              placeholder="Nhập lại mật khẩu"
              type="password"
              id="register-confirmpassword"
              error={errors.confirmPassword}
            />

            {/* Nút đăng ký */}
            <BaseButton
              customVariant="auth"
              htmlType="submit"
              loading={isSubmitting}
              block
              size="large"
            >
              Đăng ký
            </BaseButton>
            <div className="text-center text-sm text-slate-400">
              Đã có tài khoản?{" "}
              <Link
                href={ROUTES.LOGIN}
                className="font-semibold text-white hover:text-brand-400 transition-colors"
              >
                Đăng nhập
              </Link>
            </div>
          </form>
        )}
      </GlassCard>
    </div>
  );
}
