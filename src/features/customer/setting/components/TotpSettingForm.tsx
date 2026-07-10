"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { message, Input } from "antd";
import GlassCard from "@/components/ui/GlassCard";
import FormInput from "@/components/forms/FormInput";
import BaseButton from "@/components/ui/BaseButton";
import { useSetupTotp, useVerifyTotp, useDisableTotp } from "@/features/customer/auth/hooks/use-auth";

const totpSchema = z.object({
  code: z.string().length(6, "Mã xác thực phải gồm 6 chữ số").regex(/^\d+$/, "Mã xác thực chỉ chứa số"),
});

type TotpFormData = z.infer<typeof totpSchema>;

export default function TotpSettingForm() {
  const [setupData, setSetupData] = useState<{ setupToken: string; qrCodeUrl: string; manualEntryKey: string } | null>(null);

  const { mutateAsync: setupTotp, isPending: isSettingUp } = useSetupTotp();
  const { mutateAsync: verifyTotp, isPending: isVerifying } = useVerifyTotp();
  const { mutateAsync: disableTotp, isPending: isDisabling } = useDisableTotp();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TotpFormData>({
    resolver: zodResolver(totpSchema),
    defaultValues: {
      code: "",
    },
  });

  const handleSetup = async () => {
    try {
      const data = await setupTotp();
      setSetupData(data);
    } catch (e: unknown) {
      const error = e as { response?: { status?: number } };
      if (error.response?.status === 409) {
        message.warning("TOTP đã được bật sẵn!");
      } else {
        message.error("Khởi tạo thiết lập TOTP thất bại.");
      }
    }
  };

  const handleVerify = async (data: TotpFormData) => {
    if (!setupData) return;
    try {
      await verifyTotp({
        setupToken: setupData.setupToken,
        code: data.code,
      });
      message.success("Bảo mật 2 lớp đã được bật thành công!");
      setSetupData(null); // Đóng form setup
      reset();
    } catch (e: unknown) {
      message.error("Mã xác thực không chính xác. Vui lòng thử lại.");
    }
  };

  const handleDisable = async () => {
    try {
      await disableTotp();
      message.success("Đã tắt Bảo mật 2 lớp!");
    } catch (e: unknown) {
      message.error("Tắt thất bại hoặc TOTP chưa được bật.");
    }
  };

  return (
    <div className="w-full">
      <div className="border-b border-gray-300 pb-4 mb-6">
        <h3 className="text-xl font-semibold text-brand-950">Bảo mật 2 Lớp (TOTP)</h3>
        <p className="text-sm text-gray-500 mt-1">Bảo vệ tài khoản của bạn bằng mã xác thực một lần</p>
      </div>
      <div className="space-y-6 w-full lg:max-w-3xl">
      <p className="text-sm text-brand-700">
        Sử dụng ứng dụng Google Authenticator hoặc Authy để quét mã QR và bật bảo mật 2 lớp cho tài khoản của bạn.
      </p>

      <div className="flex gap-4">
        <BaseButton onClick={handleSetup} loading={isSettingUp} type="primary" className="!bg-blue-600 !text-white hover:!bg-blue-700 !border-0 shadow-md shadow-blue-500/20 font-bold">
          Bật TOTP
        </BaseButton>
        <BaseButton onClick={handleDisable} loading={isDisabling} danger>
          Tắt TOTP
        </BaseButton>
      </div>

      {setupData && (
        <div className="mt-8 p-6 bg-white rounded-xl border border-brand-200 text-center animate-fade-in">
          <h4 className="font-semibold text-brand-900 mb-4">Quét mã QR sau bằng ứng dụng Authenticator</h4>

          <div className="flex justify-center mb-4">
            {/* Sử dụng API tạo QR Code từ chuỗi otpauth */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=otpauth://totp/FAMS?secret=${setupData.manualEntryKey}%26issuer=FAMS`}
              alt="TOTP QR Code"
              className="w-48 h-48 border rounded-lg p-2 bg-white"
            />
          </div>

          <p className="text-xs text-brand-600 mb-6">
            Hoặc nhập mã này thủ công: <strong className="font-mono text-brand-900 tracking-wider bg-brand-50 px-2 py-1 rounded">{setupData.manualEntryKey}</strong>
          </p>

          <form onSubmit={handleSubmit(handleVerify)} className="max-w-xs mx-auto space-y-4 text-left">
            <div className="flex flex-col items-center justify-center space-y-2">
              <label className="text-[14px] font-medium tracking-wide text-brand-900">Nhập mã xác thực (6 số)</label>
              <Controller
                name="code"
                control={control}
                render={({ field }) => (
                  <Input.OTP
                    {...field}
                    length={6}
                    size="large"
                    status={errors.code ? "error" : undefined}
                    className="mt-2 flex justify-center w-full [&_input]:!bg-white [&_input]:!text-brand-950 [&_input]:!border-brand-300 [&_input:focus]:!border-brand-500"
                  />
                )}
              />
              {errors.code && (
                <p className="text-xs text-red-500 mt-1">{errors.code.message}</p>
              )}
            </div>
            <BaseButton htmlType="submit" loading={isVerifying} block type="primary" className="!bg-blue-600 !text-white hover:!bg-blue-700 !border-0 shadow-md shadow-blue-500/20 mt-4 font-bold">
              Xác nhận & Bật
            </BaseButton>
          </form>
        </div>
      )}
    </div>
    </div>
  );
}
