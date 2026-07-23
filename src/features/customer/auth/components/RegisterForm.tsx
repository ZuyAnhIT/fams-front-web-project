"use client";
import { resolvePostLoginRoute } from "@/utils/route.util";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { App, Input } from "antd";
import FormInput from "@/components/forms/FormInput";

import { useState } from "react";
import BaseButton from "@/components/ui/BaseButton";
import { registerSchema, type RegisterFormData } from "@/features/customer/auth/schemas/auth.schema";
import { useRegister } from "@/features/customer/auth/hooks/use-auth";
import { useFirebasePhoneAuth } from "@/features/customer/auth/hooks/use-firebase-phone-auth";
import { mapFirebasePhoneError, toE164 } from "@/features/customer/auth/utils/firebase-phone.util";
import { useAuthStore } from "@/stores/auth.store";
import { ROUTES } from "@/constants/routes";
import { authService } from "@/features/customer/auth/services/auth.service";
import { authTokenService } from "@/services/auth-token.service";
import { authMapper } from "@/features/customer/auth/utils/auth.mapper";

/**
 * RegisterForm - Form đăng ký tài khoản hệ thống FAMS.
 *
 * Giao diện phong cách Dark Glassmorphism đồng nhất với trang đăng nhập.
 * Có tích hợp bộ đo độ mạnh mật khẩu theo thời gian thực.
 *
 * Đăng ký chỉ bằng số điện thoại (backlog #2, docs/BACKLOG.md) bắt buộc phải có
 * Firebase ID token đã xác thực OTP thành công (RegisterService trên backend từ
 * chối request phone-only không kèm token này) — nên khi phát hiện input là số
 * điện thoại, form chuyển qua bước xác thực OTP bằng Firebase TRƯỚC khi thực sự
 * gọi API đăng ký, thay vì đăng ký xong mới yêu cầu xác thực như luồng email.
 */
const RECAPTCHA_CONTAINER_ID = "recaptcha-container-register";

export default function RegisterForm() {
  const router = useRouter();
  const { message } = App.useApp();

  // State quản lý luồng UI
  const [step, setStep] = useState<"register" | "phone_otp" | "waiting_email">("register");
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [otpValue, setOtpValue] = useState("");

  const {
    control,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: "onChange",
    defaultValues: {
      fullName: "",
      emailOrPhone: "",
      password: "",
      confirmPassword: "",
    },
  });


  const { mutateAsync: registerMutation, isPending: isRegistering } = useRegister();
  const { sendCode, confirmCode, isSending, isConfirming } = useFirebasePhoneAuth(RECAPTCHA_CONTAINER_ID);
  const setAuth = useAuthStore((state) => state.setAuth);

  const completePhoneRegistration = async (firebaseIdToken: string) => {
    const data = getValues();
    const formattedPhone = toE164(data.emailOrPhone);

    const response = await registerMutation({
      displayName: data.fullName,
      password: data.password,
      phone: formattedPhone,
      firebaseIdToken,
    });

    if (response.accessToken && response.refreshToken) {
      authTokenService.setAccessToken(response.accessToken);
      authTokenService.setRefreshToken(response.refreshToken);

      const profile = await authService.getProfile();
      const authUser = authMapper.toAuthUser(profile, response.accessToken);

      setAuth(authUser, response.accessToken, response.refreshToken);
      message.success("Đăng ký và đăng nhập thành công!");
      router.push(resolvePostLoginRoute(authUser));
    } else {
      message.success("Đăng ký thành công!");
      router.push(`${ROUTES.LOGIN_PHONE}?phone=${encodeURIComponent(formattedPhone)}`);
    }
  };

  const onSubmit = async (data: RegisterFormData) => {
    const isEmail = data.emailOrPhone.includes("@");

    if (!isEmail) {
      // Đăng ký bằng SĐT: phải xác thực Firebase OTP trước khi gọi API đăng ký
      try {
        await sendCode(toE164(data.emailOrPhone));
        setOtpValue("");
        setStep("phone_otp");
        message.success("Mã OTP đã được gửi đến số điện thoại của bạn!");
      } catch (error: unknown) {
        message.error(mapFirebasePhoneError(error));
      }
      return;
    }

    try {
      const response = await registerMutation({
        displayName: data.fullName,
        password: data.password,
        email: data.emailOrPhone,
      });

      if (response.emailVerificationRequired) {
        // Đăng ký bằng Email: Yêu cầu xác thực
        setRegisteredEmail(data.emailOrPhone);
        setStep("waiting_email");
        message.success("Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản.");
      } else {
        message.success("Đăng ký thành công!");
        router.push(`${ROUTES.LOGIN}?email=${encodeURIComponent(data.emailOrPhone)}`);
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      // Backend error format
      const errorMessage = error.response?.data?.message || "Đăng ký không thành công. Vui lòng thử lại.";
      message.error(errorMessage);
    }
  };

  const onVerifyPhoneOtp = async () => {
    if (otpValue.length !== 6) {
      message.error("Vui lòng nhập đủ 6 chữ số OTP");
      return;
    }
    try {
      const firebaseIdToken = await confirmCode(otpValue);
      await completePhoneRegistration(firebaseIdToken);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      if (error?.code?.startsWith?.("auth/")) {
        message.error(mapFirebasePhoneError(error));
      } else {
        const errorMessage = error.response?.data?.message || "Đăng ký không thành công. Vui lòng thử lại.";
        message.error(errorMessage);
      }
    }
  };

  return (
    <div className="w-full">
      {/* Container vô hình cho reCAPTCHA của Firebase */}
      <div id={RECAPTCHA_CONTAINER_ID} />

      <div className="bg-white">
        {/* Tiêu đề */}
        <h1 className="mb-8 text-3xl font-bold text-slate-900 tracking-tight">
          Đăng ký
        </h1>

        {step === "waiting_email" ? (
          <div className="flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-300">
            {/* Email Icon */}
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>

            <h2 className="mb-4 text-2xl font-bold text-slate-900">Xác thực Email</h2>

            <p className="mb-4 text-base text-slate-600">
              Chúng tôi đã gửi link kích hoạt đến email<br />
              <strong className="mt-2 block text-lg tracking-wide text-slate-900">{registeredEmail}</strong>
            </p>

            <p className="mb-8 text-base leading-relaxed text-slate-500">
              Vui lòng kiểm tra hòm thư (bao gồm cả mục Spam) và nhấn vào link bên trong để xác thực. Sau khi xác thực xong, hãy nhấn nút bên dưới.
            </p>

            <BaseButton
              type="primary"
              size="large"
              block
              onClick={() => {
                router.push(`${ROUTES.LOGIN}?email=${encodeURIComponent(registeredEmail)}`);
              }}
              className="mt-2 font-bold !bg-blue-600 !text-white hover:!bg-blue-700 !border-0 shadow-lg shadow-blue-500/25 h-12 rounded-xl transition-all"
            >
              Đi tới Đăng nhập
            </BaseButton>

            <p className="mt-8 text-sm text-slate-500">
              Chưa nhận được email?{" "}
              <span
                className="cursor-pointer font-bold !text-blue-600 hover:!text-blue-700 transition-colors"
                onClick={() => message.info("Chức năng gửi lại email sẽ được cập nhật sau.")}
              >
                Gửi lại email
              </span>
            </p>
          </div>
        ) : step === "phone_otp" ? (
          <div className="animate-fade-in">
            <div className="mb-6 rounded-xl bg-brand-50 border border-brand-100 p-4">
              <p className="text-sm text-slate-600 text-center">
                Mã OTP đã được gửi đến{" "}
                <span className="font-bold text-slate-900">
                  {toE164(getValues("emailOrPhone"))}
                </span>
              </p>
            </div>

            <div className="mb-6">
              <label className="mb-3 block text-[15px] font-semibold tracking-wide text-slate-700 text-center">
                Nhập mã xác thực
              </label>
              <div className="flex justify-center otp-container">
                <Input.OTP
                  length={6}
                  value={otpValue}
                  onChange={(val) => setOtpValue(val)}
                  size="large"
                  variant="outlined"
                  className="[&_input]:!bg-white [&_input]:!text-slate-900 [&_input]:!border-slate-300 [&_input:focus]:!border-brand-500 [&_input:hover]:!border-brand-400"
                />
              </div>
            </div>

            <BaseButton
              type="primary"
              onClick={onVerifyPhoneOtp}
              loading={isConfirming || isRegistering}
              block
              size="large"
              disabled={otpValue.length !== 6}
              className="mt-2 font-bold !bg-blue-600 !text-white hover:!bg-blue-700 !border-0 shadow-lg shadow-blue-500/25 h-12 rounded-xl transition-all"
            >
              Xác nhận & Đăng ký
            </BaseButton>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setStep("register")}
                className="text-sm font-medium text-slate-500 hover:text-brand-600 transition-colors cursor-pointer"
              >
                ← Đổi số điện thoại
              </button>
            </div>
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
              required
            />

            {/* Email hoặc số điện thoại */}
            <FormInput
              control={control}
              name="emailOrPhone"
              label="Email hoặc số điện thoại"
              placeholder="Nhập email hoặc số điện thoại"
              id="register-email-phone"
              error={errors.emailOrPhone}
              required
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
              required
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
              required
            />

            {/* Nút đăng ký */}
            <BaseButton
              type="primary"
              htmlType="submit"
              loading={isSubmitting || isSending}
              block
              size="large"
              className="mt-2 font-bold !bg-blue-600 !text-white hover:!bg-blue-700 !border-0 shadow-lg shadow-blue-500/25 h-12 rounded-xl transition-all"
            >
              Đăng ký
            </BaseButton>
            <div className="text-center text-sm font-medium text-slate-500">
              Đã có tài khoản?{" "}
              <Link
                href={ROUTES.LOGIN}
                className="font-bold !text-blue-600 hover:!text-blue-700 transition-colors"
              >
                Đăng nhập
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
