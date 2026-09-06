"use client";

import { useState } from "react";
import { Alert, App, Input, Select, Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import { FileSearch, RefreshCw, Search, X } from "lucide-react";
import BaseButton from "@/components/ui/BaseButton";
import { useAuthStore } from "@/stores/auth.store";
import { usePlatformBillingOrders, useRefreshPlatformBillingOrder } from "../hooks/use-billing";
import type {
  BillingCycle,
  BillingOrder,
  BillingOrderStatus,
  PlatformBillingQuery,
} from "../types/billing.type";
import BillingOrderDetailDrawer from "./BillingOrderDetailDrawer";

const money = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });
const statusMeta: Record<BillingOrderStatus, { label: string; color: string }> = {
  CREATING: { label: "Đang tạo", color: "processing" },
  PENDING: { label: "Chờ thanh toán", color: "gold" },
  PROCESSING: { label: "Đang xử lý", color: "processing" },
  UNDERPAID: { label: "Chưa thanh toán đủ", color: "warning" },
  PAID: { label: "Đã thanh toán", color: "success" },
  CANCELLED: { label: "Đã hủy", color: "default" },
  EXPIRED: { label: "Hết hạn", color: "default" },
  FAILED: { label: "Lỗi", color: "error" },
};
const statuses = (Object.keys(statusMeta) as BillingOrderStatus[]).map((value) => ({ value, label: statusMeta[value].label }));
const sortOptions = [
  { value: "createdAt:desc", label: "Mới nhất trước" },
  { value: "createdAt:asc", label: "Cũ nhất trước" },
  { value: "company:asc", label: "Tên công ty A–Z" },
  { value: "company:desc", label: "Tên công ty Z–A" },
  { value: "amount:desc", label: "Số tiền cao đến thấp" },
  { value: "amount:asc", label: "Số tiền thấp đến cao" },
] as const;
type SortOption = (typeof sortOptions)[number]["value"];

export default function PlatformBillingPage() {
  const { message } = App.useApp();
  const canList = useAuthStore((state) => state.hasPermission("billing:list"));
  const canUpdate = useAuthStore((state) => state.hasPermission("billing:update"));
  const [searchDraft, setSearchDraft] = useState("");
  const [searchValue, setSearchValue] = useState<string>();
  const [status, setStatus] = useState<BillingOrderStatus>();
  const [billingCycle, setBillingCycle] = useState<BillingCycle>();
  const [sortOption, setSortOption] = useState<SortOption>("createdAt:desc");
  const [selectedOrder, setSelectedOrder] = useState<BillingOrder>();
  const [page, setPage] = useState(0);
  const [sortBy, sortDir] = sortOption.split(":") as [NonNullable<PlatformBillingQuery["sortBy"]>, NonNullable<PlatformBillingQuery["sortDir"]>];
  const query = usePlatformBillingOrders({ search: searchValue, status, billingCycle, sortBy, sortDir, page, size: 20 });
  const refresh = useRefreshPlatformBillingOrder();

  if (!canList) return <Alert type="error" showIcon title="Bạn không có quyền xem thanh toán nền tảng" />;

  const applySearch = () => {
    setSearchValue(searchDraft.trim() || undefined);
    setPage(0);
  };
  const clearFilters = () => {
    setSearchDraft("");
    setSearchValue(undefined);
    setStatus(undefined);
    setBillingCycle(undefined);
    setSortOption("createdAt:desc");
    setPage(0);
  };
  const reconcile = async (order: BillingOrder) => {
    try {
      const updated = await refresh.mutateAsync(order.id);
      if (selectedOrder?.id === order.id) setSelectedOrder(updated);
      message.success(`Đã đối soát đơn #${order.orderCode}`);
    } catch (error) {
      const detail = error as { response?: { data?: { message?: string } } };
      message.error(detail.response?.data?.message || "Không thể đối soát đơn");
    }
  };

  const columns: ColumnsType<BillingOrder> = [
    { title: "Mã đơn", dataIndex: "orderCode", width: 105, render: (value) => `#${value}` },
    { title: "Công ty", dataIndex: "tenantName", width: 230, ellipsis: true, render: (value) => <span className="font-semibold text-slate-800">{value || "Chưa xác định"}</span> },
    { title: "Gói", dataIndex: "planDisplayName", width: 150 },
    { title: "Chu kỳ", dataIndex: "billingCycle", width: 100, render: (value) => value === "YEARLY" ? "Năm" : "Tháng" },
    { title: "Phải thu", dataIndex: "amount", width: 130, align: "right", render: (value) => money.format(value) },
    { title: "Đã nhận", dataIndex: "amountPaid", width: 130, align: "right", render: (value) => money.format(value) },
    { title: "Trạng thái", dataIndex: "status", width: 155, render: (value: BillingOrderStatus) => <Tag color={statusMeta[value].color}>{statusMeta[value].label}</Tag> },
    { title: "Thời gian", dataIndex: "createdAt", width: 165, render: (value) => new Date(value).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }) },
    {
      title: "Thao tác", key: "actions", fixed: "right", width: 205,
      render: (_, order) => (
        <div className="flex gap-2">
          <BaseButton size="small" icon={<FileSearch className="h-3.5 w-3.5" />} onClick={() => setSelectedOrder(order)}>Chi tiết</BaseButton>
          {canUpdate && ["PENDING", "PROCESSING", "UNDERPAID"].includes(order.status) && (
            <BaseButton size="small" loading={refresh.isPending && refresh.variables === order.id} icon={<RefreshCw className="h-3.5 w-3.5" />} onClick={() => reconcile(order)}>Đối soát</BaseButton>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 py-1">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Quản lý thanh toán</h1>
        <p className="mt-1 text-sm text-slate-600">Theo dõi giao dịch theo công ty, đối soát PayOS và tình trạng phát hành hóa đơn.</p>
      </header>
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 grid gap-3 lg:grid-cols-[minmax(280px,1fr)_190px_170px_210px_auto]">
          <Input allowClear value={searchDraft} prefix={<Search className="h-4 w-4 text-slate-400" aria-hidden="true" />} placeholder="Tên công ty, mã đơn, gói hoặc mã giao dịch" onChange={(event) => setSearchDraft(event.target.value)} onPressEnter={applySearch} />
          <Select allowClear value={status} placeholder="Tất cả trạng thái" options={statuses} onChange={(value) => { setStatus(value); setPage(0); }} />
          <Select allowClear value={billingCycle} placeholder="Mọi chu kỳ" options={[{ value: "MONTHLY", label: "Hàng tháng" }, { value: "YEARLY", label: "Hàng năm" }]} onChange={(value) => { setBillingCycle(value); setPage(0); }} />
          <Select value={sortOption} aria-label="Sắp xếp thanh toán" options={[...sortOptions]} onChange={(value: SortOption) => { setSortOption(value); setPage(0); }} />
          <div className="flex gap-2">
            <BaseButton type="primary" onClick={applySearch}>Lọc</BaseButton>
            <BaseButton aria-label="Xóa bộ lọc" icon={<X className="h-4 w-4" />} onClick={clearFilters} />
          </div>
        </div>
        <div className="billing-table app-scrollbar">
          <Table<BillingOrder>
            rowKey="id" loading={query.isLoading} dataSource={query.data?.content ?? []} columns={columns}
            scroll={{ x: 1370 }}
            pagination={{ current: page + 1, pageSize: 20, total: query.data?.totalElements ?? 0, showSizeChanger: false, showTotal: (total) => `${total} giao dịch`, onChange: (nextPage) => setPage(nextPage - 1) }}
            locale={{ emptyText: "Không có giao dịch phù hợp" }}
            onRow={(order) => ({ onDoubleClick: () => setSelectedOrder(order) })}
          />
        </div>
      </section>
      <BillingOrderDetailDrawer order={selectedOrder} open={Boolean(selectedOrder)} onClose={() => setSelectedOrder(undefined)} />
    </div>
  );
}
