"use client";

import { useState } from "react";
import Link from "next/link";
import { Alert, App, Input, Tag } from "antd";
import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import { AtSign, Link2, Phone, ShieldCheck } from "lucide-react";
import { isAxiosError } from "axios";
import BaseButton from "@/components/ui/BaseButton";
import { ROUTES } from "@/constants/routes";
import {
  useConfirmPhoneChangeWithFirebase,
  useLinkGoogle,
  useRequestEmailChange,
  useUnlinkGoogle,
} from "@/features/customer/auth/hooks/use-auth";
import { useFirebasePhoneAuth } from "@/features/customer/auth/hooks/use-firebase-phone-auth";
import type { AuthUser, UserProfile } from "@/features/customer/auth/types/auth.type";
import { useAuthStore } from "@/stores/auth.store";
import { isGoogleConfigured } from "@/config/env";
import OptionalGoogleOAuthProvider from "@/components/providers/OptionalGoogleOAuthProvider";

function errorText(error: unknown, fallback: string) {
  if (!isAxiosError(error)) return fallback;
  return error.response?.data?.userMessage || error.response?.data?.message || fallback;
}

function AccountIdentifiersContent() {
  const { message } = App.useApp();
  const { user, updateUser } = useAuthStore();
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [otpCode, setOtpCode] = useState("");
  const [isWaitingForPhoneOtp, setIsWaitingForPhoneOtp] = useState(false);
  const [emailRequestSent, setEmailRequestSent] = useState(false);
  const [unlinkNeedsPassword, setUnlinkNeedsPassword] = useState(false);

  const requestEmail = useRequestEmailChange();
  const confirmPhoneFirebase = useConfirmPhoneChangeWithFirebase();
  const firebasePhone = useFirebasePhoneAuth("recaptcha-phone-change");
  const linkGoogle = useLinkGoogle();
  const unlinkGoogle = useUnlinkGoogle();

  const persistProfile = (profile: UserProfile) => {
    updateUser({ ...user, ...profile } as AuthUser);
  };

  const handleEmailRequest = async () => {
    const normalized = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(normalized)) {
      message.error("Vui lòng nhập email hợp lệ.");
      return;
    }
    try {
      await requestEmail.mutateAsync({ email: normalized });
      setEmailRequestSent(true);
      message.success("Đã gửi link xác thực tới email mới.");
    } catch (error) {
      message.error(errorText(error, "Không thể gửi link xác thực email."));
    }
  };

  const handlePhoneRequest = async () => {
    const normalized = phone.trim();
    if (!/^\+[1-9]\d{7,14}$/.test(normalized)) {
      message.error("Số điện thoại chưa đúng định dạng E.164, ví dụ +84912345678.");
      return;
    }
    try {
      await firebasePhone.sendCode(normalized);
      setOtpCode("");
      setIsWaitingForPhoneOtp(true);
      message.success("OTP đã được gửi tới số điện thoại qua Firebase.");
    } catch (error) {
      message.error(errorText(error, "Không thể gửi OTP tới số điện thoại."));
    }
  };

  const handlePhoneConfirm = async () => {
    if (!/^\d{6}$/.test(otpCode)) {
      message.error("Vui lòng nhập đủ OTP 6 số.");
      return;
    }
    try {
      const firebaseIdToken = await firebasePhone.confirmCode(otpCode);
      const profile = await confirmPhoneFirebase.mutateAsync({ firebaseIdToken });
      persistProfile(profile);
      setIsWaitingForPhoneOtp(false);
      setOtpCode("");
      firebasePhone.reset();
      message.success("Số điện thoại đã được xác thực và cập nhật.");
    } catch (error) {
      message.error(errorText(error, "OTP không đúng hoặc đã hết hạn."));
    }
  };

  const handleGoogleSuccess = async (credential: CredentialResponse) => {
    if (!credential.credential) {
      message.error("Google không trả về ID token.");
      return;
    }
    try {
      await linkGoogle.mutateAsync(credential.credential);
      updateUser({ ...user, googleLinked: true } as AuthUser);
      setUnlinkNeedsPassword(false);
      message.success("Đã liên kết tài khoản Google.");
    } catch (error) {
      message.error(errorText(error, "Không thể liên kết tài khoản Google."));
    }
  };

  const handleUnlinkGoogle = async () => {
    try {
      await unlinkGoogle.mutateAsync();
      updateUser({ ...user, googleLinked: false } as AuthUser);
      setUnlinkNeedsPassword(false);
      message.success("Đã gỡ liên kết Google.");
    } catch (error) {
      const code = isAxiosError(error) ? error.response?.data?.errorCode : undefined;
      setUnlinkNeedsPassword(code === "INVALID_STATE");
      message.error(errorText(error, "Không thể gỡ liên kết Google."));
    }
  };

  return (
    <section className="mt-10 border-t border-slate-200 pt-8" aria-labelledby="login-identifiers-title">
      <div className="mb-6">
        <h3 id="login-identifiers-title" className="flex items-center gap-2 text-xl font-semibold text-brand-950">
          <ShieldCheck className="h-5 w-5 text-blue-600" aria-hidden="true" />
          Phương thức đăng nhập
        </h3>
        <p className="mt-1 text-sm text-slate-500">Email và số điện thoại chỉ được cập nhật sau khi xác thực thành công.</p>
      </div>

      <div className="space-y-6 lg:max-w-3xl">
        <div className="rounded-xl border border-slate-200 p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <span className="flex items-center gap-2 font-semibold text-slate-800"><AtSign className="h-4 w-4" /> Email</span>
            <Tag color={user?.emailVerified ? "green" : "orange"}>{user?.emailVerified ? "Đã xác thực" : "Chưa xác thực"}</Tag>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input id="profile-email" value={email} onChange={(event) => { setEmail(event.target.value); setEmailRequestSent(false); }} placeholder="email@example.com" />
            <BaseButton loading={requestEmail.isPending} onClick={() => void handleEmailRequest()} className="sm:min-w-36">
              {user?.email ? "Đổi email" : "Thêm email"}
            </BaseButton>
          </div>
          {emailRequestSent && <p className="mt-3 text-sm text-blue-700">Hãy mở link trong email mới. Địa chỉ hiện tại vẫn được giữ cho tới khi xác nhận.</p>}
        </div>

        <div className="rounded-xl border border-slate-200 p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <span className="flex items-center gap-2 font-semibold text-slate-800"><Phone className="h-4 w-4" /> Số điện thoại</span>
            <Tag color={user?.phoneVerified ? "green" : "orange"}>{user?.phoneVerified ? "Đã xác thực" : "Chưa xác thực"}</Tag>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input id="profile-phone" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+84912345678" />
            <BaseButton loading={firebasePhone.isSending} onClick={() => void handlePhoneRequest()} className="sm:min-w-36">
              {isWaitingForPhoneOtp ? "Gửi lại OTP" : user?.phone ? "Đổi số" : "Thêm số"}
            </BaseButton>
          </div>
          <div id="recaptcha-phone-change" />
          {isWaitingForPhoneOtp && (
            <div className="mt-4 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
              <Input.OTP aria-label="Mã OTP đổi số điện thoại" length={6} value={otpCode} onChange={setOtpCode} />
              <BaseButton type="primary" loading={firebasePhone.isConfirming || confirmPhoneFirebase.isPending} onClick={() => void handlePhoneConfirm()}>
                Xác nhận OTP
              </BaseButton>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <span className="flex items-center gap-2 font-semibold text-slate-800"><Link2 className="h-4 w-4" /> Google</span>
            <Tag color={user?.googleLinked ? "green" : "default"}>{user?.googleLinked ? "Đã liên kết" : "Chưa liên kết"}</Tag>
          </div>
          {user?.googleLinked ? (
            <BaseButton danger loading={unlinkGoogle.isPending} onClick={() => void handleUnlinkGoogle()}>Gỡ liên kết Google</BaseButton>
          ) : isGoogleConfigured ? (
            <div className="max-w-sm">
              <GoogleLogin
                onSuccess={(credential) => void handleGoogleSuccess(credential)}
                onError={() => message.error("Google đã hủy hoặc không thể hoàn tất liên kết.")}
                text="continue_with"
                shape="rectangular"
              />
            </div>
          ) : (
            <Alert
              showIcon
              type="warning"
              title="Chưa cấu hình đăng nhập Google"
              description="Quản trị hệ thống cần bổ sung NEXT_PUBLIC_GOOGLE_CLIENT_ID trước khi người dùng có thể liên kết tài khoản."
            />
          )}
          {unlinkNeedsPassword && (
            <p className="mt-3 text-sm text-amber-700">
              Tài khoản Google-only cần <Link href={ROUTES.FORGOT_PASSWORD} className="font-semibold underline">đặt mật khẩu qua email</Link> trước khi gỡ liên kết.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

export default function AccountIdentifiersForm() {
  return (
    <OptionalGoogleOAuthProvider>
      <AccountIdentifiersContent />
    </OptionalGoogleOAuthProvider>
  );
}
