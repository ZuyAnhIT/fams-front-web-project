"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { App } from "antd";
import { CheckCircleOutlined, WarningOutlined } from "@ant-design/icons";
import FormInput from "@/components/forms/FormInput";
import BaseButton from "@/components/ui/BaseButton";
import { resetPasswordSchema, type ResetPasswordFormData } from "@/features/customer/auth/schemas/auth.schema";
import { useResetPassword } from "@/features/customer/auth/hooks/use-auth";
import { ROUTES } from "@/constants/routes";

export default function ResetPasswordForm() {
  const router = useRouter();
  const { message } = App.useApp();
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
      <div className="w-full">
        <div className="bg-white">
          <div className="mb-6 flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-50 shadow-sm shadow-red-100">
              <WarningOutlined className="text-4xl text-red-500" />
            </div>
          </div>
          
          <h1 className="mb-4 text-center text-3xl font-bold text-slate-900 tracking-tight">
            Liên kết không hợp lệ
          </h1>
          
          <p className="mb-8 text-center text-[15px] text-slate-600">
            Không tìm thấy mã xác thực. Vui lòng kiểm tra lại đường dẫn trong email hoặc yêu cầu cấp lại mã mới.
          </p>

          <Link href={ROUTES.FORGOT_PASSWORD} className="block w-full">
            <BaseButton
              type="primary"
              block
              size="large"
              className="font-bold !bg-brand-600 !text-white hover:opacity-90 !border-0 shadow-lg shadow-brand-600/25 h-12 rounded-xl transition-all"
            >
              Yêu cầu cấp lại
            </BaseButton>
          </Link>
          <div className="mt-6 text-center">
            <Link
              href={ROUTES.LOGIN}
              className="text-sm font-semibold text-slate-500 hover:text-brand-600 transition-colors"
            >
              Quay lại Đăng nhập
            </Link>
          </div>
        </div>
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
      <div className="w-full">
        <div className="bg-white">
          <div className="mb-6 flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-50 shadow-sm shadow-green-100">
              <CheckCircleOutlined className="text-4xl text-green-500" />
            </div>
          </div>
          
          <h1 className="mb-4 text-center text-3xl font-bold text-slate-900 tracking-tight">
            Đổi mật khẩu thành công!
          </h1>
          
          <p className="mb-8 text-center text-[15px] text-slate-600">
            Mật khẩu của bạn đã được cập nhật. Toàn bộ phiên đăng nhập cũ đã được đăng xuất. Vui lòng đăng nhập lại bằng mật khẩu mới.
          </p>

          <Link href={ROUTES.LOGIN} className="block w-full">
            <BaseButton
              type="primary"
              block
              size="large"
              className="font-bold !bg-brand-600 !text-white hover:opacity-90 !border-0 shadow-lg shadow-brand-600/25 h-12 rounded-xl transition-all"
            >
              Đăng nhập ngay
            </BaseButton>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="bg-white">
        {/* Tiêu đề */}
        <div className="text-left mb-8">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">
            Tạo mật khẩu mới
          </h1>
          <p className="text-[15px] text-slate-500">
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
            type="primary"
            htmlType="submit"
            loading={isSubmitting}
            block
            size="large"
            className="mt-2 font-bold !bg-brand-600 !text-white hover:opacity-90 !border-0 shadow-lg shadow-brand-600/25 h-12 rounded-xl transition-all"
          >
            Lưu mật khẩu mới
          </BaseButton>
        </form>
      </div>
    </div>
  );
}
