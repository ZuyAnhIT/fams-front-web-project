"use client";

import { useMemo } from "react";
import { Alert, App, Skeleton, Switch } from "antd";
import { Bell, BellRing, Smartphone } from "lucide-react";
import {
  useNotificationSettings,
  useUpdateNotificationSetting,
} from "../hooks/use-notification";

function errorMessage(error: unknown) {
  const data = (error as { response?: { data?: { userMessage?: string; message?: string } } }).response?.data;
  return data?.userMessage || data?.message || "Không thể lưu cài đặt thông báo.";
}

export default function NotificationSettingsForm() {
  const { message } = App.useApp();
  const settingsQuery = useNotificationSettings();
  const updateSetting = useUpdateNotificationSetting();
  const settings = useMemo(() => settingsQuery.data ?? [], [settingsQuery.data]);
  const settingsByType = useMemo(() => new Map(settings.map((setting) => [setting.eventType, setting])), [settings]);

  const updateChannel = async (eventType: string, channel: "inAppEnabled" | "pushEnabled", enabled: boolean) => {
    const current = settingsByType.get(eventType);
    try {
      await updateSetting.mutateAsync({
        eventType,
        payload: {
          inAppEnabled: current?.inAppEnabled ?? true,
          pushEnabled: current?.pushEnabled ?? true,
          [channel]: enabled,
        },
      });
      message.success("Đã lưu tùy chọn thông báo.");
    } catch (error: unknown) {
      message.error(errorMessage(error));
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h2 className="text-xl font-semibold text-slate-950">Cài đặt thông báo</h2>
        <p className="mt-1 text-sm text-slate-500">
          Điều khiển độc lập thông báo trong hộp thư và thông báo đẩy đến thiết bị di động.
        </p>
      </div>

      <Alert
        showIcon
        type="info"
        message="Hai kênh hoạt động độc lập"
        description="Tắt thông báo trong ứng dụng không tự tắt push và ngược lại. Push chỉ đến thiết bị đã đăng ký FCM/APNS trong App; Web không đăng ký token thiết bị thay cho App."
      />

      {settingsQuery.isLoading ? (
        <Skeleton active paragraph={{ rows: 4 }} />
      ) : settingsQuery.isError ? (
        <Alert
          showIcon
          type="error"
          message="Không thể tải cài đặt thông báo"
          action={<button className="font-semibold text-blue-600" onClick={() => settingsQuery.refetch()}>Thử lại</button>}
        />
      ) : settings.length === 0 ? (
        <Alert
          showIcon
          type="warning"
          message="Chưa có loại thông báo"
          description="Backend chưa trả danh mục sự kiện. Hãy tải lại trang hoặc liên hệ quản trị hệ thống."
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200">
          <div className="hidden grid-cols-[1fr_150px_150px] gap-4 bg-slate-50 px-5 py-3 text-xs font-bold uppercase tracking-wide text-slate-500 sm:grid">
            <span>Loại sự kiện</span>
            <span>Trong hộp thư</span>
            <span>Push di động</span>
          </div>
          {settings.map((current) => {
            const eventType = current.eventType;
            const label = current.label || eventType;
            const isSaving = updateSetting.isPending && updateSetting.variables?.eventType === eventType;
            return (
              <div key={eventType} className="grid gap-4 border-t border-slate-100 px-5 py-4 first:border-t-0 sm:grid-cols-[1fr_150px_150px] sm:items-center">
                <div>
                  <p className="font-semibold text-slate-900">{label}</p>
                  {current.label && (
                    <p className="mt-0.5 font-mono text-xs text-slate-400">{eventType}</p>
                  )}
                  {!current.customized && (
                    <p className="mt-1 text-xs text-slate-500">Đang dùng mặc định hệ thống</p>
                  )}
                </div>
                <label className="flex items-center justify-between gap-3 text-sm text-slate-600 sm:justify-start">
                  <span className="flex items-center gap-1.5 sm:hidden"><Bell className="h-4 w-4" /> Hộp thư</span>
                  <Switch
                    aria-label={`Thông báo trong hộp thư cho ${label}`}
                    checked={current.inAppEnabled}
                    loading={isSaving}
                    onChange={(enabled) => updateChannel(eventType, "inAppEnabled", enabled)}
                  />
                </label>
                <label className="flex items-center justify-between gap-3 text-sm text-slate-600 sm:justify-start">
                  <span className="flex items-center gap-1.5 sm:hidden"><Smartphone className="h-4 w-4" /> Push</span>
                  <Switch
                    aria-label={`Push di động cho ${label}`}
                    checked={current.pushEnabled}
                    loading={isSaving}
                    onChange={(enabled) => updateChannel(eventType, "pushEnabled", enabled)}
                  />
                </label>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
        <BellRing className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
        Loại sự kiện chưa từng được tùy chỉnh sẽ dùng trạng thái mặc định do Backend trả về.
      </div>
    </div>
  );
}
