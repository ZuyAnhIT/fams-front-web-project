"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { message } from "antd";
import { CheckCircleOutlined, WarningOutlined } from "@ant-design/icons";
import GlassCard from "@/components/ui/GlassCard";
import FormInput from "@/components/forms/FormInput";
import BaseButton from "@/components/ui/BaseButton";
import { resetPasswordSchema, type ResetPasswordFormData } from "@/features/auth/schemas/auth.schema";
import { useResetPassword } from "@/features/auth/hooks/use-auth";
import { ROUTES } from "@/constants/routes";

export default function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [isSuccess, setIsSuccess] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onBlur",
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  const { mutateAsync: resetPasswordMutation } = useResetPassword();

  // Xử lý khi không có token trên URL
  if (!token) {
    return (
      <div className="w-full max-w-[450px]">
        <GlassCard>
          <div className="mb-6 flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-dashed border-red-500/60 bg-red-500/10 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
              <WarningOutlined className="text-4xl text-red-400" />
            </div>
          </div>
          
          <h1 className="mb-4 text-center text-2xl font-semibold text-white">
            Liên kết không hợp lệ
          </h1>
          
          <p className="mb-8 text-center text-sm text-gray-300">
            Không tìm thấy mã xác thực. Vui lòng kiểm tra lại đường dẫn trong email hoặc yêu cầu cấp lại mã mới.
          </p>

          <Link href={ROUTES.FORGOT_PASSWORD} className="block w-full">
            <BaseButton
              customVariant="auth"
              block
              size="large"
            >
              Yêu cầu cấp lại
            </BaseButton>
          </Link>
          <div className="mt-4 text-center">
            <Link
              href={ROUTES.LOGIN}
              className="text-sm font-semibold text-gray-400 hover:text-white transition-colors"
            >
              Quay lại Đăng nhập
            </Link>
          </div>
        </GlassCard>
      </div>
    );
  }

  const onSubmit = async (data: ResetPasswordFormData) => {
    try {
      await resetPasswordMutation({
        token,
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword,
      });
      setIsSuccess(true);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Đã có lỗi xảy ra. Token có thể đã hết hạn.";
      message.error(errorMessage);
    }
  };

  // Màn hình thành công
  if (isSuccess) {
    return (
      <div className="w-full max-w-[450px]">
        <GlassCard>
          <div className="mb-6 flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-dashed border-green-500/60 bg-green-500/10 shadow-[0_0_20px_rgba(34,197,94,0.2)]">
              <CheckCircleOutlined className="text-4xl text-green-400" />
            </div>
          </div>
          
          <h1 className="mb-4 text-center text-2xl font-semibold text-white">
            Đổi mật khẩu thành công!
          </h1>
          
          <p className="mb-8 text-center text-sm text-gray-300">
            Mật khẩu của bạn đã được cập nhật. Toàn bộ phiên đăng nhập cũ đã được đăng xuất. Vui lòng đăng nhập lại bằng mật khẩu mới.
          </p>

          <Link href={ROUTES.LOGIN} className="block w-full">
            <BaseButton
              customVariant="auth"
              block
              size="large"
            >
              Đăng nhập ngay
            </BaseButton>
          </Link>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[450px]">
      <GlassCard>
        {/* Logo */}
        <div className="mb-6 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-dashed border-blue-500/60 bg-blue-500/10 shadow-[0_0_20px_rgba(37,99,235,0.2)]">
            <span className="text-4xl font-extrabold text-white">Q</span>
          </div>
        </div>

        {/* Tiêu đề */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-white mb-2">
            Tạo mật khẩu mới
          </h1>
          <p className="text-sm text-gray-400">
            Vui lòng nhập mật khẩu mới mạnh và dễ nhớ.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <FormInput
            control={control}
            name="newPassword"
            label="Mật khẩu mới"
            placeholder="Nhập mật khẩu mới"
            type="password"
            id="reset-new-password"
            error={errors.newPassword}
          />

          <FormInput
            control={control}
            name="confirmPassword"
            label="Xác nhận mật khẩu"
            placeholder="Nhập lại mật khẩu mới"
            type="password"
            id="reset-confirm-password"
            error={errors.confirmPassword}
          />

          <BaseButton
            customVariant="auth"
            htmlType="submit"
            loading={isSubmitting}
            block
            size="large"
          >
            Lưu mật khẩu mới
          </BaseButton>
        </form>
      </GlassCard>
    </div>
  );
}
