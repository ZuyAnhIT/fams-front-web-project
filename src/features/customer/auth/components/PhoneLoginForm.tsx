"use client";
import { resolvePostLoginRoute } from "@/utils/route.util";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input, App } from "antd";
import FormInput from "@/components/forms/FormInput";
import BaseButton from "@/components/ui/BaseButton";
import {
  phoneLoginSchema,
  type PhoneLoginFormData,
} from "@/features/customer/auth/schemas/auth.schema";
import { ROUTES } from "@/constants/routes";
import { APP_NAME } from "@/constants/app";
import { useVerifyOtp } from "@/features/customer/auth/hooks/use-auth";
import { useFirebasePhoneAuth } from "@/features/customer/auth/hooks/use-firebase-phone-auth";
import { mapFirebasePhoneError, toE164 } from "@/features/customer/auth/utils/firebase-phone.util";
import { authService } from "@/features/customer/auth/services/auth.service";
import { authMapper } from "@/features/customer/auth/utils/auth.mapper";
import { authTokenService } from "@/services/auth-token.service";
import { useAuthStore } from "@/stores/auth.store";
import { rolePermissionService } from "@/features/admin/role-permission/services/role-permission.service";
import { getOrCreateDeviceId } from "@/features/customer/auth/utils/auth-device.util";
import { getApiErrorBody, getApiErrorMessage } from "@/utils/api-error.util";

/**
 * PhoneLoginForm - Form đăng nhập bằng số điện thoại + OTP.
 *
 * Luồng thật (Firebase Phone Auth — backlog #2, docs/BACKLOG.md):
 * 1. Nhập số điện thoại → Firebase Client SDK gửi SMS trực tiếp (reCAPTCHA vô hình).
 * 2. Nhập mã 6 số → xác nhận với Firebase, nhận về Firebase ID token.
 * 3. Gửi ID token đó cho backend (POST /auth/otp/verify) để đổi lấy JWT của FAMS.
 *
 * Backend không có bước "gửi OTP" của riêng nó — việc gửi/kiểm tra mã SMS hoàn
 * toàn do Firebase đảm nhiệm; backend chỉ verify chữ ký của ID token đã có sẵn.
 */

const RECAPTCHA_CONTAINER_ID = "recaptcha-container-phone-login";
const RESEND_COOLDOWN_SECONDS = 60;

export default function PhoneLoginForm() {
  const router = useRouter();
  const { message } = App.useApp();

  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [otpValue, setOtpValue] = useState("");
  const [resendCountdown, setResendCountdown] = useState(0);

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

  useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = setInterval(() => {
      setResendCountdown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCountdown]);

  const formatTime = useCallback((seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }, []);

  const { sendCode, confirmCode, isSending, isConfirming } = useFirebasePhoneAuth(RECAPTCHA_CONTAINER_ID);
  const { mutateAsync: verifyOtpMutation } = useVerifyOtp();
  const { setAuth, setTotpPending } = useAuthStore();

  const handleSendOtp = async () => {
    try {
      const phone = toE164(getValues("phone"));
      await sendCode(phone);
      setResendCountdown(RESEND_COOLDOWN_SECONDS);
      setOtpValue("");
      setStep("otp");
      message.success("Mã OTP đã được gửi đến số điện thoại của bạn!");
    } catch (error: unknown) {
      message.error(mapFirebasePhoneError(error));
    }
  };

  const handleVerifyOtp = async () => {
    if (otpValue.length !== 6) {
      message.error("Vui lòng nhập đủ 6 chữ số OTP");
      return;
    }

    try {
      const firebaseIdToken = await confirmCode(otpValue);
      const response = await verifyOtpMutation({ firebaseIdToken, deviceId: getOrCreateDeviceId() });

      if (response.totpRequired && response.pendingToken) {
        setTotpPending(response.pendingToken);
        message.info("Số điện thoại đã được xác minh. Vui lòng nhập mã bảo mật 2 lớp.");
        router.push(ROUTES.LOGIN);
        return;
      }

      authTokenService.setAccessToken(response.accessToken);
      authTokenService.setRefreshToken(response.refreshToken);

      const profile = await authService.getProfile();

      let rolesResponse = undefined;
      try {
        rolesResponse = await rolePermissionService.getMyRoles();
      } catch (e) {
        console.warn("Could not fetch roles", e);
      }

      const authUser = authMapper.toAuthUser(profile, response.accessToken, rolesResponse?.data);

      setAuth(authUser, response.accessToken, response.refreshToken);
      message.success("Đăng nhập thành công!");
      router.push(resolvePostLoginRoute(authUser));
    } catch (error: unknown) {
      const firebaseCode = error && typeof error === "object" && "code" in error
        ? (error as { code?: unknown }).code
        : undefined;
      if (typeof firebaseCode === "string" && firebaseCode.startsWith("auth/")) {
        message.error(mapFirebasePhoneError(error));
      } else {
        const errorMessage = getApiErrorBody(error)?.errorCode === "INVALID_OTP"
          ? "OTP không hợp lệ hoặc số điện thoại chưa có tài khoản FAMS. Vui lòng thử lại hoặc đăng ký."
          : getApiErrorMessage(error, "Đăng nhập thất bại. Vui lòng thử lại.");
        message.error(errorMessage);
      }
    }
  };

  const handleResendOtp = () => {
    handleSendOtp();
  };

  const handleBackToPhone = () => {
    setStep("phone");
    setOtpValue("");
    setResendCountdown(0);
  };

  const canResend = resendCountdown === 0;

  return (
    <div className="w-full">
      {/* Container vô hình cho reCAPTCHA của Firebase — không hiển thị gì trừ khi Firebase yêu cầu xác minh thủ công */}
      <div id={RECAPTCHA_CONTAINER_ID} />

      <div className="bg-white">
        {/* Tiêu đề */}
        <h1 className="mb-2 text-3xl font-bold text-slate-900 tracking-tight">
          Đăng nhập {APP_NAME}
        </h1>
        <p className="mb-8 text-[15px] text-slate-500">
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
                type="primary"
                htmlType="submit"
                loading={isSending}
                block
                size="large"
                className="mt-2 font-bold !bg-brand-600 !text-white hover:opacity-90 !border-0 shadow-lg shadow-brand-600/25 h-12 rounded-xl transition-all"
              >
                {isSending ? "Đang gửi..." : "Gửi mã OTP"}
              </BaseButton>
            </form>
          </div>
        )}

        {/* ═══ BƯỚC 2: Nhập OTP ═══ */}
        {step === "otp" && (
          <div className="animate-fade-in">

            {/* Thông báo */}
            <div className="mb-6 rounded-xl bg-brand-50 border border-brand-100 p-4">
              <p className="text-sm text-slate-600 text-center">
                Mã OTP đã được gửi đến{" "}
                <span className="font-bold text-slate-900">
                  {getValues("phone")}
                </span>
              </p>
            </div>

            {/* 6 ô OTP */}
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

            {/* Nút xác nhận */}
            <BaseButton
              type="primary"
              onClick={handleVerifyOtp}
              loading={isConfirming}
              block
              size="large"
              disabled={otpValue.length !== 6}
              className="mt-2 font-bold !bg-brand-600 !text-white hover:opacity-90 !border-0 shadow-lg shadow-brand-600/25 h-12 rounded-xl transition-all"
            >
              {isConfirming ? "Đang xác thực..." : "Xác nhận đăng nhập"}
            </BaseButton>

            {/* Gửi lại OTP & quay lại */}
            <div className="mt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={handleBackToPhone}
                className="text-sm font-medium text-slate-500 hover:text-brand-600 transition-colors cursor-pointer"
              >
                ← Đổi số
              </button>

              {canResend ? (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  className="text-sm font-bold text-brand-600 hover:text-brand-700 transition-colors cursor-pointer"
                >
                  Gửi lại mã
                </button>
              ) : (
                <span className="text-sm font-medium text-slate-500">
                  Gửi lại sau {formatTime(resendCountdown)}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Divider chuyển hướng */}
        <div className="my-8 flex items-center gap-4">
          <div className="h-px flex-1 bg-slate-200" />
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            hoặc tiếp tục với
          </span>
          <div className="h-px flex-1 bg-slate-200" />
        </div>

        {/* Chuyển về đăng nhập bằng email */}
        <BaseButton
          type="default"
          size="large"
          className="!bg-white !text-slate-700 !border-slate-200 hover:!bg-slate-50 hover:!border-slate-300 !font-semibold h-11 rounded-xl shadow-sm transition-all"
          block
          onClick={() => router.push(ROUTES.LOGIN)}
        >
          Đăng nhập bằng Email
        </BaseButton>

        {/* Đăng ký */}
        <p className="mt-8 text-center text-sm font-medium text-slate-500">
          Chưa có tài khoản?{" "}
          <Link
            href={ROUTES.REGISTER}
            className="font-bold text-brand-600 hover:text-brand-700 transition-colors"
          >
            Đăng ký ngay
          </Link>
        </p>
      </div>
    </div>
  );
}
