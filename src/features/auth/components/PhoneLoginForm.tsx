"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input, message } from "antd";
import GlassCard from "@/components/ui/GlassCard";
import FormInput from "@/components/forms/FormInput";
import BaseButton from "@/components/ui/BaseButton";
import {
  phoneLoginSchema,
  type PhoneLoginFormData,
} from "@/features/auth/schemas/auth.schema";
import { ROUTES } from "@/constants/routes";
import { APP_NAME } from "@/constants/app";
import { useSendOtp, useVerifyOtp } from "@/features/auth/hooks/use-auth";
import { authService } from "@/features/auth/services/auth.service";
import { authMapper } from "@/features/auth/utils/auth.mapper";
import { authTokenService } from "@/services/auth-token.service";
import { useAuthStore } from "@/stores/auth.store";

/**
 * PhoneLoginForm - Form đăng nhập bằng số điện thoại + OTP.
 *
 * Luồng:
 * 1. Nhập số điện thoại → nhấn "Gửi mã OTP"
 * 2. Hiển thị 6 ô nhập OTP (Ant Design Input.OTP) với đếm ngược 5 phút
 * 3. Nhập OTP → nhấn "Xác nhận" → đăng nhập
 *
 * Thiết kế: Dark Glassmorphism đồng nhất với LoginForm.
 * Chưa kết nối backend — chỉ UI thuần.
 */

const OTP_TTL_SECONDS = 5 * 60; // 5 phút
const MAX_OTP_SENDS = 3;
const RATE_LIMIT_WINDOW_MINUTES = 10;

export default function PhoneLoginForm() {
  const router = useRouter();

  // ── State ──────────────────────────────────────────────
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [otpValue, setOtpValue] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [sendCount, setSendCount] = useState(0);

  // ── Form ───────────────────────────────────────────────
  const {
    control,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<PhoneLoginFormData>({
    resolver: zodResolver(phoneLoginSchema),
    mode: "onBlur",
    defaultValues: { phone: "" },
  });

  // ── Countdown timer ────────────────────────────────────
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const formatTime = useCallback((seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }, []);

  const { mutateAsync: sendOtpMutation, isPending: isSendingOtp } = useSendOtp();
  const { mutateAsync: verifyOtpMutation, isPending: isVerifyingOtp } = useVerifyOtp();
  const setAuth = useAuthStore((state) => state.setAuth);

  // ── Gửi OTP ────────────────────────────────────
  const handleSendOtp = async () => {
    if (sendCount >= MAX_OTP_SENDS) {
      message.warning(
        `Bạn đã gửi tối đa ${MAX_OTP_SENDS} lần trong ${RATE_LIMIT_WINDOW_MINUTES} phút. Vui lòng thử lại sau.`
      );
      return;
    }

    try {
      let phone = getValues("phone");
      if (phone.startsWith("0")) {
        phone = "+84" + phone.substring(1);
      }

      await sendOtpMutation({ phone });

      setSendCount((prev) => prev + 1);
      setCountdown(OTP_TTL_SECONDS);
      setOtpValue("");
      setStep("otp");
      message.success("Mã OTP đã được gửi đến số điện thoại của bạn!");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Gửi OTP thất bại. Vui lòng thử lại.";
      message.error(errorMessage);
    }
  };

  // ── Xác nhận OTP ────────────────────────────────
  const handleVerifyOtp = async () => {
    if (otpValue.length !== 6) {
      message.error("Vui lòng nhập đủ 6 chữ số OTP");
      return;
    }

    try {
      let phone = getValues("phone");
      if (phone.startsWith("0")) {
        phone = "+84" + phone.substring(1);
      }

      const response = await verifyOtpMutation({
        phone,
        code: otpValue,
      });

      // 1. Set tokens temporarily
      authTokenService.setAccessToken(response.accessToken);
      authTokenService.setRefreshToken(response.refreshToken);

      // 2. Fetch actual profile
      const profile = await authService.getProfile();
      const authUser = authMapper.toAuthUser(profile, response.accessToken);

      // 3. Save to Zustand store
      setAuth(authUser, response.accessToken, response.refreshToken);
      message.success("Đăng nhập thành công!");
      router.push(ROUTES.DASHBOARD);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Mã OTP không chính xác hoặc đã hết hạn.";
      message.error(errorMessage);
    }
  };

  // ── Gửi lại OTP ───────────────────────────────────────
  const handleResendOtp = () => {
    handleSendOtp();
  };

  // ── Quay lại bước nhập phone ───────────────────────────
  const handleBackToPhone = () => {
    setStep("phone");
    setOtpValue("");
    setCountdown(0);
  };

  const isOtpExpired = step === "otp" && countdown === 0;
  const canResend = sendCount < MAX_OTP_SENDS && countdown === 0;

  return (
    <div className="w-full max-w-[450px]">
      <GlassCard>
        {/* Logo */}
        <div className="mb-6 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-dashed border-violet-500/60 bg-violet-500/10 shadow-[0_0_20px_rgba(124,92,252,0.2)]">
            <span className="text-4xl font-extrabold text-white">Q</span>
          </div>
        </div>

        {/* Tiêu đề */}
        <h1 className="mb-2 text-center text-2xl font-semibold text-white">
          Đăng nhập {APP_NAME}
        </h1>
        <p className="mb-8 text-center text-sm text-gray-400">
          Đăng nhập nhanh bằng số điện thoại
        </p>

        {/* ═══ BƯỚC 1: Nhập số điện thoại ═══ */}
        {step === "phone" && (
          <div className="transition-all duration-500">
            <form
              onSubmit={handleSubmit(handleSendOtp)}
              className="space-y-6"
            >
              {/* Số điện thoại */}
              <FormInput
                control={control}
                name="phone"
                label="Số điện thoại"
                placeholder="Nhập số điện thoại (VD: 0912345678)"
                id="phone-login-input"
                error={errors.phone}
              />

              {/* Nút gửi OTP */}
              <BaseButton
                customVariant="auth"
                htmlType="submit"
                loading={isSendingOtp}
                block
                size="large"
              >
                {isSendingOtp ? "Đang gửi..." : "Gửi mã OTP"}
              </BaseButton>
            </form>
          </div>
        )}

        {/* ═══ BƯỚC 2: Nhập OTP ═══ */}
        {step === "otp" && (
          <div className="animate-fade-in">

            {/* Thông báo */}
            <div className="mb-6 rounded-xl bg-violet-500/10 border border-violet-500/20 p-4">
              <p className="text-sm text-gray-300 text-center">
                Mã OTP đã được gửi đến{" "}
                <span className="font-semibold text-white">
                  {getValues("phone")}
                </span>
              </p>
              {/* Countdown */}
              <div className="mt-3 flex items-center justify-center gap-2">
                {!isOtpExpired ? (
                  <>
                    <div className="relative h-5 w-5">
                      <svg className="h-5 w-5 -rotate-90" viewBox="0 0 20 20">
                        <circle
                          cx="10" cy="10" r="8"
                          fill="none"
                          stroke="rgba(139, 92, 246, 0.2)"
                          strokeWidth="2"
                        />
                        <circle
                          cx="10" cy="10" r="8"
                          fill="none"
                          stroke="rgb(139, 92, 246)"
                          strokeWidth="2"
                          strokeDasharray={2 * Math.PI * 8}
                          strokeDashoffset={
                            2 * Math.PI * 8 * (1 - countdown / OTP_TTL_SECONDS)
                          }
                          strokeLinecap="round"
                          className="transition-all duration-1000 ease-linear"
                        />
                      </svg>
                    </div>
                    <span className="text-sm font-mono text-violet-300 font-semibold">
                      {formatTime(countdown)}
                    </span>
                    <span className="text-xs text-gray-500">còn lại</span>
                  </>
                ) : (
                  <span className="text-sm text-red-400 font-medium">
                    ⏰ Mã OTP đã hết hạn
                  </span>
                )}
              </div>
            </div>

            {/* 6 ô OTP */}
            <div className="mb-6">
              <label className="mb-3 block text-[15px] font-medium tracking-wide text-gray-200 text-center">
                Nhập mã xác thực
              </label>
              <div className="flex justify-center otp-container">
                <Input.OTP
                  length={6}
                  value={otpValue}
                  onChange={(val) => setOtpValue(val)}
                  disabled={isOtpExpired}
                  size="large"
                  variant="outlined"
                />
              </div>
            </div>

            {/* Nút xác nhận */}
            <BaseButton
              customVariant="auth"
              onClick={handleVerifyOtp}
              loading={isVerifyingOtp}
              block
              size="large"
              disabled={otpValue.length !== 6 || isOtpExpired}
            >
              {isVerifyingOtp ? "Đang xác thực..." : "Xác nhận đăng nhập"}
            </BaseButton>

            {/* Gửi lại OTP & quay lại */}
            <div className="mt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={handleBackToPhone}
                className="text-sm text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                ← Đổi số
              </button>

              {canResend ? (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  className="text-sm font-semibold text-violet-400 hover:text-violet-300 transition-colors cursor-pointer"
                >
                  Gửi lại mã ({MAX_OTP_SENDS - sendCount} lần còn)
                </button>
              ) : (
                <span className="text-sm text-gray-500">
                  {sendCount >= MAX_OTP_SENDS
                    ? "Đã hết lượt gửi"
                    : `Gửi lại sau ${formatTime(countdown)}`}
                </span>
              )}
            </div>

            {/* Rate limit info */}
            <p className="mt-3 text-center text-xs text-gray-600">
              Tối đa {MAX_OTP_SENDS} lần gửi mã trong {RATE_LIMIT_WINDOW_MINUTES} phút
            </p>
          </div>
        )}

        {/* Divider chuyển hướng */}
        <div className="mt-7 mb-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-gray-600" />
          <span className="text-xs text-gray-500 uppercase tracking-wider">
            hoặc
          </span>
          <div className="h-px flex-1 bg-gray-600" />
        </div>

        {/* Chuyển về đăng nhập bằng email */}
        <BaseButton
          type="default"
          size="large"
          className="!bg-white/5 !text-white !border-white/15 hover:!bg-white/10 hover:!border-white/25 !font-medium"
          block
          onClick={() => router.push(ROUTES.LOGIN)}
        >
          Đăng nhập bằng Email
        </BaseButton>

        {/* Đăng ký */}
        <p className="mt-7 text-center text-sm text-gray-300">
          Chưa có tài khoản?{" "}
          <Link
            href={ROUTES.REGISTER}
            className="font-bold text-white hover:text-gray-300 transition-colors"
          >
            Đăng ký
          </Link>
        </p>
      </GlassCard>
    </div>
  );
}
