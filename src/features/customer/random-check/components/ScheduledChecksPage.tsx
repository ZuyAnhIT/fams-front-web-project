"use client";

import { useMemo, useState } from "react";
import { Alert, App, Card, Space, Statistic, Tabs, Tag, Tooltip } from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { Eye, RadioTower, Send, UserRoundSearch, XCircle } from "lucide-react";
import ContentCard from "@/components/shared/layout/ContentCard";
import DataTable from "@/components/tables/DataTable";
import { BaseButton, BaseInput, BaseSelect } from "@/components/ui";
import { useAuthStore } from "@/stores/auth.store";
import { useMyRolesQuery } from "@/features/admin/role-permission/hooks/use-role-permission";
import { useSitesQuery } from "@/features/customer/site/hooks/use-site";
import { useEmployees } from "@/features/customer/employee/hooks/use-employee";
import { formatVietnameseName } from "@/utils/name.util";
import {
  useCancelScheduledCheck,
  useDispatchScheduledCheck,
  useScheduledChecksQuery,
  useScheduledCheckSummary,
} from "../hooks/use-scheduled-check";
import type { ScheduledCheckResponse } from "../types";
import ManualRandomCheckModal from "./ManualRandomCheckModal";
import RandomCheckConfigManagement from "./RandomCheckConfigManagement";
import ScheduledCheckDetailModal from "./ScheduledCheckDetailModal";

const statusOptions = [
  { value: "pending", label: "Chờ gửi" },
  { value: "sent", label: "Đã gửi" },
  { value: "responded", label: "Đã phản hồi" },
  { value: "no_response", label: "Không phản hồi" },
  { value: "cancelled", label: "Đã hủy" },
];

const statusMeta: Record<string, { label: string; color: string }> = {
  pending: { label: "Chờ gửi", color: "gold" },
  sent: { label: "Đã gửi", color: "blue" },
  responded: { label: "Đã phản hồi", color: "green" },
  no_response: { label: "Không phản hồi", color: "red" },
  cancelled: { label: "Đã hủy", color: "default" },
};

const outcomeMeta: Record<string, { label: string; color: string }> = {
  pass: { label: "Đạt", color: "success" },
  fail: { label: "Không đạt", color: "error" },
};

const failureLabels: Record<string, string> = {
  location_mismatch: "Ngoài geofence",
  face_fail: "Face ID không đạt/chưa đăng ký",
  liveness_fail: "Liveness không đạt",
  no_response: "Không phản hồi",
};

function getErrorMessage(error: unknown, fallback: string) {
  const data = (error as {
    response?: { data?: { userMessage?: string; message?: string } };
  }).response?.data;
  return data?.userMessage || data?.message || fallback;
}

export function ScheduledChecksPage() {
  const { message, modal } = App.useApp();
  const user = useAuthStore((state) => state.user);
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const tenantId = user?.tenantId || "";
  const [siteId, setSiteId] = useState<string>();
  const [employeeId, setEmployeeId] = useState<string>();
  const [status, setStatus] = useState<string>();
  const [dateFrom, setDateFrom] = useState(dayjs().startOf("month").format("YYYY-MM-DD"));
  const [dateTo, setDateTo] = useState(dayjs().endOf("month").format("YYYY-MM-DD"));
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [manualOpen, setManualOpen] = useState(false);
  const [selectedCheck, setSelectedCheck] = useState<ScheduledCheckResponse | null>(null);

  const { data: myRoles, isLoading: isLoadingMyRoles } = useMyRolesQuery();
  const relevantAssignments = (myRoles?.data || []).filter(
    (assignment) =>
      assignment.tenantId === tenantId &&
      assignment.permissions?.some((permission) =>
        ["randomchecks:list", "randomchecks:configure"].includes(permission),
      ),
  );
  const isRestrictedToSites =
    relevantAssignments.length > 0 &&
    relevantAssignments.every((assignment) => (assignment.siteIds?.length || 0) > 0);

  const { data: sitesData, isLoading: isLoadingSites } = useSitesQuery({
    tenantId,
    status: "active",
    size: 100,
    sortBy: "name",
    sortDir: "asc",
  });
  const sites = useMemo(() => sitesData?.data?.content ?? [], [sitesData?.data?.content]);
  const effectiveSiteId = siteId;
  const { data: employeePage } = useEmployees(
    { page: 0, size: 100, sortBy: "firstName", sortDir: "asc" },
    { enabled: Boolean(tenantId) },
  );
  const employees = useMemo(() => employeePage?.content ?? [], [employeePage?.content]);
  const employeeNames = useMemo(
    () => new Map(employees.map((employee) => [employee.id, formatVietnameseName(employee.firstName, employee.lastName)])),
    [employees],
  );
  const siteNames = useMemo(() => new Map(sites.map((site) => [site.id, site.name])), [sites]);

  const canLoadChecks =
    !isLoadingMyRoles &&
    Boolean(tenantId) &&
    (!isRestrictedToSites || Boolean(effectiveSiteId));
  const listParams = {
    tenantId,
    siteId: effectiveSiteId,
    employeeId,
    status,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    page,
    size,
  };
  const { data, isLoading, isFetching, isError, error } = useScheduledChecksQuery(listParams, canLoadChecks);
  const summary = useScheduledCheckSummary(
    tenantId,
    { siteId: effectiveSiteId, dateFrom: dateFrom || undefined, dateTo: dateTo || undefined },
    canLoadChecks,
  );
  const cancelMutation = useCancelScheduledCheck();
  const dispatchMutation = useDispatchScheduledCheck();
  const canConfigure = hasPermission("randomchecks:configure");

  const runDispatch = async (checkId: string) => {
    try {
      await dispatchMutation.mutateAsync({ tenantId, checkId });
      message.success("Đã gửi thông báo kiểm tra ngay.");
    } catch (dispatchError: unknown) {
      message.error(getErrorMessage(dispatchError, "Không thể gửi lịch kiểm tra."));
    }
  };

  const confirmCancel = (checkId: string) => {
    modal.confirm({
      title: "Hủy lượt kiểm tra?",
      content: "Chỉ lượt đang chờ gửi hoặc đã gửi nhưng chưa phản hồi mới có thể hủy.",
      okText: "Hủy lượt kiểm tra",
      okType: "danger",
      cancelText: "Quay lại",
      onOk: async () => {
        try {
          await cancelMutation.mutateAsync({ tenantId, checkId });
          message.success("Đã hủy lượt kiểm tra.");
        } catch (cancelError: unknown) {
          message.error(getErrorMessage(cancelError, "Không thể hủy lượt kiểm tra."));
          throw cancelError;
        }
      },
    });
  };

  const columns: ColumnsType<ScheduledCheckResponse> = [
    {
      title: (
        <Tooltip title="Giờ lên lịch là mốc dự kiến. Job dispatch quét theo chu kỳ nên thông báo có thể được phát trễ khoảng 60 giây; hãy dựa vào trạng thái của lượt kiểm tra.">
          <span className="cursor-help">Giờ dự kiến</span>
        </Tooltip>
      ),
      key: "scheduledAt",
      width: 165,
      render: (_, check) => (
        <div>
          <div className="font-medium">{dayjs(check.scheduledAt).format("DD/MM/YYYY HH:mm")}</div>
          <div className="text-xs text-slate-500">
            {check.manualReason ? "Gửi ngay · thủ công" : `Lượt tự động #${check.checkIndex}`}
          </div>
        </div>
      ),
    },
    {
      title: "Nhân viên",
      dataIndex: "employeeId",
      key: "employeeId",
      width: 190,
      render: (value: string, check) => check.employeeName || employeeNames.get(value) || <span className="font-mono text-xs">{value}</span>,
    },
    {
      title: "Công trình",
      dataIndex: "siteId",
      key: "siteId",
      width: 170,
      render: (value: string, check) => check.siteName || siteNames.get(value) || value,
    },
    {
      title: "Loại",
      key: "source",
      width: 135,
      render: (_, check) => check.manualReason ? (
        <Tooltip title={check.manualReason}><Tag color="purple">Thủ công</Tag></Tooltip>
      ) : <Tag>Tự động</Tag>,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 140,
      render: (value: string) => {
        const meta = statusMeta[value] || { label: value, color: "default" };
        return <Tag color={meta.color}>{meta.label}</Tag>;
      },
    },
    {
      title: "Kết quả",
      key: "outcome",
      width: 190,
      render: (_, check) => {
        if (!check.outcome) return "—";
        const meta = outcomeMeta[check.outcome] || { label: check.outcome, color: "default" };
        const reasons = check.failureReason
          ?.split(",")
          .map((reason) => failureLabels[reason.trim()] || reason.trim())
          .join(", ");
        return (
          <div>
            <Tag color={meta.color}>{meta.label}</Tag>
            {reasons && <div className="mt-1 text-xs text-red-600">{reasons}</div>}
          </div>
        );
      },
    },
    {
      title: "Hạn phản hồi",
      dataIndex: "expiresAt",
      key: "expiresAt",
      width: 165,
      render: (value: string | null) => value ? dayjs(value).format("DD/MM/YYYY HH:mm:ss") : "—",
    },
    {
      title: "Thao tác",
      key: "actions",
      fixed: "right",
      width: 250,
      render: (_, check) => (
        <Space>
          <BaseButton size="small" icon={<Eye className="h-4 w-4" />} onClick={() => setSelectedCheck(check)}>
            Chi tiết
          </BaseButton>
          {canConfigure && check.status === "pending" && (
            <BaseButton size="small" icon={<Send className="h-4 w-4" />} onClick={() => runDispatch(check.id)}>
              Gửi ngay
            </BaseButton>
          )}
          {canConfigure && ["pending", "sent"].includes(check.status) && (
            <BaseButton size="small" danger icon={<XCircle className="h-4 w-4" />} onClick={() => confirmCancel(check.id)}>
              Hủy
            </BaseButton>
          )}
        </Space>
      ),
    },
  ];

  const historyContent = (
    <div className="space-y-5">
      {isRestrictedToSites && !effectiveSiteId && (
        <Alert
          type="warning"
          showIcon
          title="Bạn được giới hạn theo công trình"
          description="Chọn một công trình cụ thể trước khi tải dữ liệu. Backend tiếp tục kiểm tra site-scope trên mọi thao tác."
        />
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        {[
          ["Tổng lượt", "total", "#1677ff"],
          ["Chờ gửi", "pending", "#d48806"],
          ["Đã gửi", "sent", "#1677ff"],
          ["Đã phản hồi", "responded", "#389e0d"],
          ["Không phản hồi", "no_response", "#cf1322"],
          ["Đã hủy", "cancelled", "#64748b"],
        ].map(([title, key, color]) => (
          <Card size="small" key={key} loading={summary.isLoading}>
            <Statistic
              title={title}
              value={(summary.data?.data?.counts as Record<string, number> | undefined)?.[key] || 0}
              valueStyle={{ color, fontSize: 24 }}
            />
          </Card>
        ))}
      </div>

      <ContentCard className="p-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          <BaseSelect
            aria-label="Lọc theo công trình"
            placeholder={isRestrictedToSites ? "Chọn công trình bắt buộc" : "Tất cả công trình"}
            allowClear={!isRestrictedToSites}
            loading={isLoadingSites}
            value={effectiveSiteId}
            onChange={(value) => { setSiteId(value); setPage(0); }}
            options={sites.map((site) => ({ value: site.id, label: site.name }))}
          />
          <BaseSelect
            aria-label="Lọc theo nhân viên"
            placeholder="Tất cả nhân viên"
            showSearch
            optionFilterProp="label"
            allowClear
            value={employeeId}
            onChange={(value) => { setEmployeeId(value); setPage(0); }}
            options={employees.map((employee) => ({ value: employee.id, label: formatVietnameseName(employee.firstName, employee.lastName) }))}
          />
          <BaseSelect
            aria-label="Lọc trạng thái lịch kiểm tra"
            placeholder="Tất cả trạng thái"
            allowClear
            value={status}
            onChange={(value) => { setStatus(value); setPage(0); }}
            options={statusOptions}
          />
          <BaseInput aria-label="Từ ngày" type="date" value={dateFrom} onChange={(event) => { setDateFrom(event.target.value); setPage(0); }} />
          <BaseInput aria-label="Đến ngày" type="date" value={dateTo} onChange={(event) => { setDateTo(event.target.value); setPage(0); }} />
        </div>
      </ContentCard>

      {isError && (
        <Alert type="error" showIcon title="Không thể tải lịch kiểm tra" description={getErrorMessage(error, "Vui lòng thử lại.")} />
      )}

      <ContentCard className="p-5">
        <DataTable
          ariaLabel="Danh sách lịch kiểm tra ngẫu nhiên"
          columns={columns}
          data={data?.data?.content || []}
          loading={isLoading || isFetching}
          totalElements={data?.data?.totalElements || 0}
          currentPage={page}
          pageSize={size}
          onPageChange={(nextPage, nextSize) => { setPage(nextPage); setSize(nextSize); }}
          emptyTitle={canLoadChecks ? "Chưa có lịch kiểm tra" : "Hãy chọn một công trình"}
          emptyDescription={canLoadChecks ? "Thử thay đổi bộ lọc ngày, site, nhân viên hoặc trạng thái." : "Dữ liệu chỉ được tải sau khi chọn site trong phạm vi."}
          scroll={{ x: 1450 }}
        />
      </ContentCard>
    </div>
  );

  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-bold text-slate-900 sm:text-3xl">
            <RadioTower className="h-7 w-7 text-blue-600" />
            Kiểm tra ngẫu nhiên
          </h1>
          <p className="mt-1 text-sm text-slate-500">Thiết lập policy theo công ty/site và theo dõi bằng chứng kiểm tra nhân viên hiện trường.</p>
        </div>
        {canConfigure && (
          <BaseButton type="primary" icon={<UserRoundSearch className="h-4 w-4" />} onClick={() => setManualOpen(true)}>
            Kiểm tra ngay
          </BaseButton>
        )}
      </div>

      <Tabs
        defaultActiveKey="history"
        items={[
          { key: "history", label: "Lịch sử & vận hành", children: historyContent },
          ...(canConfigure ? [{ key: "configuration", label: "Cấu hình policy", children: <RandomCheckConfigManagement /> }] : []),
        ]}
      />

      <ManualRandomCheckModal
        key={`${effectiveSiteId || "all"}-${manualOpen ? "open" : "closed"}`}
        tenantId={tenantId}
        sites={sites}
        initialSiteId={effectiveSiteId}
        open={manualOpen}
        onClose={() => setManualOpen(false)}
        onCreated={(check) => {
          message.success(
            check.manualTriggerCountToday
              ? `Đã gửi kiểm tra. Đây là lần thứ ${check.manualTriggerCountToday} hôm nay với nhân viên này.`
              : "Đã gửi kiểm tra; thời gian phản hồi đang được tính từ bây giờ.",
          );
          setSelectedCheck(check);
        }}
      />
      <ScheduledCheckDetailModal
        tenantId={tenantId}
        check={selectedCheck}
        employeeName={selectedCheck?.employeeName || (selectedCheck ? employeeNames.get(selectedCheck.employeeId) : undefined)}
        siteName={selectedCheck?.siteName || (selectedCheck ? siteNames.get(selectedCheck.siteId) : undefined)}
        onClose={() => setSelectedCheck(null)}
      />
    </div>
  );
}
