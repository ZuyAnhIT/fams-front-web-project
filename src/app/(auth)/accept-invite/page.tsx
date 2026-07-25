"use client";
import { resolvePostLoginRoute } from "@/utils/route.util";

import { useSearchParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Checkbox, message } from "antd";
import { useAcceptInvitation, useValidateInvitation } from "@/features/customer/employee/hooks/use-employee";
import FormInput from "@/components/forms/FormInput";
import BaseButton from "@/components/ui/BaseButton";
import { Suspense, useEffect } from "react";
import { APP_NAME } from "@/constants/app";
import { useAuthStore } from "@/stores/auth.store";
import { ROUTES } from "@/constants/routes";
import { authService } from "@/features/customer/auth/services/auth.service";
import { authTokenService } from "@/services/auth-token.service";
import { authMapper } from "@/features/customer/auth/utils/auth.mapper";
import { rolePermissionService } from "@/features/admin/role-permission/services/role-permission.service";
import type { InvitationType } from "@/features/customer/employee/types/employee.type";

const acceptSchema = z.object({
  isExistingUser: z.boolean().default(false),
  linkExistingPhone: z.boolean().default(false),
  password: z.string().optional(),
  confirmPassword: z.string().optional(),
  existingPhone: z.string().optional(),
  existingPassword: z.string().optional(),
}).refine((data) => {
  if (!data.isExistingUser && !data.linkExistingPhone) {
    if (!data.password || data.password.length < 8) return false;
  }
  return true;
}, {
  message: "Mật khẩu phải có ít nhất 8 ký tự",
  path: ["password"],
}).refine((data) => {
  if (!data.isExistingUser && !data.linkExistingPhone) {
    if (data.password !== data.confirmPassword) return false;
  }
  return true;
}, {
  message: "Mật khẩu xác nhận không khớp",
  path: ["confirmPassword"],
}).refine((data) => {
  if (!data.linkExistingPhone) return true;
  return /^\+?[0-9]{7,15}$/.test(data.existingPhone ?? "");
}, {
  message: "Số điện thoại phải có 7–15 chữ số",
  path: ["existingPhone"],
}).refine((data) => {
  if (!data.linkExistingPhone) return true;
  return Boolean(data.existingPassword);
}, {
  message: "Vui lòng nhập mật khẩu tài khoản số điện thoại",
  path: ["existingPassword"],
});

type AcceptFormData = z.infer<typeof acceptSchema>;

function AcceptInviteForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const invitationType: InvitationType =
    searchParams.get("type") === "platform" ? "platform" : "tenant";
  const router = useRouter();
  const { mutateAsync: acceptInvitation, isPending } = useAcceptInvitation(invitationType);
  const { setAuth } = useAuthStore();

  const { data: validationData, isLoading: isValidating, error: validationError } =
    useValidateInvitation(token, invitationType);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AcceptFormData>({
    resolver: zodResolver(acceptSchema) as any,
    defaultValues: {
      isExistingUser: false,
      linkExistingPhone: false,
      password: "",
      confirmPassword: "",
      existingPhone: "",
      existingPassword: "",
    },
  });

  const isExistingUser = watch("isExistingUser");
  const linkExistingPhone = watch("linkExistingPhone");
  const appDeepLink = token
    ? `famsfrontappproject://accept-invite?type=${invitationType}&token=${encodeURIComponent(token)}`
    : null;

  useEffect(() => {
    if (validationData) {
      const isExisting = validationData.isExistingUser ?? validationData.existingUser ?? false;
      setValue("isExistingUser", isExisting);
      setValue("existingPhone", validationData.phone ?? "");
    }
  }, [validationData, setValue]);

  if (!token) {
    return (
      <div className="text-center p-8 bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl">
        <h2 className="text-xl font-bold text-rose-600 mb-2">Đường dẫn không hợp lệ</h2>
        <p className="text-slate-600">Vui lòng kiểm tra lại email hoặc liên hệ với bộ phận nhân sự.</p>
      </div>
    );
  }

  if (validationError) {
    return (
      <div className="text-center p-8 bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl">
        <h2 className="text-xl font-bold text-rose-600 mb-2">Đường dẫn không hợp lệ hoặc đã hết hạn</h2>
        <p className="text-slate-600">Vui lòng kiểm tra lại email hoặc liên hệ với bộ phận nhân sự.</p>
      </div>
    );
  }

  if (isValidating) {
    return (
      <div className="flex justify-center items-center p-12 bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  const onSubmit: any = async (data: AcceptFormData) => {
    try {
      const result = await acceptInvitation({
        token,
        password:
          data.isExistingUser || data.linkExistingPhone ? undefined : data.password,
        existingPhone: data.linkExistingPhone ? data.existingPhone : undefined,
        existingPassword: data.linkExistingPhone ? data.existingPassword : undefined,
      });

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
        router.push(resolvePostLoginRoute(authUser));
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
          <span className="text-3xl font-black text-white select-none tracking-tighter">F</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">
          {invitationType === "platform"
            ? `Gia nhập đội ngũ ${APP_NAME}`
            : `Gia nhập ${validationData?.tenantName || APP_NAME}`}
        </h1>
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 inline-block mt-2 mb-2">
          <p className="text-slate-700 text-sm font-medium">{validationData?.email}</p>
        </div>
        <p className="text-slate-500 text-sm mt-2">
          {isExistingUser
            ? "Tuyệt vời! Bạn đã có tài khoản. Bấm xác nhận để tham gia ngay."
            : linkExistingPhone
              ? "Xác thực tài khoản số điện thoại để liên kết email mời."
              : "Thiết lập mật khẩu để hoàn tất tạo tài khoản."}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {appDeepLink && (
          <a
            href={appDeepLink}
            className="block rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-center text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-100"
          >
            Mở lời mời trong ứng dụng FAMS
          </a>
        )}
        {!isExistingUser &&
          invitationType === "tenant" &&
          validationData?.isExistingPhoneUser && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
              <Checkbox
                checked={linkExistingPhone}
                onChange={(event) =>
                  setValue("linkExistingPhone", event.target.checked, {
                    shouldValidate: true,
                  })
                }
              >
                Liên kết với tài khoản số điện thoại hiện có
              </Checkbox>
              <p className="mt-1 pl-6 text-xs text-slate-600">
                Chọn để dùng chung một tài khoản, tránh tạo tài khoản email mới.
              </p>
            </div>
          )}

        {!isExistingUser && !linkExistingPhone && (
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

        {!isExistingUser && linkExistingPhone && (
          <div className="space-y-5 animate-fade-in">
            <FormInput
              control={control}
              name="existingPhone"
              label="Số điện thoại tài khoản hiện có"
              placeholder="Ví dụ: 0912345678"
              error={errors.existingPhone}
            />
            <FormInput
              control={control}
              name="existingPassword"
              label="Mật khẩu tài khoản hiện có"
              type="password"
              placeholder="Nhập mật khẩu để xác thực"
              error={errors.existingPassword}
            />
          </div>
        )}

        <BaseButton
          type="primary"
          htmlType="submit"
          loading={isPending}
          className="w-full h-11 text-base font-semibold bg-brand-600 hover:bg-brand-700 mt-6 transition-all"
        >
          {isExistingUser
            ? "Chấp nhận lời mời"
            : linkExistingPhone
              ? "Liên kết và tham gia"
              : "Kích hoạt tài khoản"}
        </BaseButton>
      </form>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <div className="relative flex w-full items-center justify-center overflow-hidden py-6">
      {/* Background decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-brand-400/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-400/20 blur-[120px] pointer-events-none" />

      <Suspense fallback={<div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />}>
        <AcceptInviteForm />
      </Suspense>
    </div>
  );
}
