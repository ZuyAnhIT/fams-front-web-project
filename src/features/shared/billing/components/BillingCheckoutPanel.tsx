"use client";

import { useMemo, useState } from "react";
import { Alert, App, Radio, Skeleton, Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  Building2,
  Check,
  CreditCard,
  Database,
  ExternalLink,
  RefreshCw,
  ShieldCheck,
  Users,
  XCircle,
} from "lucide-react";
import BaseButton from "@/components/ui/BaseButton";
import { usePlanLimits, usePlans } from "@/features/admin/subscription/hooks/use-subscription";
import type { PlanResponse } from "@/features/admin/subscription/types/subscription.type";
import { cn } from "@/utils/cn";
import { useCancelBillingOrder, useCreateBillingOrder, useTenantBillingOrders } from "../hooks/use-billing";
import type {
  BillingCycle,
  BillingOrder,
  BillingOrderStatus,
  CurrentSubscriptionSummary,
} from "../types/billing.type";

const money = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

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

const subscriptionStatusMeta = {
  TRIAL: { label: "Dùng thử", color: "processing" },
  ACTIVE: { label: "Đang sử dụng", color: "success" },
  EXPIRED: { label: "Đã hết hạn", color: "error" },
  CANCELLED: { label: "Đã hủy", color: "default" },
} as const;

function limitText(value?: number | null, unit = "") {
  return value == null ? "Không giới hạn" : `${value.toLocaleString("vi-VN")}${unit}`;
}

function PlanCard({
  plan,
  billingCycle,
  selected,
  current,
  disabled,
  onSelect,
}: {
  plan: PlanResponse;
  billingCycle: BillingCycle;
  selected: boolean;
  current: boolean;
  disabled: boolean;
  onSelect: () => void;
}) {
  const limitsQuery = usePlanLimits(plan.id, true);
  const limits = limitsQuery.data;
  const price = billingCycle === "YEARLY" ? plan.priceYearly : plan.priceMonthly;
  const yearlySaving = plan.priceMonthly * 12 - plan.priceYearly;

  const benefits = [
    { icon: Users, text: `${limitText(limits?.maxEmployees)} nhân viên` },
    { icon: Building2, text: `${limitText(limits?.maxSites)} công trình` },
    { icon: Database, text: `${limitText(limits?.maxStorageGb, " GB")} lưu trữ` },
    { icon: ShieldCheck, text: `${limitText(limits?.maxRandomChecksPerMonth)} lượt kiểm tra/tháng` },
  ];

  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        "relative flex min-h-72 w-full flex-col rounded-2xl border bg-white p-5 text-left transition-all",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
        selected
          ? "border-blue-600 shadow-[0_8px_30px_rgba(37,99,235,0.14)] ring-1 ring-blue-600"
          : "border-slate-200 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md",
        disabled && "cursor-not-allowed opacity-60 hover:translate-y-0 hover:shadow-none",
      )}
    >
      <div className="mb-4 flex min-h-7 items-start justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          {current && <Tag color="green" className="!m-0">Gói hiện tại</Tag>}
          {billingCycle === "YEARLY" && yearlySaving > 0 && (
            <Tag color="blue" className="!m-0">Tiết kiệm {money.format(yearlySaving)}</Tag>
          )}
        </div>
        <span
          className={cn(
            "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border",
            selected ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300 text-transparent",
          )}
        >
          <Check className="h-4 w-4" aria-hidden="true" />
        </span>
      </div>

      <h4 className="text-lg font-bold text-slate-900">{plan.displayName}</h4>
      <p className="mt-1 min-h-10 text-sm leading-5 text-slate-500">
        {plan.description || "Gói dịch vụ dành cho doanh nghiệp."}
      </p>
      <div className="my-4 border-b border-slate-100 pb-4">
        <span className="text-2xl font-extrabold tracking-tight text-slate-950">{money.format(price)}</span>
        <span className="ml-1 text-sm text-slate-500">/{billingCycle === "YEARLY" ? "năm" : "tháng"}</span>
      </div>

      {limitsQuery.isLoading ? (
        <Skeleton active title={false} paragraph={{ rows: 4, width: ["75%", "65%", "80%", "70%"] }} />
      ) : (
        <ul className="space-y-2.5 text-sm text-slate-700">
          {benefits.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-center gap-2">
              <Icon className="h-4 w-4 shrink-0 text-blue-600" aria-hidden="true" />
              <span>{text}</span>
            </li>
          ))}
        </ul>
      )}
    </button>
  );
}

export default function BillingCheckoutPanel({
  tenantId,
  currentSubscription,
}: {
  tenantId: string;
  currentSubscription?: CurrentSubscriptionSummary;
}) {
  const { message, modal } = App.useApp();
  const [planId, setPlanId] = useState<string>();
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(
    currentSubscription?.billingCycle || "MONTHLY",
  );
  const plansQuery = usePlans(true, { page: 0, size: 100 });
  const ordersQuery = useTenantBillingOrders(tenantId, 0, 20);
  const createOrder = useCreateBillingOrder();
  const cancelOrder = useCancelBillingOrder();
  const plans = useMemo(
    () => (plansQuery.data?.content ?? []).filter((plan) => {
      const price = billingCycle === "YEARLY" ? plan.priceYearly : plan.priceMonthly;
      return price > 0 && Number.isSafeInteger(price);
    }),
    [plansQuery.data, billingCycle],
  );
  const selectedPlan = plans.find((plan) => plan.id === planId)
    || plans.find((plan) => plan.id === currentSubscription?.planId)
    || plans[0];
  const selectedPrice = selectedPlan
    ? billingCycle === "YEARLY" ? selectedPlan.priceYearly : selectedPlan.priceMonthly
    : undefined;
  const openOrder = ordersQuery.data?.content.find((order) =>
    ["CREATING", "PENDING", "PROCESSING", "UNDERPAID"].includes(order.status));
  const currentStatus = currentSubscription?.status
    ? subscriptionStatusMeta[currentSubscription.status]
    : undefined;

  const createAndRedirect = async () => {
    if (!selectedPlan) {
      message.warning("Vui lòng chọn gói dịch vụ");
      return;
    }
    try {
      const order = await createOrder.mutateAsync({
        tenantId,
        payload: { planId: selectedPlan.id, billingCycle },
      });
      if (!order.checkoutUrl) throw new Error("Cổng thanh toán chưa trả về đường dẫn checkout");
      window.location.assign(order.checkoutUrl);
    } catch (error) {
      const detail = error as { response?: { data?: { message?: string } }; message?: string };
      message.error(detail.response?.data?.message || detail.message || "Không thể tạo thanh toán");
    }
  };

  const beginCheckout = () => {
    if (!selectedPlan || selectedPrice == null) {
      message.warning("Vui lòng chọn gói dịch vụ");
      return;
    }
    const isRenewal = currentSubscription?.planId === selectedPlan.id;
    modal.confirm({
      title: isRenewal ? `Xác nhận gia hạn gói ${selectedPlan.displayName}` : `Xác nhận mua gói ${selectedPlan.displayName}`,
      width: 520,
      okText: `Thanh toán ${money.format(selectedPrice)}`,
      cancelText: "Xem lại",
      centered: true,
      content: (
        <div className="mt-4 space-y-3 text-sm text-slate-600">
          <div className="rounded-lg bg-slate-50 p-3">
            <div className="flex justify-between gap-4"><span>Chu kỳ</span><strong className="text-slate-900">{billingCycle === "YEARLY" ? "Hàng năm" : "Hàng tháng"}</strong></div>
            <div className="mt-2 flex justify-between gap-4"><span>Tổng thanh toán</span><strong className="text-lg text-blue-700">{money.format(selectedPrice)}</strong></div>
          </div>
          <p>
            {isRenewal && currentSubscription?.status === "ACTIVE"
              ? "Thời hạn mới sẽ được cộng tiếp sau ngày hết hạn hiện tại khi PayOS xác nhận đã thanh toán."
              : currentSubscription?.planId && currentSubscription.planId !== selectedPlan.id
                ? "Gói mới có hiệu lực ngay khi PayOS xác nhận thanh toán; thời gian còn lại của gói cũ không được quy đổi hoặc hoàn lại."
                : "Gói sẽ được kích hoạt ngay khi PayOS xác nhận thanh toán thành công."}
          </p>
          <p>Bạn sẽ được chuyển sang PayOS để quét VietQR hoặc chuyển khoản ngân hàng.</p>
        </div>
      ),
      onOk: createAndRedirect,
    });
  };

  const confirmCancel = (order: BillingOrder) => {
    modal.confirm({
      title: "Hủy yêu cầu thanh toán?",
      content: `Mã đơn #${order.orderCode} sẽ không thể tiếp tục thanh toán.`,
      okText: "Hủy yêu cầu",
      cancelText: "Quay lại",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await cancelOrder.mutateAsync({ tenantId, orderId: order.id });
          message.success("Đã hủy yêu cầu thanh toán");
        } catch (error) {
          const detail = error as { response?: { data?: { message?: string } } };
          message.error(detail.response?.data?.message || "Không thể hủy yêu cầu");
        }
      },
    });
  };

  const columns: ColumnsType<BillingOrder> = [
    { title: "Mã đơn", dataIndex: "orderCode", render: (value) => `#${value}` },
    { title: "Gói", dataIndex: "planDisplayName" },
    { title: "Chu kỳ", dataIndex: "billingCycle", render: (value) => value === "YEARLY" ? "Năm" : "Tháng" },
    { title: "Số tiền", dataIndex: "amount", align: "right", render: (value) => money.format(value) },
    {
      title: "Trạng thái",
      dataIndex: "status",
      render: (value: BillingOrderStatus) => <Tag color={statusMeta[value].color}>{statusMeta[value].label}</Tag>,
    },
    { title: "Ngày tạo", dataIndex: "createdAt", render: (value) => new Date(value).toLocaleString("vi-VN") },
    {
      title: "Thao tác",
      key: "actions",
      render: (_, order) => (
        <div className="flex gap-2">
          {order.checkoutUrl && ["PENDING", "PROCESSING", "UNDERPAID"].includes(order.status) && (
            <BaseButton size="small" icon={<ExternalLink className="h-3.5 w-3.5" />} onClick={() => window.location.assign(order.checkoutUrl!)}>
              Thanh toán
            </BaseButton>
          )}
          {["CREATING", "PENDING", "PROCESSING", "UNDERPAID"].includes(order.status) && (
            <BaseButton size="small" danger icon={<XCircle className="h-3.5 w-3.5" />} onClick={() => confirmCancel(order)}>
              Hủy
            </BaseButton>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {currentSubscription && (
        <section className="grid gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-3 sm:p-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Gói đang sử dụng</p>
            <p className="mt-1 text-lg font-bold text-slate-900">{currentSubscription.planDisplayName || "Chưa có gói"}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Trạng thái</p>
            <div className="mt-1">{currentStatus ? <Tag color={currentStatus.color}>{currentStatus.label}</Tag> : "—"}</div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Ngày hết hạn</p>
            <p className="mt-1 font-semibold text-slate-800">
              {currentSubscription.expiresAt ? new Date(currentSubscription.expiresAt).toLocaleDateString("vi-VN") : "Không thời hạn"}
            </p>
          </div>
        </section>
      )}

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="mb-5 flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-blue-600" aria-hidden="true" />
            <div>
              <h3 className="font-bold text-slate-900">Chọn gói dịch vụ</h3>
              <p className="text-sm text-slate-500">Thanh toán bằng VND qua VietQR hoặc chuyển khoản trên PayOS.</p>
            </div>
          </div>
          <Radio.Group
            value={billingCycle}
            buttonStyle="solid"
            disabled={Boolean(openOrder)}
            onChange={(event) => setBillingCycle(event.target.value)}
          >
            <Radio.Button value="MONTHLY">Hàng tháng</Radio.Button>
            <Radio.Button value="YEARLY">Hàng năm · tiết kiệm 2 tháng</Radio.Button>
          </Radio.Group>
        </div>

        {openOrder && (
          <Alert
            className="mb-5"
            showIcon
            type={openOrder.status === "UNDERPAID" ? "warning" : "info"}
            title={`Đơn #${openOrder.orderCode} đang chờ hoàn tất`}
            description={`${openOrder.planDisplayName} · ${money.format(openOrder.amount)} · hết hạn ${new Date(openOrder.expiresAt).toLocaleString("vi-VN")}. Hoàn tất hoặc hủy đơn này trước khi tạo đơn mới.`}
            action={(
              <div className="flex flex-wrap gap-2">
                {openOrder.checkoutUrl && (
                  <BaseButton type="primary" onClick={() => window.location.assign(openOrder.checkoutUrl!)}>
                    Tiếp tục thanh toán
                  </BaseButton>
                )}
                <BaseButton danger onClick={() => confirmCancel(openOrder)}>Hủy đơn</BaseButton>
              </div>
            )}
          />
        )}

        {plansQuery.isError ? (
          <Alert
            type="error"
            showIcon
            title="Không thể tải danh sách gói"
            description="Vui lòng kiểm tra kết nối rồi thử lại."
            action={<BaseButton onClick={() => plansQuery.refetch()}>Thử lại</BaseButton>}
          />
        ) : plansQuery.isSuccess && plans.length === 0 ? (
          <Alert
            type="warning"
            showIcon
            title="Chưa có gói trả phí hợp lệ"
            description="Platform Admin cần cấu hình giá tháng/năm bằng số VND nguyên trước khi mở thanh toán."
          />
        ) : plansQuery.isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[0, 1, 2, 3].map((item) => <Skeleton.Node key={item} active className="!h-72 !w-full" />)}
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {plans.map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  billingCycle={billingCycle}
                  selected={plan.id === selectedPlan?.id}
                  current={plan.id === currentSubscription?.planId}
                  disabled={Boolean(openOrder)}
                  onSelect={() => setPlanId(plan.id)}
                />
              ))}
            </div>

            <div className="mt-6 flex flex-col gap-4 rounded-xl border border-blue-100 bg-blue-50/70 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-slate-600">Gói đã chọn</p>
                <p className="font-bold text-slate-900">
                  {selectedPlan?.displayName || "Chưa chọn gói"}
                  {selectedPrice != null && <span className="ml-2 text-blue-700">{money.format(selectedPrice)}</span>}
                </p>
                <p className="mt-1 text-xs text-slate-500">Số tiền thanh toán một lần; hệ thống không tự động trừ tiền định kỳ.</p>
              </div>
              <BaseButton
                type="primary"
                size="large"
                disabled={!selectedPlan || Boolean(openOrder)}
                loading={createOrder.isPending}
                icon={<ExternalLink className="h-4 w-4" />}
                onClick={beginCheckout}
              >
                Thanh toán qua PayOS
              </BaseButton>
            </div>
          </>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-slate-900">Lịch sử thanh toán</h3>
            <p className="text-sm text-slate-500">Trạng thái được xác nhận và đối soát tự động từ PayOS.</p>
          </div>
          <BaseButton size="small" icon={<RefreshCw className="h-3.5 w-3.5" />} loading={ordersQuery.isFetching} onClick={() => ordersQuery.refetch()}>
            Làm mới
          </BaseButton>
        </div>
        <Table<BillingOrder>
          rowKey="id"
          size="small"
          loading={ordersQuery.isLoading}
          dataSource={ordersQuery.data?.content ?? []}
          columns={columns}
          scroll={{ x: 900 }}
          pagination={false}
          locale={{ emptyText: "Chưa có giao dịch thanh toán" }}
        />
      </section>
    </div>
  );
}
