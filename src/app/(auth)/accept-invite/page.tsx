"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { message, Radio } from "antd";
import { useAcceptInvitation } from "@/features/employee/hooks/use-employee";
import FormInput from "@/components/forms/FormInput";
import BaseButton from "@/components/ui/BaseButton";
import { Suspense } from "react";
import Image from "next/image";
import { APP_NAME } from "@/constants/app";
import { useAuthStore } from "@/stores/auth.store";
import { ROUTES } from "@/constants/routes";
import { authService } from "@/features/auth/services/auth.service";
import { authTokenService } from "@/services/auth-token.service";
import { authMapper } from "@/features/auth/utils/auth.mapper";
import { rolePermissionService } from "@/features/role-permission/services/role-permission.service";

const acceptSchema = z.object({
  isExistingUser: z.boolean().default(false),
  password: z.string().optional(),
  confirmPassword: z.string().optional(),
}).refine((data) => {
  if (!data.isExistingUser) {
    if (!data.password || data.password.length < 8) return false;
  }
  return true;
}, {
  message: "Mật khẩu phải có ít nhất 8 ký tự",
  path: ["password"],
}).refine((data) => {
  if (!data.isExistingUser) {
    if (data.password !== data.confirmPassword) return false;
  }
  return true;
}, {
  message: "Mật khẩu xác nhận không khớp",
  path: ["confirmPassword"],
});

type AcceptFormData = z.infer<typeof acceptSchema>;

function AcceptInviteForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const router = useRouter();
  const { mutateAsync: acceptInvitation, isPending } = useAcceptInvitation();
  const { setAuth } = useAuthStore();

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AcceptFormData>({
    resolver: zodResolver(acceptSchema),
    defaultValues: {
      isExistingUser: false,
      password: "",
      confirmPassword: "",
    },
  });

  const isExistingUser = watch("isExistingUser");

  if (!token) {
    return (
      <div className="text-center p-8 bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl">
        <h2 className="text-xl font-bold text-rose-600 mb-2">Đường dẫn không hợp lệ</h2>
        <p className="text-slate-600">Vui lòng kiểm tra lại email hoặc liên hệ với bộ phận nhân sự.</p>
      </div>
    );
  }

  const onSubmit = async (data: AcceptFormData) => {
    try {
      const payloadPassword = data.isExistingUser ? "" : (data.password || "");
      const result = await acceptInvitation({ token, password: payloadPassword });
      
      if (result.accessToken) {
        authTokenService.setAccessToken(result.accessToken);
        authTokenService.setRefreshToken(result.refreshToken || "");
        
        const profile = await authService.getProfile();
        
        let rolesResponse = undefined;
        try {
          rolesResponse = await rolePermissionService.getMyRoles();
        } catch (e) {
          console.warn("Could not fetch roles", e);
        }

        const authUser = authMapper.toAuthUser(profile, result.accessToken, rolesResponse?.data);

        setAuth(authUser, result.accessToken, result.refreshToken || "");
        message.success("Chấp nhận lời mời thành công! Đang chuyển hướng...");
        router.push(ROUTES.DASHBOARD);
      } else {
        message.success("Chấp nhận lời mời thành công! Vui lòng đăng nhập.");
        router.push(ROUTES.LOGIN);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Kích hoạt thất bại. Lời mời có thể đã hết hạn.";
      
      // Auto-fallback if the user selected "existing user" but backend requires a password
      if (isExistingUser && errorMessage.toLowerCase().includes("password is required")) {
        message.warning("Hệ thống không tìm thấy tài khoản của bạn. Vui lòng tạo mật khẩu mới nhé!");
        setValue("isExistingUser", false);
        return;
      }

      message.error(errorMessage);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white/80 backdrop-blur-xl p-8 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/20 transition-all duration-300">
      <div className="text-center mb-8">
        <div className="mx-auto w-16 h-16 bg-brand-600 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-brand-500/30">
          <span className="text-3xl font-black text-white select-none tracking-tighter">Q</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Gia nhập {APP_NAME}</h1>
        <p className="text-slate-500 text-sm">
          {isExistingUser ? "Xác nhận tham gia vào công ty" : "Thiết lập mật khẩu để hoàn tất tạo tài khoản"}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="flex justify-center mb-6">
          <Controller
            name="isExistingUser"
            control={control}
            render={({ field }) => (
              <Radio.Group 
                optionType="button" 
                buttonStyle="solid"
                value={field.value}
                onChange={field.onChange}
                className="w-full text-center flex"
              >
                <Radio.Button value={false} className="flex-1">Tạo tài khoản mới</Radio.Button>
                <Radio.Button value={true} className="flex-1">Đã có tài khoản</Radio.Button>
              </Radio.Group>
            )}
          />
        </div>

        {!isExistingUser && (
          <div className="space-y-5 animate-fade-in">
            <FormInput
              control={control}
              name="password"
              label="Mật khẩu mới"
              type="password"
              placeholder="Nhập mật khẩu (Tối thiểu 8 ký tự)"
              error={errors.password}
            />

            <FormInput
              control={control}
              name="confirmPassword"
              label="Xác nhận mật khẩu"
              type="password"
              placeholder="Nhập lại mật khẩu"
              error={errors.confirmPassword}
            />
          </div>
        )}

        <BaseButton
          type="primary"
          htmlType="submit"
          loading={isPending}
          className="w-full h-11 text-base font-semibold bg-brand-600 hover:bg-brand-700 mt-6 transition-all"
        >
          {isExistingUser ? "Chấp nhận lời mời" : "Kích hoạt tài khoản"}
        </BaseButton>
      </form>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-slate-50">
      {/* Background decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-brand-400/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-400/20 blur-[120px] pointer-events-none" />
      
      <Suspense fallback={<div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />}>
        <AcceptInviteForm />
      </Suspense>
    </div>
  );
}
