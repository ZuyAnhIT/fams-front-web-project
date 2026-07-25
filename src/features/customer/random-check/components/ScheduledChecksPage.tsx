"use client";

import { useState } from "react";
import { Alert, App, Space, Tag } from "antd";
import { format } from "date-fns";
import { RadioTower, Send, XCircle } from "lucide-react";
import ContentCard from "@/components/shared/layout/ContentCard";
import DataTable from "@/components/tables/DataTable";
import { BaseButton, BaseInput, BaseSelect } from "@/components/ui";
import { useAuthStore } from "@/stores/auth.store";
import { useMyRolesQuery } from "@/features/admin/role-permission/hooks/use-role-permission";
import { useSitesQuery } from "@/features/customer/site/hooks/use-site";
import {
  useCancelScheduledCheck,
  useDispatchScheduledCheck,
  useScheduledChecksQuery,
} from "../hooks/use-scheduled-check";
import type { ScheduledCheckResponse } from "../types";

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

export function ScheduledChecksPage() {
  const { message, modal } = App.useApp();
  const user = useAuthStore((state) => state.user);
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const tenantId = user?.tenantId || "";
  const [siteId, setSiteId] = useState<string>();
  const [status, setStatus] = useState<string>();
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);

  const { data: myRoles, isLoading: isLoadingMyRoles } = useMyRolesQuery();
  const relevantAssignments = (myRoles?.data || []).filter(
    (assignment) =>
      assignment.tenantId === tenantId
      && assignment.permissions?.some((permission) =>
        ["randomchecks:list", "randomchecks:configure"].includes(permission)),
  );
  const isRestrictedToSites = relevantAssignments.length > 0
    && relevantAssignments.every((assignment) => (assignment.siteIds?.length || 0) > 0);

  const { data: sitesData, isLoading: isLoadingSites } = useSitesQuery({
    tenantId,
    status: "active",
    size: 100,
  });
  const canLoadChecks = !isLoadingMyRoles
    && Boolean(tenantId)
    && (!isRestrictedToSites || Boolean(siteId));
  const { data, isLoading, isFetching } = useScheduledChecksQuery({
    tenantId,
    siteId,
    status,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    page,
    size,
  }, canLoadChecks);
  const cancelMutation = useCancelScheduledCheck();
  const dispatchMutation = useDispatchScheduledCheck();
  const canConfigure = hasPermission("randomchecks:configure");

  const runDispatch = async (checkId: string) => {
    try {
      await dispatchMutation.mutateAsync({ tenantId, checkId });
      message.success("Đã đưa lịch kiểm tra vào luồng gửi ngay");
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Không thể gửi lịch kiểm tra");
    }
  };

  const confirmCancel = (checkId: string) => {
    modal.confirm({
      title: "Hủy lịch kiểm tra?",
      content: "Lịch đã phản hồi, không phản hồi hoặc đã hủy sẽ bị backend từ chối.",
      okText: "Hủy lịch",
      okType: "danger",
      cancelText: "Quay lại",
      onOk: async () => {
        try {
          await cancelMutation.mutateAsync({ tenantId, checkId });
          message.success("Đã hủy lịch kiểm tra");
        } catch (error: any) {
          message.error(error?.response?.data?.message || "Không thể hủy lịch kiểm tra");
        }
      },
    });
  };

  const columns = [
    {
      title: "Ngày kiểm tra",
      dataIndex: "checkDate",
      key: "checkDate",
      render: (value: string) => format(new Date(`${value}T00:00:00`), "dd/MM/yyyy"),
    },
    {
      title: "Thời điểm gửi",
      dataIndex: "scheduledAt",
      key: "scheduledAt",
      render: (value: string) => format(new Date(value), "dd/MM/yyyy HH:mm"),
    },
    {
      title: "Nhân viên",
      dataIndex: "employeeId",
      key: "employeeId",
      render: (value: string) => <span className="font-mono text-xs">{value}</span>,
    },
    {
      title: "Công trình",
      dataIndex: "siteId",
      key: "siteId",
      render: (value: string) => sitesData?.data?.content.find((site) => site.id === value)?.name || value,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (value: string) => {
        const meta = statusMeta[value] || { label: value, color: "default" };
        return <Tag color={meta.color}>{meta.label}</Tag>;
      },
    },
    ...(canConfigure ? [{
      title: "Thao tác",
      key: "actions",
      render: (_: unknown, check: ScheduledCheckResponse) => (
        <Space>
          {check.status === "pending" && (
            <BaseButton
              size="small"
              icon={<Send className="h-4 w-4" />}
              onClick={() => runDispatch(check.id)}
            >
              Gửi ngay
            </BaseButton>
          )}
          {["pending", "sent"].includes(check.status) && (
            <BaseButton
              size="small"
              danger
              icon={<XCircle className="h-4 w-4" />}
              onClick={() => confirmCancel(check.id)}
            >
              Hủy
            </BaseButton>
          )}
        </Space>
      ),
    }] : []),
  ];

  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      <div>
        <h1 className="flex items-center gap-3 text-2xl font-bold text-slate-900 sm:text-3xl">
          <RadioTower className="h-7 w-7 text-blue-600" />
          Lịch kiểm tra ngẫu nhiên
        </h1>
        <p className="mt-1 text-sm text-slate-500">Theo dõi lịch đã tạo, gửi ngay hoặc hủy trong đúng phạm vi công trình được cấp.</p>
      </div>

      {isRestrictedToSites && !siteId && (
        <Alert
          type="warning"
          showIcon
          message="Bạn được giới hạn theo công trình"
          description="Chọn một công trình cụ thể trước khi tải lịch kiểm tra. Backend sẽ từ chối truy cập công trình ngoài phạm vi."
        />
      )}

      <ContentCard className="p-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <BaseSelect
            aria-label="Lọc theo công trình"
            placeholder={isRestrictedToSites ? "Chọn công trình bắt buộc" : "Tất cả công trình"}
            allowClear={!isRestrictedToSites}
            loading={isLoadingSites}
            value={siteId}
            onChange={(value) => {
              setSiteId(value);
              setPage(0);
            }}
            options={(sitesData?.data?.content || []).map((site) => ({ value: site.id, label: site.name }))}
          />
          <BaseSelect
            aria-label="Lọc trạng thái lịch kiểm tra"
            placeholder="Tất cả trạng thái"
            allowClear
            value={status}
            onChange={(value) => {
              setStatus(value);
              setPage(0);
            }}
            options={statusOptions}
          />
          <BaseInput aria-label="Từ ngày" type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
          <BaseInput aria-label="Đến ngày" type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
        </div>
      </ContentCard>

      <ContentCard className="p-5">
        <DataTable
          ariaLabel="Danh sách lịch kiểm tra ngẫu nhiên"
          columns={columns as any}
          data={data?.data?.content || []}
          loading={isLoading || isFetching}
          totalElements={data?.data?.totalElements || 0}
          currentPage={page}
          pageSize={size}
          onPageChange={(nextPage, nextSize) => {
            setPage(nextPage);
            setSize(nextSize);
          }}
          emptyTitle={canLoadChecks ? "Chưa có lịch kiểm tra" : "Hãy chọn một công trình"}
          emptyDescription={canLoadChecks ? "Thử thay đổi bộ lọc ngày hoặc trạng thái." : "Dữ liệu chỉ được tải sau khi chọn site trong phạm vi."}
        />
      </ContentCard>
    </div>
  );
}
