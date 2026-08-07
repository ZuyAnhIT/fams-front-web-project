"use client";

import { useMemo, useState } from "react";
import { Alert, DatePicker, Statistic, Tabs, Tag, Tooltip } from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import {
  Activity,
  BellRing,
  Building2,
  DatabaseZap,
  HardDrive,
  RefreshCw,
  Search,
  ServerCog,
} from "lucide-react";
import ContentCard from "@/components/shared/layout/ContentCard";
import DataTable from "@/components/tables/DataTable";
import { BaseButton, BaseSelect } from "@/components/ui";
import { useNotificationDeliveryLogs, useSystemStatus } from "../hooks/use-system-operations";
import type {
  DeliveryLogParams,
  NotificationDeliveryLog,
  ScheduledJobStatus,
} from "../types/system-operations.type";
import GoLiveReadinessPanel from "./GoLiveReadinessPanel";
import { useAuthStore } from "@/stores/auth.store";
import { SystemRole } from "@/features/customer/auth/types/auth.type";

const { RangePicker } = DatePicker;

const JOB_LABELS: Record<string, string> = {
  AttendanceSummaryJob: "Tính lại bảng công hằng đêm",
  RandomCheckSchedulerJob: "Sinh random check đầu ca",
  RandomCheckDispatchJob: "Gửi random check",
  RandomCheckQueueReconciliationJob: "Đối soát hàng đợi random check",
  NoResponseViolationJob: "Phát hiện không phản hồi",
  DataRetentionJob: "Dọn dữ liệu quá hạn",
  SubscriptionExpirationJob: "Khóa tenant hết hạn subscription",
};

const DELIVERY_STATUS: Record<string, { color: string; label: string }> = {
  SUCCESS: { color: "success", label: "Thành công" },
  FAILED: { color: "error", label: "Thất bại" },
  FALLBACK_EMAIL_SENT: { color: "processing", label: "Đã gửi email dự phòng" },
  FALLBACK_EMAIL_FAILED: { color: "error", label: "Email dự phòng thất bại" },
};

const HEALTH_COMPONENT_META: Record<string, { label: string; description: string }> = {
  db: { label: "PostgreSQL", description: "Kết nối cơ sở dữ liệu chính" },
  redis: { label: "Redis", description: "Cache và hàng đợi realtime" },
  fcm: { label: "Firebase / FCM", description: "Nhà cung cấp push notification" },
  aiService: { label: "AI Service", description: "Face ID, liveness và embedding" },
  randomCheckJob: { label: "Random Check Job", description: "Phát hiện job dispatch/no-response bị trễ" },
  randomCheckQueue: { label: "Random Check Queue", description: "Độ sâu và độ trễ queue dispatch" },
  mail: { label: "Email provider", description: "Email mời, reset mật khẩu và fallback" },
  diskSpace: { label: "Dung lượng đĩa", description: "Không gian lưu trữ Backend" },
  ssl: { label: "SSL", description: "Chứng chỉ kết nối bảo mật" },
  ping: { label: "Application", description: "Tiến trình Backend đang phản hồi" },
};

function errorMessage(error: unknown, fallback: string) {
  const response = (error as { response?: { status?: number; data?: { message?: string } } })?.response;
  if (response?.status === 403) return "Bạn không có quyền system:read để xem dữ liệu vận hành nền tảng.";
  return response?.data?.message || fallback;
}

function statusTag(status?: string | null, stale = false) {
  const normalized = status?.toUpperCase() || "UNKNOWN";
  if (stale) return <Tooltip title="Lần cuối OK nhưng đã quá ngưỡng không chạy lại"><Tag color="warning">STALE</Tag></Tooltip>;
  if (normalized === "NEVER_RUN") return <Tooltip title="Job có trong catalog nhưng chưa từng ghi nhận lần chạy"><Tag color="default">NEVER RUN</Tag></Tooltip>;
  const healthy = ["UP", "OK", "SUCCESS", "COMPLETED"].includes(normalized);
  return <Tag color={healthy ? "success" : normalized === "UNKNOWN" ? "default" : "error"}>{normalized}</Tag>;
}

function DeliveryLogsPanel({ enabled }: { enabled: boolean }) {
  const [draft, setDraft] = useState<DeliveryLogParams>({ page: 0, size: 20 });
  const [params, setParams] = useState<DeliveryLogParams>({ page: 0, size: 20 });
  const query = useNotificationDeliveryLogs(params, enabled);

  const columns: ColumnsType<NotificationDeliveryLog> = [
    {
      title: "Thời gian",
      dataIndex: "createdAt",
      width: 180,
      render: (value: string) => dayjs(value).format("DD/MM/YYYY HH:mm:ss"),
    },
    {
      title: "Kênh",
      dataIndex: "channel",
      width: 150,
      render: (value: string) => <Tag color={value === "FCM" ? "blue" : "purple"}>{value}</Tag>,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      width: 210,
      render: (value: string) => {
        const meta = DELIVERY_STATUS[value] || { color: "default", label: value };
        return <Tag color={meta.color}>{meta.label}</Tag>;
      },
    },
    { title: "Lần thử", dataIndex: "attemptNumber", width: 100, align: "center" },
    {
      title: "Thiết bị",
      dataIndex: "deviceToken",
      width: 150,
      render: (value: string | null) => value ? <code className="text-xs">{value}</code> : "—",
    },
    {
      title: "Notification ID",
      dataIndex: "notificationId",
      width: 250,
      render: (value: string | null) => value ? <Tooltip title={value}><code className="block max-w-56 truncate text-xs">{value}</code></Tooltip> : <span className="text-slate-400">Push-only</span>,
    },
    {
      title: "Chi tiết lỗi",
      dataIndex: "errorMessage",
      width: 360,
      render: (value: string | null) => value ? <Tooltip title={value}><span className="block max-w-80 truncate text-red-600">{value}</span></Tooltip> : "—",
    },
  ];

  const reset = () => {
    const clean = { page: 0, size: params.size || 20 };
    setDraft(clean);
    setParams(clean);
  };

  return (
    <div className="space-y-4">
      <Alert
        showIcon
        type="info"
        message="Retry và email fallback do Backend tự xử lý"
        description="Mỗi dòng là một lần gửi thực tế. FCM thử tối đa 3 lần trên từng thiết bị; email dự phòng chỉ được dùng khi toàn bộ thiết bị của người dùng đều thất bại."
      />
      <ContentCard className="space-y-4 p-5">
        <div className="flex items-center gap-2 font-semibold text-slate-800"><Search className="h-4 w-4 text-blue-600" />Tra cứu lần gửi</div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <BaseSelect
            allowClear
            placeholder="Tất cả trạng thái"
            value={draft.status}
            options={Object.entries(DELIVERY_STATUS).map(([value, meta]) => ({ value, label: meta.label }))}
            onChange={(status) => setDraft((current) => ({ ...current, status }))}
          />
          <BaseSelect
            allowClear
            placeholder="Tất cả kênh"
            value={draft.channel}
            options={[{ value: "FCM", label: "FCM Push" }, { value: "EMAIL_FALLBACK", label: "Email dự phòng" }]}
            onChange={(channel) => setDraft((current) => ({ ...current, channel }))}
          />
          <RangePicker
            className="w-full"
            showTime
            value={draft.from && draft.to ? [dayjs(draft.from), dayjs(draft.to)] : null}
            onChange={(dates) => setDraft((current) => ({ ...current, from: dates?.[0]?.toISOString(), to: dates?.[1]?.toISOString() }))}
          />
        </div>
        <div className="flex justify-end gap-2">
          <BaseButton type="default" onClick={reset}>Đặt lại</BaseButton>
          <BaseButton icon={<Search className="h-4 w-4" />} onClick={() => setParams({ ...draft, page: 0, size: params.size || 20 })}>Áp dụng</BaseButton>
        </div>
      </ContentCard>
      {query.isError && <Alert showIcon type="error" message="Không thể tải lịch sử gửi" description={errorMessage(query.error, "Không thể tải delivery log.")} />}
      <DataTable
        ariaLabel="Lịch sử gửi thông báo"
        columns={columns}
        data={query.data?.content || []}
        loading={query.isLoading || query.isFetching}
        totalElements={query.data?.totalElements || 0}
        currentPage={params.page || 0}
        pageSize={params.size || 20}
        onPageChange={(page, size) => setParams((current) => ({ ...current, page, size }))}
        emptyTitle="Không có lần gửi phù hợp"
        emptyDescription="Thử đổi trạng thái, kênh hoặc khoảng thời gian."
        scroll={{ x: 1450 }}
      />
    </div>
  );
}

export default function SystemOperationsPage() {
  const user = useAuthStore((state) => state.user);
  const isPlatformAdmin = user?.role === SystemRole.PLATFORM_ADMIN;
  const canReadSystem = isPlatformAdmin || Boolean(user?.permissions?.includes("system:read"));
  const canManageGoLive = isPlatformAdmin || Boolean(user?.permissions?.includes("golive:manage"));
  const statusQuery = useSystemStatus(canReadSystem);
  const status = statusQuery.data;
  const healthComponents = useMemo(
    () => Object.entries(status?.healthComponents || {}),
    [status?.healthComponents],
  );
  const jobRows = useMemo(
    () => (status?.jobs || []).map((job) => ({ ...job, id: job.jobName })),
    [status?.jobs],
  );

  const jobColumns: ColumnsType<ScheduledJobStatus & { id: string }> = [
    {
      title: "Job",
      dataIndex: "jobName",
      width: 300,
      render: (value: string, record) => <div><p className="font-semibold text-slate-900">{JOB_LABELS[value] || value}</p><code className="text-[11px] text-slate-400">{value}</code>{record.description && <p className="mt-1 max-w-md text-xs text-slate-500">{record.description}</p>}</div>,
    },
    { title: "Trạng thái vận hành", dataIndex: "lastStatus", width: 180, render: (value: string, record) => statusTag(value, record.stale) },
    { title: "Chạy gần nhất", dataIndex: "lastRunAt", width: 190, render: (value: string | null) => value ? dayjs(value).format("DD/MM/YYYY HH:mm:ss") : "Chưa ghi nhận" },
    { title: "Chạy tiếp theo", dataIndex: "expectedNextRunAt", width: 190, render: (value: string | null) => value ? dayjs(value).format("DD/MM/YYYY HH:mm:ss") : "Chưa xác định" },
    { title: "Thời lượng", dataIndex: "lastRunDurationMs", width: 120, align: "right", render: (value: number | null) => value == null ? "—" : `${value.toLocaleString("vi-VN")} ms` },
    { title: "Ngưỡng stale", dataIndex: "staleThresholdMinutes", width: 130, align: "right", render: (value: number) => `${value.toLocaleString("vi-VN")} phút` },
    { title: "Lỗi", dataIndex: "errorMessage", width: 420, render: (value: string | null) => value ? <span className="text-red-600">{value}</span> : "—" },
  ];

  const overview = (
    <div className="space-y-5">
      {statusQuery.isError && <Alert showIcon type="error" message="Không thể tải trạng thái hệ thống" description={errorMessage(statusQuery.error, "Không thể kết nối API trạng thái hệ thống.")} />}
      {status && status.overallHealth.toUpperCase() !== "UP" && (
        <Alert showIcon type="error" message="Hệ thống đang có thành phần không khỏe" description="Kiểm tra chi tiết thành phần và job lỗi trước khi xử lý dữ liệu thủ công." />
      )}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <ContentCard className="p-5"><Statistic title="Sức khỏe tổng thể" value={status?.overallHealth || "—"} prefix={<Activity className="h-5 w-5 text-emerald-600" />} /></ContentCard>
        <ContentCard className="p-5"><Statistic title="Tenant đang hoạt động" value={status?.activeTenantCount ?? 0} prefix={<Building2 className="h-5 w-5 text-blue-600" />} /></ContentCard>
        <ContentCard className="p-5"><Statistic title="Hàng đợi Face Verify" value={status?.faceVerifyQueueDepth ?? 0} prefix={<DatabaseZap className="h-5 w-5 text-violet-600" />} /></ContentCard>
        <ContentCard className="p-5"><Statistic title="Hàng đợi Random Check" value={status?.dispatchQueueDepth ?? 0} prefix={<BellRing className="h-5 w-5 text-amber-600" />} /></ContentCard>
      </div>

      <ContentCard className="space-y-4 p-5">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900"><ServerCog className="h-5 w-5 text-blue-600" />Thành phần hạ tầng</h2>
          <p className="mt-1 text-sm text-slate-500">Dữ liệu trực tiếp từ health endpoint của Backend.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {healthComponents.map(([name, component]) => {
            const componentStatus = component.status;
            const details = component.details;
            const meta = HEALTH_COMPONENT_META[name] || { label: name, description: "Thành phần hạ tầng" };
            return <div key={name} className="rounded-lg border border-slate-200 px-4 py-3"><div className="flex items-center justify-between gap-3"><div><p className="font-medium text-slate-700">{meta.label}</p><p className="text-xs text-slate-400">{meta.description}</p></div>{statusTag(componentStatus)}</div>{details && Object.keys(details).length > 0 && <details className="mt-2"><summary className="cursor-pointer text-xs font-medium text-blue-600">Xem tín hiệu kỹ thuật</summary><pre className="mt-2 max-h-40 overflow-auto rounded bg-slate-950 p-2 text-[11px] text-slate-100">{JSON.stringify(details, null, 2)}</pre></details>}</div>;
          })}
          {!healthComponents.length && <p className="text-sm text-slate-500">Chưa có dữ liệu thành phần.</p>}
        </div>
      </ContentCard>

      <div>
        <div className="mb-3">
          <h2 className="text-lg font-semibold text-slate-900">Job định kỳ và tự phục hồi</h2>
          <p className="mt-1 text-sm text-slate-500">Bao gồm tính lại bảng công, random check, đối soát queue và retention.</p>
        </div>
        <DataTable
          ariaLabel="Trạng thái job định kỳ"
          columns={jobColumns}
          data={jobRows}
          loading={statusQuery.isLoading || statusQuery.isFetching}
          showPagination={false}
          emptyTitle="Không nhận được catalog job"
          emptyDescription="Backend phải luôn trả đủ 7 job, kể cả job có trạng thái NEVER_RUN. Hãy kiểm tra API System Status."
          scroll={{ x: 1550 }}
        />
      </div>

      <Alert
        showIcon
        type="warning"
        message="Retention hiện là policy toàn hệ thống"
        description="Bản Backend hiện tại dọn delivery log sau 30 ngày, notification đã đọc sau 90 ngày và ảnh chấm công/random-check sau 30 ngày; ảnh enrollment được xóa ngay khi thu hồi Face ID. Web chỉ giám sát DataRetentionJob, chưa có API cấu hình policy riêng theo tenant."
      />
    </div>
  );

  return (
    <div className="mx-auto max-w-[1700px] space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-bold text-slate-900 sm:text-3xl"><HardDrive className="h-7 w-7 text-blue-600" />Vận hành hệ thống</h1>
          <p className="mt-1 text-sm text-slate-500">Theo dõi job nền, hàng đợi và khả năng phân phối thông báo trên toàn nền tảng.</p>
          {status?.generatedAt && <p className="mt-1 text-xs text-slate-400">Dữ liệu tạo lúc {dayjs(status.generatedAt).format("DD/MM/YYYY HH:mm:ss")}; tự làm mới mỗi 60 giây.</p>}
        </div>
        {canReadSystem && <BaseButton type="default" loading={statusQuery.isFetching} icon={<RefreshCw className="h-4 w-4" />} onClick={() => void statusQuery.refetch()}>Làm mới</BaseButton>}
      </div>
      <Tabs items={[
        ...(canReadSystem ? [{ key: "health", label: "Sức khỏe & Job", children: overview }] : []),
        ...(canManageGoLive ? [{ key: "go-live", label: "Go-live & UAT", children: <GoLiveReadinessPanel status={status} loading={statusQuery.isLoading} /> }] : []),
        ...(canReadSystem ? [{ key: "delivery", label: "Delivery log", children: <DeliveryLogsPanel enabled={canReadSystem} /> }] : []),
      ]} />
    </div>
  );
}
