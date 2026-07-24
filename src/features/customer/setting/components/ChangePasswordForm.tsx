"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { App } from "antd";
import { useRouter } from "next/navigation";
import { isAxiosError } from "axios";
import FormInput from "@/components/forms/FormInput";
import BaseButton from "@/components/ui/BaseButton";
import { useChangePassword } from "@/features/customer/auth/hooks/use-auth";
import { changePasswordSchema, type ChangePasswordFormData } from "../schemas/setting.schema";
import { useAuthStore } from "@/stores/auth.store";
import { ROUTES } from "@/constants/routes";

export default function ChangePasswordForm() {
  const { message } = App.useApp();
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);
  const { mutateAsync: changePassword, isPending } = useChangePassword();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    mode: "onChange",
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: ChangePasswordFormData) => {
    try {
      await changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      message.success("Đổi mật khẩu thành công. Vui lòng đăng nhập lại.");
      reset();
      logout();
      router.replace(ROUTES.LOGIN);
    } catch (error: unknown) {
      const errorMessage = isAxiosError(error)
        ? error.response?.data?.userMessage || error.response?.data?.message || "Đổi mật khẩu thất bại. Mật khẩu hiện tại có thể không đúng."
        : "Đổi mật khẩu thất bại. Mật khẩu hiện tại có thể không đúng.";
      message.error(errorMessage);
    }
  };

  return (
    <div className="w-full">
      <div className="border-b border-gray-300 pb-4 mb-6">
        <h3 className="text-xl font-semibold text-brand-950">Đổi mật khẩu</h3>
        <p className="text-sm text-gray-500 mt-1">Cập nhật mật khẩu mới để bảo vệ tài khoản của bạn an toàn hơn</p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 w-full lg:max-w-3xl">
        <FormInput
          control={control}
          name="currentPassword"
          label="Mật khẩu hiện tại"
          placeholder="Nhập mật khẩu hiện tại"
          type="password"
          id="change-current-password"
          error={errors.currentPassword}
        />

        <FormInput
          control={control}
          name="newPassword"
          label="Mật khẩu mới"
          placeholder="Nhập mật khẩu mới"
          type="password"
          id="change-new-password"
          error={errors.newPassword}
        />

        <FormInput
          control={control}
          name="confirmPassword"
          label="Xác nhận mật khẩu mới"
          placeholder="Nhập lại mật khẩu mới"
          type="password"
          id="change-confirm-password"
          error={errors.confirmPassword}
        />

        <div className="flex justify-end pt-4">
          <BaseButton
            type="primary"
            htmlType="submit"
            loading={isPending}
            className="!bg-blue-600 !text-white hover:!bg-blue-700 !border-0 shadow-md shadow-blue-500/20 h-10 px-8 rounded-lg font-bold transition-all"
          >
            Đổi mật khẩu
          </BaseButton>
        </div>
      </form>
    </div>
  );
}
