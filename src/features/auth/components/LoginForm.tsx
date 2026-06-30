"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { App, Input } from "antd";
import { GoogleIcon, MicrosoftIcon } from "@/components/icons";
import { PhoneOutlined } from "@ant-design/icons";
import GlassCard from "@/components/ui/GlassCard";
import FormInput from "@/components/forms/FormInput";

import BaseButton from "@/components/ui/BaseButton";
import BaseCheckbox from "@/components/ui/BaseCheckbox";
import { loginSchema, type LoginFormData } from "@/features/auth/schemas/auth.schema";
import { useAuthStore } from "@/stores/auth.store";
import { useLogin, useLoginTotp, useGoogleLogin as useGoogleLoginBackend } from "@/features/auth/hooks/use-auth";
import { authService } from "@/features/auth/services/auth.service";
import { authTokenService } from "@/services/auth-token.service";
import { GoogleLogin } from "@react-oauth/google";
import { ROUTES } from "@/constants/routes";
import { APP_NAME } from "@/constants/app";
import { type AuthUser } from "@/features/auth/types/auth.type";
import { authMapper } from "@/features/auth/utils/auth.mapper";
import { rolePermissionService } from "@/features/role-permission/services/role-permission.service";

const totpSchema = z.object({
  code: z.string()
    .length(6, "Mã xác thực phải gồm 6 chữ số")
    .regex(/^\d+$/, "Mã xác thực chỉ chứa số"),
});

/**
 * LoginForm - Form đăng nhập chính của hệ thống.
 *
 * Sử dụng:
 * - react-hook-form + zod để validate
 * - Base UI Components (BaseButton, BaseInput, BaseInputPassword, BaseCheckbox)
 * - Hỗ trợ đăng nhập bằng email/password và social login (Facebook, Google, Microsoft)
 */
export default function LoginForm() {
  const { message } = App.useApp();
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailQuery = searchParams.get("email");
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
      email: "",
      password: "",
          },
  });

  // Tự động điền email vừa đăng ký thành công
  useEffect(() => {
    if (emailQuery) {
      setValue("email", decodeURIComponent(emailQuery));
    }
  }, [emailQuery, setValue]);

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

  const onSubmit = async (data: LoginFormData) => {
    try {
      const response = await loginMutation({
        email: data.email,
        password: data.password,
              });

      if (response.totpRequired && response.pendingToken) {
        setTotpPending(response.pendingToken);
        message.info("Vui lòng nhập mã xác thực 2 lớp (TOTP)");
        return;
      }

      // 1. Set tokens temporarily to allow API client to use them for /me
      authTokenService.setAccessToken(response.accessToken);
      authTokenService.setRefreshToken(response.refreshToken);

      // 2. Fetch actual profile
      const profile = await authService.getProfile();
      
      let rolesResponse = undefined;
      try {
        rolesResponse = await rolePermissionService.getMyRoles();
      } catch (e) {
        console.warn("Could not fetch roles", e);
      }

      const authUser = authMapper.toAuthUser(profile, response.accessToken, rolesResponse?.data);

      // 3. Save to Zustand store
      setAuth(authUser, response.accessToken, response.refreshToken);
      message.success("Đăng nhập thành công!");
      router.push(ROUTES.DASHBOARD);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      // Backend error response format
      let errorMessage = error.response?.data?.message || "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.";
      if (errorMessage.includes("has not been verified")) {
        errorMessage = "Bạn chưa xác nhận email. Vui lòng kiểm tra hòm thư và bấm vào link xác thực!";
      }
      message.error(errorMessage);
    }
  };

  const onTotpSubmit = async (data: { code: string }) => {
    try {
      if (!pendingToken) return;
      const response = await loginTotpMutation({ pendingToken, code: data.code });

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
      clearTotpPending();
      message.success("Đăng nhập thành công!");
      router.push(ROUTES.DASHBOARD);
    } catch (error: any) {
      message.error("Mã xác thực không chính xác hoặc đã hết hạn.");
    }
  };

  const { mutateAsync: googleLoginMutation } = useGoogleLoginBackend();

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      const idToken = credentialResponse.credential;
      if (!idToken) throw new Error("Không nhận được token từ Google");

      const response = await googleLoginMutation({ idToken });

      // 1. Set tokens temporarily
      authTokenService.setAccessToken(response.accessToken);
      authTokenService.setRefreshToken(response.refreshToken);

      // 2. Fetch actual profile
      const profile = await authService.getProfile();
      
      let rolesResponse = undefined;
      try {
        rolesResponse = await rolePermissionService.getMyRoles();
      } catch (e) {
        console.warn("Could not fetch roles", e);
      }

      const authUser = authMapper.toAuthUser(profile, response.accessToken, rolesResponse?.data);

      // 3. Save to Zustand store
      setAuth(authUser, response.accessToken, response.refreshToken);

      message.success("Đăng nhập bằng Google thành công!");
      router.push(ROUTES.DASHBOARD);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Đăng nhập Google thất bại.";
      message.error(errorMessage);
    }
  };


  return (
    <div className="w-full max-w-[450px]">
      {/* Card chính */}
      <GlassCard>
        {/* Logo */}
        <div className="mb-6 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-dashed border-blue-500/60 bg-blue-500/10 shadow-[0_0_20px_rgba(37,99,235,0.2)]">
            <span className="text-4xl font-extrabold text-white">Q</span>
          </div>
        </div>

        {/* Tiêu đề */}
        <h1 className="mb-8 text-center text-2xl font-semibold text-white">
          {isTotpPending ? "Xác thực 2 Lớp" : `Chào mừng tới ${APP_NAME}!`}
        </h1>

        {/* Luồng đăng nhập hoặc nhập OTP */}
        {isTotpPending ? (
          <form onSubmit={handleTotpSubmit(onTotpSubmit)} className="space-y-6 animate-fade-in">
            <p className="text-center text-sm text-gray-300">
              Vui lòng mở ứng dụng Authenticator và nhập mã 6 số.
            </p>
            <div className="flex flex-col items-center justify-center space-y-2">
              <label className="text-[15px] font-medium tracking-wide text-gray-200">Mã xác thực</label>
              <Controller
                name="code"
                control={totpControl}
                render={({ field }) => (
                  <Input.OTP
                    {...field}
                    length={6}
                    size="large"
                    status={totpErrors.code ? "error" : undefined}
                    className="mt-2 flex justify-center w-full [&_input]:!bg-white/10 [&_input]:!text-white [&_input]:!border-gray-500 [&_input:focus]:!border-blue-500"
                  />
                )}
              />
              {totpErrors.code && (
                <p className="text-xs text-red-400 mt-1">{totpErrors.code.message}</p>
              )}
            </div>
            <BaseButton
              type="primary"
              htmlType="submit"
              loading={isTotpSubmitting}
              block
              size="large"
              className="mt-6 font-semibold"
            >
              Xác nhận
            </BaseButton>
            <div className="text-center mt-4">
              <button
                type="button"
                onClick={clearTotpPending}
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Quay lại đăng nhập
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Email */}
            <FormInput
              control={control}
              name="email"
              label="Email"
              placeholder="Nhập địa chỉ email"
              id="login-email"
              error={errors.email}
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
            />

            {/* Ghi nhớ & Quên mật khẩu */}
            <div className="flex items-center justify-between">
              <Link
                href={ROUTES.FORGOT_PASSWORD}
                className="text-sm font-semibold text-white hover:text-gray-300 transition-colors"
              >
                Quên mật khẩu?
              </Link>
            </div>

            {/* Nút đăng nhập */}
            <BaseButton
              customVariant="auth"
              htmlType="submit"
              loading={isSubmitting}
              block
              size="large"
            >
              Đăng nhập
            </BaseButton>
          </form>
        )}

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

        {/* Divider */}
        <div className="mt-7 mb-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-gray-600" />
          <span className="text-xs text-gray-500 uppercase tracking-wider">hoặc</span>
          <div className="h-px flex-1 bg-gray-600" />
        </div>

        {/* Social Login Buttons */}
        <div className="space-y-4">
          <BaseButton
            type="default"
            icon={<PhoneOutlined />}
            size="large"
            className="!bg-white/15 !text-white !border-white/20 hover:!bg-white/25 hover:!border-white/30 !font-medium"
            block
            onClick={() => router.push(ROUTES.LOGIN_PHONE)}
          >
            Đăng nhập bằng Số điện thoại
          </BaseButton>

          <div className="flex justify-center w-full [&>div]:w-full [&>div>div]:!w-full">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => message.error("Đăng nhập Google thất bại.")}
              theme="outline"
              size="large"
              text="signin_with"
              logo_alignment="center"
            />
          </div>
        </div>
      </GlassCard>
    </div>
  );
}


