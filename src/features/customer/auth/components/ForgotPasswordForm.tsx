"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { ArrowLeftOutlined, MailOutlined } from "@ant-design/icons";
import FormInput from "@/components/forms/FormInput";
import BaseButton from "@/components/ui/BaseButton";
import { forgotPasswordSchema, type ForgotPasswordFormData } from "@/features/customer/auth/schemas/auth.schema";
import { useForgotPassword } from "@/features/customer/auth/hooks/use-auth";
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
      <div className="w-full">
        <div className="bg-white">
          <div className="mb-6 flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-50 shadow-sm shadow-brand-100">
              <MailOutlined className="text-3xl text-brand-600" />
            </div>
          </div>
          
          <h1 className="mb-4 text-center text-3xl font-bold text-slate-900 tracking-tight">
            Kiểm tra hộp thư của bạn
          </h1>
          
          <p className="mb-8 text-center text-[15px] text-slate-600">
            Chúng tôi đã gửi một liên kết khôi phục mật khẩu đến email{" "}
            <span className="font-bold text-slate-900">{submittedEmail}</span>. 
            Vui lòng kiểm tra hộp thư đến (hoặc thư rác) và làm theo hướng dẫn.
          </p>

          <Link href={ROUTES.LOGIN} className="block w-full">
            <BaseButton
              type="primary"
              block
              size="large"
              className="font-bold !bg-brand-600 !text-white hover:opacity-90 !border-0 shadow-lg shadow-brand-600/25 h-12 rounded-xl transition-all"
            >
              Quay lại trang Đăng nhập
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
            Quên mật khẩu?
          </h1>
          <p className="text-[15px] text-slate-500">
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
            type="primary"
            htmlType="submit"
            loading={isSubmitting}
            block
            size="large"
            className="mt-2 font-bold !bg-brand-600 !text-white hover:opacity-90 !border-0 shadow-lg shadow-brand-600/25 h-12 rounded-xl transition-all"
          >
            Gửi liên kết khôi phục
          </BaseButton>
        </form>

        {/* Quay lại */}
        <div className="mt-8 text-center">
          <Link
            href={ROUTES.LOGIN}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-brand-600 transition-colors"
          >
            <ArrowLeftOutlined /> Quay lại trang Đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
}
