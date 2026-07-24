"use client";
import { resolvePostLoginRoute } from "@/utils/route.util";

import { useEffect, useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { App, Input } from "antd";
import { format } from "date-fns";
import { Clock3, LockKeyhole } from "lucide-react";
import { PhoneOutlined } from "@ant-design/icons";
import { isAxiosError } from "axios";
import type { CredentialResponse } from "@react-oauth/google";
import FormInput from "@/components/forms/FormInput";

import BaseButton from "@/components/ui/BaseButton";
import { loginSchema, type LoginFormData } from "@/features/customer/auth/schemas/auth.schema";
import { useAuthStore } from "@/stores/auth.store";
import { useLogin, useLoginTotp, useGoogleLogin as useGoogleLoginBackend, useResendVerification } from "@/features/customer/auth/hooks/use-auth";
import { authService } from "@/features/customer/auth/services/auth.service";
import { authTokenService } from "@/services/auth-token.service";
import { GoogleLogin } from "@react-oauth/google";
import { ROUTES } from "@/constants/routes";
import { authMapper } from "@/features/customer/auth/utils/auth.mapper";
import { rolePermissionService } from "@/features/admin/role-permission/services/role-permission.service";
import { getOrCreateDeviceId } from "@/features/customer/auth/utils/auth-device.util";
import type { LoginResponse } from "@/features/customer/auth/types/auth.type";

const totpSchema = z.object({
  code: z.string(),
});

/**
 * LoginForm - Form đăng nhập chính của hệ thống.
 *
 * Sử dụng:
 * - react-hook-form + zod để validate
 * - Base UI Components (BaseButton, BaseInput, BaseInputPassword, BaseCheckbox)
 * - Hỗ trợ đăng nhập email/số điện thoại + mật khẩu, TOTP và Google.
 */
export default function LoginForm() {
  const { message } = App.useApp();
  const router = useRouter();
  const searchParams = useSearchParams();
  const identifierQuery = searchParams.get("identifier") || searchParams.get("email") || searchParams.get("phone");
  const [unverifiedEmail, setUnverifiedEmail] = useState("");
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [backupCode, setBackupCode] = useState("");
  const [lockedAccount, setLockedAccount] = useState<{
    identifier: string;
    unlockAt: Date | null;
  } | null>(null);
  const [clock, setClock] = useState(0);
  const { setAuth, isTotpPending, pendingToken, setTotpPending, clearTotpPending } = useAuthStore();

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: "onBlur",
    defaultValues: {
      identifier: "",
      password: "",
    },
  });

  // Tự động điền identifier vừa đăng ký thành công.
  useEffect(() => {
    if (identifierQuery) {
      setValue("identifier", identifierQuery);
    }
  }, [identifierQuery, setValue]);

  useEffect(() => {
    if (!lockedAccount?.unlockAt) return;
    const timer = window.setInterval(() => setClock(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [lockedAccount]);

  const lockRemaining = useMemo(() => {
    if (!lockedAccount?.unlockAt) return null;
    const seconds = Math.max(0, Math.ceil((lockedAccount.unlockAt.getTime() - clock) / 1000));
    return {
      seconds,
      label: `${String(Math.floor(seconds / 3600)).padStart(2, "0")}:${String(Math.floor((seconds % 3600) / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`,
    };
  }, [clock, lockedAccount]);

  // Form phụ cho TOTP
  const {
    control: totpControl,
    handleSubmit: handleTotpSubmit,
    formState: { errors: totpErrors, isSubmitting: isTotpSubmitting },
  } = useForm<{ code: string }>({
    defaultValues: { code: "" },
    resolver: zodResolver(totpSchema),
  });

  const { mutateAsync: loginMutation } = useLogin();
  const { mutateAsync: loginTotpMutation } = useLoginTotp();
  const { mutateAsync: resendVerification, isPending: isResendingVerification } = useResendVerification();

  const completeSession = async (response: LoginResponse, successMessage: string) => {
    authTokenService.setAccessToken(response.accessToken);
    authTokenService.setRefreshToken(response.refreshToken);
    const profile = await authService.getProfile();

    let rolesResponse;
    try {
      rolesResponse = await rolePermissionService.getMyRoles();
    } catch (error: unknown) {
      console.warn("Could not fetch roles", error);
    }

    const authUser = authMapper.toAuthUser(profile, response.accessToken, rolesResponse?.data);
    setAuth(authUser, response.accessToken, response.refreshToken);
    message.success(successMessage);
    router.push(resolvePostLoginRoute(authUser));
  };

  const onSubmit = async (data: LoginFormData) => {
    try {
      const response = await loginMutation({
        identifier: data.identifier.trim(),
        password: data.password,
        deviceId: getOrCreateDeviceId(),
      });

      if (response.totpRequired && response.pendingToken) {
        setTotpPending(response.pendingToken);
        message.info("Vui lòng nhập mã xác thực 2 lớp (TOTP)");
        return;
      }

      setUnverifiedEmail("");
      await completeSession(response, "Đăng nhập thành công!");
    } catch (error: unknown) {
      const status = isAxiosError(error) ? error.response?.status : undefined;
      const errorCode = isAxiosError(error) ? error.response?.data?.errorCode : undefined;
      let errorMessage = isAxiosError(error)
        ? error.response?.data?.userMessage || error.response?.data?.message || "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin."
        : "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.";

      if (status === 423) {
        // Backend embeds a raw ISO timestamp in the message (e.g. "...sau 2026-07-
        // 22T15:18:22.813563Z.") — reformat it into something readable instead of
        // showing that to the user verbatim.
        const isoMatch = errorMessage.match(/(\d{4}-\d{2}-\d{2}T[\d:.]+Z)/);
        const unlockAt = isoMatch ? new Date(isoMatch[1]) : null;
        setClock(unlockAt ? unlockAt.getTime() - 60 * 60 * 1000 : 0);
        setLockedAccount({ identifier: data.identifier.trim(), unlockAt });
        errorMessage = isoMatch
          ? `Tài khoản tạm khóa do đăng nhập sai nhiều lần. Vui lòng thử lại sau ${format(new Date(isoMatch[1]), "HH:mm dd/MM/yyyy")}.`
          : "Tài khoản tạm khóa do đăng nhập sai nhiều lần. Vui lòng thử lại sau.";
      } else if (status === 401 || errorCode === "INVALID_CREDENTIALS" || errorMessage.toLowerCase().includes("bad credentials")) {
        errorMessage = "Sai tài khoản hoặc mật khẩu.";
      } else if (errorCode === "EMAIL_NOT_VERIFIED" || errorMessage.toLowerCase().includes("not verified")) {
        errorMessage = "Email chưa được xác thực. Vui lòng kiểm tra hộp thư hoặc gửi lại email xác thực.";
        if (data.identifier.includes("@")) setUnverifiedEmail(data.identifier.trim().toLowerCase());
      }

      message.error(errorMessage);
    }
  };

  const onTotpSubmit = async (data: { code: string }) => {
    try {
      if (!pendingToken) return;
      if (!useBackupCode && !/^\d{6}$/.test(data.code)) {
        message.error("Mã Authenticator phải gồm đúng 6 chữ số.");
        return;
      }
      if (useBackupCode && !backupCode.trim()) {
        message.error("Vui lòng nhập mã dự phòng.");
        return;
      }
      const response = await loginTotpMutation({
        pendingToken,
        ...(useBackupCode ? { backupCode: backupCode.trim() } : { code: data.code }),
        deviceId: getOrCreateDeviceId(),
      });
      clearTotpPending();
      await completeSession(response, "Đăng nhập thành công!");
    } catch {
      message.error("Mã xác thực không chính xác hoặc đã hết hạn.");
    }
  };

  const { mutateAsync: googleLoginMutation } = useGoogleLoginBackend();

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    try {
      const idToken = credentialResponse.credential;
      if (!idToken) throw new Error("Không nhận được token từ Google");

      const response = await googleLoginMutation({ idToken, deviceId: getOrCreateDeviceId() });
      await completeSession(response, "Đăng nhập bằng Google thành công!");
    } catch (error: unknown) {
      const errorMessage = isAxiosError(error)
        ? error.response?.data?.userMessage || error.response?.data?.message || "Đăng nhập Google thất bại."
        : "Đăng nhập Google thất bại.";
      message.error(errorMessage);
    }
  };

  const handleResendVerification = async () => {
    try {
      await resendVerification({ email: unverifiedEmail });
      message.success("Nếu tài khoản hợp lệ, email xác thực mới đã được gửi.");
    } catch {
      message.error("Không thể gửi lại email xác thực. Vui lòng thử lại.");
    }
  };


  return (
    <div className="w-full">
      {/* Card chính */}
      <div className="bg-white">
        {/* Tiêu đề */}
        <h1 className="mb-2 text-3xl font-bold text-slate-900 tracking-tight">
          {isTotpPending ? "Xác thực 2 Lớp" : `Chào mừng trở lại!`}
        </h1>
        <p className="mb-8 text-slate-500 text-[15px]">
          {isTotpPending ? "Bảo vệ tài khoản của bạn bằng mã bảo mật" : "Vui lòng đăng nhập để tiếp tục truy cập hệ thống"}
        </p>

        {/* Luồng đăng nhập hoặc nhập OTP */}
        {lockedAccount ? (
          <div className="space-y-6 rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center" role="alert">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
              <LockKeyhole className="h-7 w-7 text-amber-700" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Tài khoản đang tạm khóa</h2>
              <p className="mt-2 text-sm text-slate-600">
                Có quá nhiều lần nhập sai mật khẩu. Khóa tự hết sau tối đa 1 giờ.
                {lockedAccount.identifier.includes("@") && " Email cảnh báo đã được gửi đến tài khoản của bạn."}
              </p>
            </div>
            {lockedAccount.unlockAt && lockRemaining && (
              <div>
                <p className="flex items-center justify-center gap-2 text-sm text-slate-600">
                  <Clock3 className="h-4 w-4" aria-hidden="true" /> Thời gian còn lại
                </p>
                <p className="mt-1 font-mono text-3xl font-bold text-amber-800">{lockRemaining.label}</p>
                <p className="mt-1 text-xs text-slate-500">
                  Mở lại lúc {format(lockedAccount.unlockAt, "HH:mm dd/MM/yyyy")}
                </p>
              </div>
            )}
            {lockedAccount.identifier.includes("@") ? (
              <Link
                href={`${ROUTES.FORGOT_PASSWORD}?email=${encodeURIComponent(lockedAccount.identifier)}`}
                className="block rounded-xl bg-blue-600 px-4 py-3 font-semibold !text-white hover:bg-blue-700"
              >
                Đặt lại mật khẩu để mở khóa ngay
              </Link>
            ) : (
              <p className="rounded-xl bg-white p-3 text-sm text-slate-600">
                Tài khoản chỉ có số điện thoại chưa thể nhận link đặt lại mật khẩu. Vui lòng chờ hết thời gian khóa.
              </p>
            )}
            <button
              type="button"
              onClick={() => setLockedAccount(null)}
              className="text-sm font-semibold text-slate-600 hover:text-blue-600"
            >
              Dùng tài khoản khác
            </button>
          </div>
        ) : isTotpPending ? (
          <form onSubmit={handleTotpSubmit(onTotpSubmit)} className="space-y-6 animate-fade-in">
            <p className="text-sm text-slate-500">
              Vui lòng mở ứng dụng Authenticator và nhập mã 6 số.
            </p>
            <div className="flex flex-col space-y-2">
              <label className="text-[15px] font-semibold tracking-wide text-slate-700">{useBackupCode ? "Mã dự phòng" : "Mã xác thực"}</label>
              {useBackupCode ? (
                <Input
                  value={backupCode}
                  onChange={(event) => setBackupCode(event.target.value)}
                  placeholder="Ví dụ: A1B2C3D4"
                  size="large"
                  autoComplete="one-time-code"
                />
              ) : (
                <Controller
                  name="code"
                  control={totpControl}
                  render={({ field }) => (
                    <Input.OTP
                      {...field}
                      length={6}
                      size="large"
                      status={totpErrors.code ? "error" : undefined}
                      className="mt-2 flex w-full [&_input]:!bg-white [&_input]:!text-slate-900 [&_input]:!border-slate-300 [&_input:focus]:!border-brand-500 [&_input:hover]:!border-brand-400"
                    />
                  )}
                />
              )}
              {!useBackupCode && totpErrors.code && (
                <p className="text-xs text-red-400 mt-1">{totpErrors.code.message}</p>
              )}
            </div>
            <BaseButton
              type="primary"
              htmlType="submit"
              loading={isTotpSubmitting}
              block
              size="large"
              className="mt-6 font-bold !bg-blue-600 !text-white hover:!bg-blue-700 !border-0 shadow-lg shadow-blue-500/25 h-12 rounded-xl transition-all"
            >
              Xác nhận
            </BaseButton>
            <div className="text-center mt-4">
              <button
                type="button"
                onClick={() => setUseBackupCode((value) => !value)}
                className="mb-3 block w-full text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                {useBackupCode ? "Dùng mã Authenticator" : "Dùng mã dự phòng"}
              </button>
              <button
                type="button"
                onClick={clearTotpPending}
                className="text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors"
              >
                Quay lại đăng nhập
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <FormInput
              control={control}
              name="identifier"
              label="Email hoặc số điện thoại"
              placeholder="email@example.com hoặc 0912345678"
              id="login-identifier"
              error={errors.identifier}
              required
            />

            {/* Mật khẩu */}
            <FormInput
              control={control}
              name="password"
              label="Mật khẩu"
              placeholder="Nhập mật khẩu"
              type="password"
              id="login-password"
              error={errors.password}
              required
            />

            {/* Quên mật khẩu */}
            <div className="flex justify-end mt-2">
              <Link
                href={ROUTES.FORGOT_PASSWORD}
                className="text-sm font-semibold !text-blue-600 hover:!text-blue-700 transition-colors"
              >
                Quên mật khẩu?
              </Link>
            </div>

            {/* Nút đăng nhập */}
            <BaseButton
              type="primary"
              htmlType="submit"
              loading={isSubmitting}
              block
              size="large"
              className="mt-2 font-bold !bg-blue-600 !text-white hover:!bg-blue-700 !border-0 shadow-lg shadow-blue-500/25 h-12 rounded-xl transition-all"
            >
              Đăng nhập
            </BaseButton>
            {unverifiedEmail && (
              <BaseButton
                type="link"
                block
                loading={isResendingVerification}
                onClick={handleResendVerification}
                className="!text-blue-600"
              >
                Gửi lại email xác thực
              </BaseButton>
            )}
          </form>
        )}

        {/* Đăng ký */}
        <p className="mt-8 text-center text-sm font-medium text-slate-500">
          Chưa có tài khoản?{" "}
          <Link
            href={ROUTES.REGISTER}
            className="font-bold !text-blue-600 hover:!text-blue-700 transition-colors"
          >
            Đăng ký ngay
          </Link>
        </p>

        {/* Divider */}
        <div className="my-8 flex items-center gap-4">
          <div className="h-px flex-1 bg-slate-200" />
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Hoặc tiếp tục với</span>
          <div className="h-px flex-1 bg-slate-200" />
        </div>

        {/* Social Login Buttons */}
        <div className="space-y-4">
          <BaseButton
            type="default"
            icon={<PhoneOutlined className="text-slate-600" />}
            size="large"
            className="!bg-white !text-slate-700 !border-slate-200 hover:!bg-slate-50 hover:!border-slate-300 !font-semibold h-11 rounded-xl shadow-sm transition-all"
            block
            onClick={() => router.push(ROUTES.LOGIN_PHONE)}
          >
            Đăng nhập nhanh bằng OTP
          </BaseButton>

          <div className="flex justify-center w-full [&>div]:w-full [&>div>div]:!w-full [&_iframe]:!w-full">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => message.error("Đăng nhập Google thất bại.")}
              theme="outline"
              size="large"
              text="continue_with"
              logo_alignment="center"
              shape="rectangular"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
