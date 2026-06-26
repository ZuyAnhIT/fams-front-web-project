"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { message } from "antd";
import GlassCard from "@/components/ui/GlassCard";
import FormInput from "@/components/forms/FormInput";
import BaseButton from "@/components/ui/BaseButton";
import { useChangePassword } from "@/features/auth/hooks/use-auth";
import { changePasswordSchema, type ChangePasswordFormData } from "../schemas/setting.schema";

export default function ChangePasswordForm() {
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
        confirmPassword: data.confirmPassword,
      });
      message.success("Đổi mật khẩu thành công!");
      reset();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Đổi mật khẩu thất bại. Mật khẩu hiện tại có thể không đúng.";
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
          labelClassName="text-brand-900"
          placeholder="Nhập mật khẩu hiện tại"
          type="password"
          id="change-current-password"
          error={errors.currentPassword}
          className="text-brand-900 border-brand-300 focus:border-brand-500 focus:ring-brand-500/20"
        />

        <FormInput
          control={control}
          name="newPassword"
          label="Mật khẩu mới"
          labelClassName="text-brand-900"
          placeholder="Nhập mật khẩu mới"
          type="password"
          id="change-new-password"
          error={errors.newPassword}
          className="text-brand-900 border-brand-300 focus:border-brand-500 focus:ring-brand-500/20"
        />

        <FormInput
          control={control}
          name="confirmPassword"
          label="Xác nhận mật khẩu mới"
          labelClassName="text-brand-900"
          placeholder="Nhập lại mật khẩu mới"
          type="password"
          id="change-confirm-password"
          error={errors.confirmPassword}
          className="text-brand-900 border-brand-300 focus:border-brand-500 focus:ring-brand-500/20"
        />

        <div className="flex justify-start pt-4">
          <BaseButton
            type="primary"
            htmlType="submit"
            loading={isPending}
            className="bg-brand-600 hover:bg-brand-700 text-white border-transparent"
          >
            Đổi mật khẩu
          </BaseButton>
        </div>
      </form>
    </div>
  );
}
