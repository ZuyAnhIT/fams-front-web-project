"use client";

import { useState } from "react";
import { Alert, App, Input, Select, Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import { RefreshCw } from "lucide-react";
import BaseButton from "@/components/ui/BaseButton";
import { useAuthStore } from "@/stores/auth.store";
import { usePlatformBillingOrders, useRefreshPlatformBillingOrder } from "../hooks/use-billing";
import type { BillingOrder, BillingOrderStatus } from "../types/billing.type";

const money = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });
const statuses: BillingOrderStatus[] = ["PENDING", "PROCESSING", "UNDERPAID", "PAID", "CANCELLED", "EXPIRED", "FAILED"];
const colors: Record<BillingOrderStatus, string> = {
  CREATING: "processing", PENDING: "gold", PROCESSING: "processing", UNDERPAID: "warning",
  PAID: "success", CANCELLED: "default", EXPIRED: "default", FAILED: "error",
};

export default function PlatformBillingPage() {
  const { message } = App.useApp();
  const canList = useAuthStore((state) => state.hasPermission("billing:list"));
  const canUpdate = useAuthStore((state) => state.hasPermission("billing:update"));
  const [tenantIdDraft, setTenantIdDraft] = useState("");
  const [tenantId, setTenantId] = useState<string>();
  const [status, setStatus] = useState<BillingOrderStatus>();
  const [page, setPage] = useState(0);
  const query = usePlatformBillingOrders({ tenantId, status, page, size: 20 });
  const refresh = useRefreshPlatformBillingOrder();

  if (!canList) {
    return <Alert type="error" showIcon title="Bạn không có quyền xem thanh toán nền tảng" />;
  }

  const columns: ColumnsType<BillingOrder> = [
    { title: "Mã đơn", dataIndex: "orderCode", render: (value) => `#${value}` },
    { title: "Tenant", dataIndex: "tenantId", ellipsis: true, width: 190 },
    { title: "Gói", dataIndex: "planDisplayName" },
    { title: "Chu kỳ", dataIndex: "billingCycle", render: (value) => value === "YEARLY" ? "Năm" : "Tháng" },
    { title: "Số tiền", dataIndex: "amount", align: "right", render: (value) => money.format(value) },
    { title: "Đã nhận", dataIndex: "amountPaid", align: "right", render: (value) => money.format(value) },
    { title: "Trạng thái", dataIndex: "status", render: (value: BillingOrderStatus) => <Tag color={colors[value]}>{value}</Tag> },
    { title: "Thời gian", dataIndex: "createdAt", render: (value) => new Date(value).toLocaleString("vi-VN") },
    {
      title: "Đối soát",
      key: "refresh",
      render: (_, order) => canUpdate && ["PENDING", "PROCESSING", "UNDERPAID"].includes(order.status) ? (
        <BaseButton
          size="small"
          loading={refresh.isPending && refresh.variables === order.id}
          icon={<RefreshCw className="h-3.5 w-3.5" />}
          onClick={async () => {
            try {
              await refresh.mutateAsync(order.id);
              message.success(`Đã đối soát đơn #${order.orderCode}`);
            } catch (error) {
              const detail = error as { response?: { data?: { message?: string } } };
              message.error(detail.response?.data?.message || "Không thể đối soát đơn");
            }
          }}
        >
          Đồng bộ
        </BaseButton>
      ) : "—",
    },
  ];

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 py-1">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Quản lý thanh toán</h1>
        <p className="mt-1 text-sm text-slate-600">Theo dõi và đối soát các đơn thanh toán gói qua PayOS.</p>
      </header>
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 grid gap-3 md:grid-cols-[1fr_220px_auto]">
          <Input
            value={tenantIdDraft}
            placeholder="Lọc theo Tenant ID"
            onChange={(event) => setTenantIdDraft(event.target.value)}
            onPressEnter={() => { setTenantId(tenantIdDraft.trim() || undefined); setPage(0); }}
          />
          <Select
            allowClear
            value={status}
            placeholder="Tất cả trạng thái"
            options={statuses.map((value) => ({ value, label: value }))}
            onChange={(value) => { setStatus(value); setPage(0); }}
          />
          <BaseButton onClick={() => { setTenantId(tenantIdDraft.trim() || undefined); setPage(0); }}>Lọc</BaseButton>
        </div>
        <Table<BillingOrder>
          rowKey="id"
          loading={query.isLoading}
          dataSource={query.data?.content ?? []}
          columns={columns}
          scroll={{ x: 1100 }}
          pagination={{
            current: page + 1,
            pageSize: 20,
            total: query.data?.totalElements ?? 0,
            showSizeChanger: false,
            onChange: (nextPage) => setPage(nextPage - 1),
          }}
          locale={{ emptyText: "Chưa có đơn thanh toán" }}
        />
      </section>
    </div>
  );
}
