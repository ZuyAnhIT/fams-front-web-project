"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { ArrowLeftOutlined, MailOutlined } from "@ant-design/icons";
import GlassCard from "@/components/ui/GlassCard";
import FormInput from "@/components/forms/FormInput";
import BaseButton from "@/components/ui/BaseButton";
import { forgotPasswordSchema, type ForgotPasswordFormData } from "@/features/auth/schemas/auth.schema";
import { useForgotPassword } from "@/features/auth/hooks/use-auth";
import { ROUTES } from "@/constants/routes";
import { APP_NAME } from "@/constants/app";

export default function ForgotPasswordForm() {
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: "onBlur",
    defaultValues: {
      email: "",
    },
  });

  const { mutateAsync: forgotPasswordMutation } = useForgotPassword();

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      await forgotPasswordMutation({ email: data.email });
      setSubmittedEmail(data.email);
      setIsSuccess(true);
    } catch (error) {
      // Dù có lỗi hay không, backend cũng trả 200 để bảo mật. 
      // Nhưng bắt catch phòng trường hợp lỗi network.
      console.error(error);
    }
  };

  if (isSuccess) {
    return (
      <div className="w-full max-w-[450px]">
        <GlassCard>
          <div className="mb-6 flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-dashed border-green-500/60 bg-green-500/10 shadow-[0_0_20px_rgba(34,197,94,0.2)]">
              <MailOutlined className="text-3xl text-green-400" />
            </div>
          </div>
          
          <h1 className="mb-4 text-center text-2xl font-semibold text-white">
            Kiểm tra hộp thư của bạn
          </h1>
          
          <p className="mb-8 text-center text-sm text-gray-300">
            Chúng tôi đã gửi một liên kết khôi phục mật khẩu đến email{" "}
            <span className="font-bold text-white">{submittedEmail}</span>. 
            Vui lòng kiểm tra hộp thư đến (hoặc thư rác) và làm theo hướng dẫn.
          </p>

          <Link href={ROUTES.LOGIN} className="block w-full">
            <BaseButton
              customVariant="auth"
              block
              size="large"
            >
              Quay lại trang Đăng nhập
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
          <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-dashed border-violet-500/60 bg-violet-500/10 shadow-[0_0_20px_rgba(124,92,252,0.2)]">
            <span className="text-4xl font-extrabold text-white">Q</span>
          </div>
        </div>

        {/* Tiêu đề */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-white mb-2">
            Quên mật khẩu?
          </h1>
          <p className="text-sm text-gray-400">
            Đừng lo lắng, hãy nhập email bạn đã đăng ký với {APP_NAME} và chúng tôi sẽ gửi liên kết khôi phục.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <FormInput
            control={control}
            name="email"
            label="Email"
            placeholder="Nhập địa chỉ email"
            id="forgot-password-email"
            error={errors.email}
          />

          <BaseButton
            customVariant="auth"
            htmlType="submit"
            loading={isSubmitting}
            block
            size="large"
          >
            Gửi liên kết khôi phục
          </BaseButton>
        </form>

        {/* Quay lại */}
        <div className="mt-8 text-center">
          <Link
            href={ROUTES.LOGIN}
            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-300 hover:text-white transition-colors"
          >
            <ArrowLeftOutlined /> Quay lại trang Đăng nhập
          </Link>
        </div>
      </GlassCard>
    </div>
  );
}
