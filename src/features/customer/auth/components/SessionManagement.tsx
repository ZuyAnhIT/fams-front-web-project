"use client";

import { useState } from "react";
import { App, Tag } from "antd";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { AlertTriangle, Laptop, LogOut, MonitorSmartphone, RefreshCw, Smartphone } from "lucide-react";
import BaseButton from "@/components/ui/BaseButton";
import BaseModal from "@/components/ui/BaseModal";
import { ROUTES } from "@/constants/routes";
import {
  useLogout,
  useLogoutAll,
  useLogoutOthers,
  useLogoutSession,
  useSessions,
} from "@/features/customer/auth/hooks/use-auth";
import type { AuthSession } from "@/features/customer/auth/types/auth.type";
import { authTokenService } from "@/services/auth-token.service";
import { useAuthStore } from "@/stores/auth.store";

type ConfirmAction =
  | { kind: "current" }
  | { kind: "others" }
  | { kind: "all" }
  | { kind: "session"; session: AuthSession };

function describeDevice(session: AuthSession) {
  const agent = session.userAgent || "";
  const browser = /Edg\//.test(agent) ? "Edge" : /Firefox\//.test(agent) ? "Firefox" : /Chrome\//.test(agent) ? "Chrome" : /Safari\//.test(agent) ? "Safari" : "Trình duyệt";
  const os = /Android/.test(agent) ? "Android" : /iPhone|iPad/.test(agent) ? "iOS" : /Windows/.test(agent) ? "Windows" : /Macintosh/.test(agent) ? "macOS" : /Linux/.test(agent) ? "Linux" : "thiết bị không xác định";
  return `${browser} · ${os}`;
}

function safeDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Không xác định" : format(date, "HH:mm dd/MM/yyyy");
}

export default function SessionManagement() {
  const { message } = App.useApp();
  const router = useRouter();
  const logoutLocal = useAuthStore((state) => state.logout);
  const sessionsQuery = useSessions();
  const logoutMutation = useLogout();
  const logoutAllMutation = useLogoutAll();
  const logoutOthersMutation = useLogoutOthers();
  const logoutSessionMutation = useLogoutSession();
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);

  const isMutating = logoutMutation.isPending || logoutAllMutation.isPending || logoutOthersMutation.isPending || logoutSessionMutation.isPending;

  const leaveAuthenticatedArea = (notice: string) => {
    logoutLocal();
    message.success(notice);
    router.replace(ROUTES.LOGIN);
  };

  const executeAction = async () => {
    if (!confirmAction) return;
    try {
      if (confirmAction.kind === "current") {
        const refreshToken = authTokenService.getRefreshToken();
        if (refreshToken) await logoutMutation.mutateAsync({ refreshToken });
        setConfirmAction(null);
        leaveAuthenticatedArea("Đã đăng xuất thiết bị này.");
        return;
      }
      if (confirmAction.kind === "all") {
        await logoutAllMutation.mutateAsync();
        setConfirmAction(null);
        leaveAuthenticatedArea("Đã đăng xuất khỏi tất cả thiết bị.");
        return;
      }
      if (confirmAction.kind === "others") {
        await logoutOthersMutation.mutateAsync();
        message.success("Đã đăng xuất tất cả thiết bị khác.");
      } else {
        await logoutSessionMutation.mutateAsync(confirmAction.session.id);
        message.success("Đã thu hồi phiên đăng nhập đã chọn.");
      }
      setConfirmAction(null);
      await sessionsQuery.refetch();
    } catch {
      message.error("Không thể cập nhật phiên đăng nhập. Vui lòng tải lại và thử lại.");
      await sessionsQuery.refetch();
    }
  };

  const confirmCopy = confirmAction?.kind === "current"
    ? { title: "Đăng xuất thiết bị này?", body: "Phiên hiện tại sẽ kết thúc và bạn được chuyển về trang đăng nhập.", button: "Đăng xuất" }
    : confirmAction?.kind === "others"
      ? { title: "Đăng xuất các thiết bị khác?", body: "Mọi phiên khác sẽ bị thu hồi, còn thiết bị hiện tại vẫn đăng nhập.", button: "Đăng xuất nơi khác" }
      : confirmAction?.kind === "session"
        ? { title: "Thu hồi phiên đã chọn?", body: `Thiết bị ${confirmAction.session.deviceId} sẽ phải đăng nhập lại.`, button: "Thu hồi phiên" }
        : { title: "Đăng xuất khỏi mọi thiết bị?", body: "Tất cả phiên, kể cả thiết bị hiện tại, sẽ bị thu hồi ngay.", button: "Đăng xuất tất cả" };

  return (
    <div className="max-w-3xl">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-xl font-semibold text-gray-900">
            <MonitorSmartphone className="h-5 w-5 text-blue-600" /> Thiết bị & Phiên đăng nhập
          </h3>
          <p className="mt-1 text-sm text-gray-500">Kiểm tra và thu hồi từng phiên đang còn hiệu lực.</p>
        </div>
        <BaseButton icon={<RefreshCw className="h-4 w-4" />} loading={sessionsQuery.isFetching} onClick={() => void sessionsQuery.refetch()}>
          Làm mới
        </BaseButton>
      </div>

      {sessionsQuery.isLoading && <p role="status" className="rounded-xl border border-slate-200 p-5 text-sm text-slate-500">Đang tải danh sách thiết bị...</p>}
      {sessionsQuery.isError && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">Không thể tải danh sách phiên. Vui lòng thử lại.</div>
      )}
      {sessionsQuery.data?.length === 0 && <p className="rounded-xl border border-slate-200 p-5 text-sm text-slate-500">Không có phiên đăng nhập nào đang hoạt động.</p>}

      <div className="space-y-3">
        {sessionsQuery.data?.map((session) => {
          const mobile = /Android|iPhone|iPad/.test(session.userAgent || "");
          const DeviceIcon = mobile ? Smartphone : Laptop;
          return (
            <article key={session.id} className={`rounded-xl border p-4 ${session.current ? "border-blue-200 bg-blue-50/50" : "border-slate-200 bg-white"}`}>
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-white p-2 text-blue-700 shadow-sm"><DeviceIcon className="h-5 w-5" /></div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="break-all font-semibold text-slate-900">{session.deviceId}</h4>
                    {session.current && <Tag color="blue">Thiết bị này</Tag>}
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{describeDevice(session)}</p>
                  <p className="mt-1 text-xs text-slate-500">IP: {session.ipAddress || "Không xác định"} · Hoạt động: {safeDate(session.lastUsedAt)}</p>
                  <p className="mt-0.5 text-xs text-slate-400">Hết hạn: {safeDate(session.expiresAt)}</p>
                </div>
                {!session.current && (
                  <BaseButton danger size="small" onClick={() => setConfirmAction({ kind: "session", session })}>Đăng xuất</BaseButton>
                )}
              </div>
            </article>
          );
        })}
      </div>

      <div className="mt-8 grid gap-3 rounded-xl border border-amber-200 bg-amber-50 p-5 sm:grid-cols-3">
        <BaseButton icon={<LogOut className="h-4 w-4" />} onClick={() => setConfirmAction({ kind: "current" })}>Thiết bị này</BaseButton>
        <BaseButton onClick={() => setConfirmAction({ kind: "others" })}>Các thiết bị khác</BaseButton>
        <BaseButton danger onClick={() => setConfirmAction({ kind: "all" })}>Tất cả thiết bị</BaseButton>
        <p className="text-xs text-amber-800 sm:col-span-3">Ba thao tác có phạm vi khác nhau; hãy kiểm tra kỹ trước khi xác nhận.</p>
      </div>

      <BaseModal
        title={<div className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-red-500" /><span>{confirmCopy.title}</span></div>}
        isOpen={Boolean(confirmAction)}
        onClose={() => !isMutating && setConfirmAction(null)}
        onConfirm={() => void executeAction()}
        confirmText={confirmCopy.button}
        cancelText="Hủy"
        confirmButtonProps={{ danger: true }}
        confirmLoading={isMutating}
        centered
      >
        <p className="mt-2 text-slate-600">{confirmCopy.body}</p>
      </BaseModal>
    </div>
  );
}
