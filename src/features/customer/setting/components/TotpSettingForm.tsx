"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Alert, App, Checkbox, Input, Modal, Radio } from "antd";
import { Copy, Download, KeyRound, ShieldCheck, ShieldOff } from "lucide-react";
import BaseButton from "@/components/ui/BaseButton";
import {
  useDisableTotp,
  useSetupTotp,
  useVerifyTotp,
} from "@/features/customer/auth/hooks/use-auth";
import type {
  TotpDisablePayload,
  TotpSetupResponse,
} from "@/features/customer/auth/types/auth.type";

const totpSchema = z.object({
  code: z.string().regex(/^\d{6}$/, "Mã Authenticator phải gồm đúng 6 chữ số"),
});

type TotpFormData = z.infer<typeof totpSchema>;
type DisableMethod = "password" | "code" | "backupCode";

function getErrorMessage(error: unknown, fallback: string) {
  const response = (error as { response?: { data?: { userMessage?: string; message?: string } } }).response;
  return response?.data?.userMessage || response?.data?.message || fallback;
}

export default function TotpSettingForm() {
  const { message } = App.useApp();
  const [setupData, setSetupData] = useState<TotpSetupResponse | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [backupConfirmed, setBackupConfirmed] = useState(false);
  const [disableOpen, setDisableOpen] = useState(false);
  const [disableMethod, setDisableMethod] = useState<DisableMethod>("password");
  const [disableCredential, setDisableCredential] = useState("");

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
    defaultValues: { code: "" },
  });

  const handleSetup = async () => {
    try {
      setSetupData(await setupTotp());
      setBackupCodes([]);
      setBackupConfirmed(false);
    } catch (error: unknown) {
      const status = (error as { response?: { status?: number } }).response?.status;
      message[status === 409 ? "warning" : "error"](
        status === 409
          ? "Tài khoản đã bật xác thực hai lớp."
          : getErrorMessage(error, "Không thể khởi tạo xác thực hai lớp."),
      );
    }
  };

  const handleVerify = async (data: TotpFormData) => {
    if (!setupData) return;
    try {
      const result = await verifyTotp({ setupToken: setupData.setupToken, code: data.code });
      setBackupCodes(result.backupCodes);
      setSetupData(null);
      reset();
      message.success("Đã bật xác thực hai lớp.");
    } catch (error: unknown) {
      message.error(getErrorMessage(error, "Mã không đúng hoặc phiên thiết lập đã hết hạn."));
    }
  };

  const copyBackupCodes = async () => {
    await navigator.clipboard.writeText(backupCodes.join("\n"));
    message.success("Đã sao chép mã dự phòng.");
  };

  const downloadBackupCodes = () => {
    const blob = new Blob([
      `FAMS - Mã dự phòng xác thực hai lớp\n\n${backupCodes.join("\n")}\n\nMỗi mã chỉ dùng được một lần.`,
    ], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "fams-backup-codes.txt";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleDisable = async () => {
    const credential = disableCredential.trim();
    if (!credential) {
      message.error("Vui lòng nhập thông tin xác thực lại.");
      return;
    }
    if (disableMethod === "code" && !/^\d{6}$/.test(credential)) {
      message.error("Mã Authenticator phải gồm đúng 6 chữ số.");
      return;
    }

    const payload: TotpDisablePayload = disableMethod === "password"
      ? { password: credential }
      : disableMethod === "code"
        ? { code: credential }
        : { backupCode: credential };

    try {
      await disableTotp(payload);
      setDisableOpen(false);
      setDisableCredential("");
      message.success("Đã tắt xác thực hai lớp.");
    } catch (error: unknown) {
      message.error(getErrorMessage(error, "Xác thực lại thất bại hoặc 2FA chưa được bật."));
    }
  };

  return (
    <div className="w-full space-y-6">
      <div className="border-b border-gray-300 pb-4">
        <h2 className="text-xl font-semibold text-brand-950">Xác thực hai lớp (TOTP)</h2>
        <p className="mt-1 text-sm text-gray-500">
          Dùng Google Authenticator, Microsoft Authenticator hoặc ứng dụng tương thích TOTP.
        </p>
      </div>

      <Alert
        showIcon
        type="info"
        title="Thêm một lớp bảo vệ sau mật khẩu"
        description="Sau khi bật, mỗi lần đăng nhập bằng mật khẩu bạn cần mã 6 số hoặc một mã dự phòng. Google Sign-In không đi qua bước TOTP theo chính sách hiện tại."
      />

      <div className="flex flex-wrap gap-3">
        <BaseButton
          type="primary"
          icon={<ShieldCheck className="h-4 w-4" />}
          loading={isSettingUp}
          onClick={handleSetup}
        >
          Bật xác thực hai lớp
        </BaseButton>
        <BaseButton
          danger
          icon={<ShieldOff className="h-4 w-4" />}
          onClick={() => setDisableOpen(true)}
        >
          Tắt xác thực hai lớp
        </BaseButton>
      </div>

      {setupData && (
        <section className="rounded-2xl border border-blue-200 bg-blue-50/40 p-5" aria-label="Thiết lập ứng dụng Authenticator">
          <h3 className="font-semibold text-slate-900">1. Quét QR hoặc nhập khóa thủ công</h3>
          <p className="mt-1 text-sm text-slate-600">Phiên thiết lập có hiệu lực 10 phút.</p>
          <div className="mt-4 grid gap-5 md:grid-cols-[240px_1fr]">
            <iframe
              title="QR thiết lập TOTP"
              src={setupData.qrCodeUrl}
              className="h-60 w-full rounded-xl border border-slate-200 bg-white"
              sandbox="allow-same-origin"
            />
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Khóa nhập thủ công</p>
                <div className="mt-2 break-all rounded-lg bg-white p-3 font-mono text-sm font-semibold text-slate-900 ring-1 ring-slate-200">
                  {setupData.manualEntryKey}
                </div>
              </div>
              <form onSubmit={handleSubmit(handleVerify)} className="space-y-3">
                <label className="block text-sm font-semibold text-slate-800">2. Nhập mã đang hiển thị trong ứng dụng</label>
                <Controller
                  name="code"
                  control={control}
                  render={({ field }) => (
                    <Input.OTP {...field} length={6} size="large" status={errors.code ? "error" : undefined} />
                  )}
                />
                {errors.code && <p className="text-xs text-red-600">{errors.code.message}</p>}
                <BaseButton htmlType="submit" type="primary" loading={isVerifying}>
                  Xác nhận và bật
                </BaseButton>
              </form>
            </div>
          </div>
        </section>
      )}

      {backupCodes.length > 0 && (
        <section className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-5" aria-label="Mã dự phòng TOTP">
          <div className="flex items-start gap-3">
            <KeyRound className="mt-0.5 h-6 w-6 text-amber-700" />
            <div>
              <h3 className="font-bold text-amber-950">Lưu mã dự phòng ngay bây giờ</h3>
              <p className="mt-1 text-sm text-amber-900">
                Đây là lần duy nhất hệ thống hiển thị các mã này. Mỗi mã chỉ dùng được một lần khi bạn mất thiết bị Authenticator.
              </p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-white p-4 font-mono font-semibold text-slate-900 sm:grid-cols-4">
            {backupCodes.map((code) => <span key={code}>{code}</span>)}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <BaseButton icon={<Copy className="h-4 w-4" />} onClick={copyBackupCodes}>Sao chép</BaseButton>
            <BaseButton icon={<Download className="h-4 w-4" />} onClick={downloadBackupCodes}>Tải file</BaseButton>
          </div>
          <Checkbox className="mt-4" checked={backupConfirmed} onChange={(event) => setBackupConfirmed(event.target.checked)}>
            Tôi đã lưu mã dự phòng ở nơi an toàn
          </Checkbox>
          <div className="mt-3">
            <BaseButton type="primary" disabled={!backupConfirmed} onClick={() => setBackupCodes([])}>
              Hoàn tất
            </BaseButton>
          </div>
        </section>
      )}

      <Modal
        title="Xác thực lại để tắt 2FA"
        open={disableOpen}
        onCancel={() => { setDisableOpen(false); setDisableCredential(""); }}
        onOk={handleDisable}
        okText="Xác nhận tắt"
        cancelText="Hủy"
        okButtonProps={{ danger: true, loading: isDisabling }}
        destroyOnHidden
      >
        <Alert
          className="mb-4"
          type="warning"
          showIcon
          title="Tắt 2FA làm giảm mức bảo vệ tài khoản"
          description="Bạn phải xác thực lại bằng đúng một phương thức."
        />
        <Radio.Group
          value={disableMethod}
          onChange={(event) => { setDisableMethod(event.target.value); setDisableCredential(""); }}
          className="mb-4 flex flex-col gap-2 sm:flex-row"
        >
          <Radio value="password">Mật khẩu</Radio>
          <Radio value="code">Mã Authenticator</Radio>
          <Radio value="backupCode">Mã dự phòng</Radio>
        </Radio.Group>
        <Input.Password
          aria-label={disableMethod === "password" ? "Mật khẩu xác thực lại" : disableMethod === "code" ? "Mã Authenticator xác thực lại" : "Mã dự phòng xác thực lại"}
          value={disableCredential}
          onChange={(event) => setDisableCredential(event.target.value)}
          placeholder={disableMethod === "password" ? "Nhập mật khẩu hiện tại" : disableMethod === "code" ? "Nhập mã 6 số" : "Nhập một mã dự phòng"}
          visibilityToggle={disableMethod === "password"}
        />
      </Modal>
    </div>
  );
}
