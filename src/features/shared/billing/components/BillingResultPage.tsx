"use client";

import { useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert, Result, Spin, Tag } from "antd";
import Link from "next/link";
import { billingService } from "../services/billing.service";
import { useAuthStore } from "@/stores/auth.store";
import { CUSTOMER_ROUTES } from "@/constants/routes";

const finalStatuses = new Set(["PAID", "CANCELLED", "EXPIRED", "FAILED"]);

export default function BillingResultPage({ orderId }: { orderId?: string }) {
  const tenantId = useAuthStore((state) => state.user?.tenantId);
  const queryClient = useQueryClient();
  const providerRefreshRequested = useRef(false);
  const query = useQuery({
    queryKey: ["billing-order-result", tenantId, orderId],
    queryFn: async () => {
      const shouldRefreshProvider = !providerRefreshRequested.current;
      providerRefreshRequested.current = true;
      const order = shouldRefreshProvider
        ? await billingService.refreshForTenant(tenantId!, orderId!)
        : await billingService.getForTenant(tenantId!, orderId!);
      if (order.status === "PAID") {
        queryClient.invalidateQueries({ queryKey: ["tenant-subscription", tenantId] });
        queryClient.invalidateQueries({ queryKey: ["tenant-detail", tenantId] });
      }
      return order;
    },
    enabled: Boolean(tenantId && orderId),
    refetchInterval: (state) => finalStatuses.has(state.state.data?.status ?? "") ? false : 2500,
  });

  if (!tenantId || !orderId) {
    return <Alert type="error" showIcon title="Không xác định được giao dịch" />;
  }
  if (query.isLoading) return <div className="flex min-h-96 items-center justify-center"><Spin size="large" /></div>;
  if (query.error || !query.data) {
    return <Result status="error" title="Không thể kiểm tra thanh toán" subTitle="Vui lòng mở lịch sử thanh toán để kiểm tra lại." extra={<Link href={CUSTOMER_ROUTES.BILLING}>Về trang thanh toán</Link>} />;
  }

  const order = query.data;
  const paid = order.status === "PAID";
  const waiting = ["CREATING", "PENDING", "PROCESSING", "UNDERPAID"].includes(order.status);
  return (
    <Result
      status={paid ? "success" : waiting ? "info" : "warning"}
      title={paid ? "Thanh toán thành công" : waiting ? "Đang chờ PayOS xác nhận" : "Thanh toán chưa hoàn tất"}
      subTitle={<span>Đơn #{order.orderCode} · {order.planDisplayName} · <Tag>{order.status}</Tag></span>}
      extra={<Link className="font-semibold text-blue-700" href={CUSTOMER_ROUTES.BILLING}>Xem lịch sử thanh toán</Link>}
    />
  );
}
