"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { App, Input } from "antd";
import { isAxiosError } from "axios";
import FormInput from "@/components/forms/FormInput";
import BaseButton from "@/components/ui/BaseButton";
import {
  registerSchema,
  type RegisterFormData,
} from "@/features/customer/auth/schemas/auth.schema";
import {
  useRegister,
  useResendVerification,
  useSendRegistrationOtp,
} from "@/features/customer/auth/hooks/use-auth";
import { toE164 } from "@/features/customer/auth/utils/firebase-phone.util";
import { getOrCreateDeviceId } from "@/features/customer/auth/utils/auth-device.util";
import { ROUTES } from "@/constants/routes";

type RegisterStep = "register" | "phone_otp" | "waiting_email";

const OTP_LIFETIME_SECONDS = 5 * 60;
const RESEND_COOLDOWN_SECONDS = 60;

interface BackendErrorBody {
  message?: string;
  userMessage?: string;
  errorCode?: string;
  data?: Record<string, string> | null;
}

function getErrorBody(error: unknown): BackendErrorBody | undefined {
  if (!isAxiosError<BackendErrorBody>(error)) return undefined;
  return error.response?.data;
}

function formatCountdown(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${remainder.toString().padStart(2, "0")}`;
}

/** Đăng ký email hoặc phone theo đúng contract backend trong docs/api/auth-api.md. */
export default function RegisterForm() {
  const router = useRouter();
  const { message } = App.useApp();
  const [step, setStep] = useState<RegisterStep>("register");
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [pendingPhone, setPendingPhone] = useState("");
  const [otpValue, setOtpValue] = useState("");
  const [otpError, setOtpError] = useState("");
  const [otpLifetime, setOtpLifetime] = useState(0);
  const [resendCooldown, setResendCooldown] = useState(0);

  const {
    control,
    handleSubmit,
    getValues,
    setError,
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

  const { mutateAsync: register, isPending: isRegistering } = useRegister();
  const { mutateAsync: sendRegistrationOtp, isPending: isSendingOtp } = useSendRegistrationOtp();
  const { mutateAsync: resendVerification, isPending: isResendingEmail } = useResendVerification();

  useEffect(() => {
    if (otpLifetime <= 0 && resendCooldown <= 0) return;
    const timer = window.setInterval(() => {
      setOtpLifetime((value) => Math.max(0, value - 1));
      setResendCooldown((value) => Math.max(0, value - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [otpLifetime, resendCooldown]);

  const showBackendError = (error: unknown, fallback: string) => {
    const body = getErrorBody(error);
    message.error(body?.userMessage || body?.message || fallback);
    return body;
  };

  const requestPhoneOtp = async (phone: string) => {
    try {
      await sendRegistrationOtp({ phone });
      setPendingPhone(phone);
      setOtpValue("");
      setOtpError("");
      setOtpLifetime(OTP_LIFETIME_SECONDS);
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
      setStep("phone_otp");
      message.success("Mã OTP đã được gửi đến số điện thoại của bạn.");
    } catch (error: unknown) {
      const body = showBackendError(error, "Không thể gửi mã OTP. Vui lòng thử lại.");
      if (body?.data?.phone) {
        setError("emailOrPhone", { type: "server", message: body.data.phone });
      }
    }
  };

  const onSubmit = async (data: RegisterFormData) => {
    const identifier = data.emailOrPhone.trim();
    const isEmail = identifier.includes("@");

    if (!isEmail) {
      await requestPhoneOtp(toE164(identifier));
      return;
    }

    const email = identifier.toLowerCase();
    try {
      const response = await register({
        displayName: data.fullName.trim(),
        password: data.password,
        email,
        deviceId: getOrCreateDeviceId(),
      });
      setRegisteredEmail(email);
      setStep(response.emailVerificationRequired ? "waiting_email" : "register");

      if (response.emailVerificationRequired) {
        message.success("Đăng ký thành công. Vui lòng kiểm tra email để xác thực tài khoản.");
      } else {
        message.success("Đăng ký thành công.");
        router.push(`${ROUTES.LOGIN}?identifier=${encodeURIComponent(email)}`);
      }
    } catch (error: unknown) {
      const body = showBackendError(error, "Đăng ký không thành công. Vui lòng thử lại.");
      if (body?.data?.displayName) setError("fullName", { type: "server", message: body.data.displayName });
      if (body?.data?.email) setError("emailOrPhone", { type: "server", message: body.data.email });
      if (body?.data?.password) setError("password", { type: "server", message: body.data.password });
    }
  };

  const onVerifyPhoneOtp = async () => {
    if (otpValue.length !== 6) {
      setOtpError("Vui lòng nhập đủ 6 chữ số OTP.");
      return;
    }
    if (otpLifetime === 0) {
      setOtpError("Mã OTP đã hết hạn. Vui lòng gửi lại mã mới.");
      return;
    }

    const data = getValues();
    try {
      await register({
        displayName: data.fullName.trim(),
        password: data.password,
        phone: pendingPhone,
        otpCode: otpValue,
        deviceId: getOrCreateDeviceId(),
      });
      message.success("Đăng ký thành công. Bạn có thể đăng nhập ngay bây giờ.");
      router.push(`${ROUTES.LOGIN}?identifier=${encodeURIComponent(pendingPhone)}`);
    } catch (error: unknown) {
      const body = getErrorBody(error);
      const errorMessage = body?.message || body?.userMessage || "Mã OTP không đúng hoặc đã hết hạn.";
      setOtpError(errorMessage);
      message.error(errorMessage);
    }
  };

  const onResendEmail = async () => {
    try {
      await resendVerification({ email: registeredEmail });
      message.success("Nếu tài khoản hợp lệ, email xác thực mới đã được gửi.");
    } catch (error: unknown) {
      showBackendError(error, "Không thể gửi lại email xác thực. Vui lòng thử lại.");
    }
  };

  return (
    <div className="w-full">
      <div className="bg-white">
        <h1 className="mb-8 text-3xl font-bold tracking-tight text-slate-900">Đăng ký</h1>

        {step === "waiting_email" ? (
          <div className="flex flex-col items-center justify-center text-center animate-fade-in">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 text-blue-600" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="mb-4 text-2xl font-bold text-slate-900">Kiểm tra email</h2>
            <p className="mb-4 text-base text-slate-600">
              Link xác thực đã được gửi đến
              <strong className="mt-2 block text-lg tracking-wide text-slate-900">{registeredEmail}</strong>
            </p>
            <p className="mb-8 text-base leading-relaxed text-slate-500">
              Link có hiệu lực 24 giờ. Vui lòng kiểm tra cả thư mục Spam rồi xác thực trước khi đăng nhập.
            </p>
            <BaseButton
              type="primary"
              size="large"
              block
              onClick={() => router.push(`${ROUTES.LOGIN}?identifier=${encodeURIComponent(registeredEmail)}`)}
              className="h-12 !border-0 !bg-blue-600 !font-bold !text-white hover:!bg-blue-700"
            >
              Đi tới đăng nhập
            </BaseButton>
            <BaseButton
              type="link"
              onClick={onResendEmail}
              loading={isResendingEmail}
              className="mt-4 !text-blue-600"
            >
              Gửi lại email xác thực
            </BaseButton>
          </div>
        ) : step === "phone_otp" ? (
          <div className="animate-fade-in">
            <div className="mb-6 rounded-xl border border-blue-100 bg-blue-50 p-4 text-center text-sm text-slate-600">
              Mã OTP đã gửi đến <strong className="text-slate-900">{pendingPhone}</strong>.
              <span className="mt-1 block">Mã hết hạn sau {formatCountdown(otpLifetime)}.</span>
            </div>
            <label className="mb-3 block text-center text-[15px] font-semibold text-slate-700" htmlFor="register-phone-otp">
              Mã xác thực
            </label>
            <div className="otp-container mb-2 flex justify-center" id="register-phone-otp">
              <Input.OTP
                length={6}
                value={otpValue}
                onChange={(value) => {
                  setOtpValue(value);
                  setOtpError("");
                }}
                size="large"
                status={otpError ? "error" : undefined}
                className="[&_input]:!border-slate-300 [&_input]:!bg-white [&_input]:!text-slate-900"
              />
            </div>
            {otpError && <p role="alert" className="mb-4 text-center text-xs text-red-600">{otpError}</p>}
            <BaseButton
              type="primary"
              onClick={onVerifyPhoneOtp}
              loading={isRegistering}
              disabled={otpValue.length !== 6 || otpLifetime === 0}
              block
              size="large"
              className="h-12 !border-0 !bg-blue-600 !font-bold !text-white hover:!bg-blue-700"
            >
              Xác nhận và đăng ký
            </BaseButton>
            <div className="mt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep("register")}
                className="cursor-pointer text-sm font-medium text-slate-500 hover:text-blue-600"
              >
                ← Đổi số điện thoại
              </button>
              <button
                type="button"
                onClick={() => requestPhoneOtp(pendingPhone)}
                disabled={resendCooldown > 0 || isSendingOtp}
                className="cursor-pointer text-sm font-bold text-blue-600 disabled:cursor-not-allowed disabled:text-slate-400"
              >
                {resendCooldown > 0 ? `Gửi lại sau ${formatCountdown(resendCooldown)}` : "Gửi lại mã"}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <FormInput control={control} name="fullName" label="Họ và tên" placeholder="Nhập họ và tên của bạn" id="register-fullname" error={errors.fullName} required />
            <FormInput control={control} name="emailOrPhone" label="Email hoặc số điện thoại" placeholder="email@example.com hoặc 0912345678" id="register-email-phone" error={errors.emailOrPhone} required />
            <FormInput control={control} name="password" label="Mật khẩu" placeholder="Ít nhất 8 ký tự, có hoa, thường và số" type="password" id="register-password" error={errors.password} required />
            <FormInput control={control} name="confirmPassword" label="Xác nhận mật khẩu" placeholder="Nhập lại mật khẩu" type="password" id="register-confirmpassword" error={errors.confirmPassword} required />
            <BaseButton
              type="primary"
              htmlType="submit"
              loading={isSubmitting || isSendingOtp || isRegistering}
              block
              size="large"
              className="h-12 !border-0 !bg-blue-600 !font-bold !text-white hover:!bg-blue-700"
            >
              Đăng ký
            </BaseButton>
            <div className="text-center text-sm font-medium text-slate-500">
              Đã có tài khoản? <Link href={ROUTES.LOGIN} className="font-bold !text-blue-600">Đăng nhập</Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
