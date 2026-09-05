"use client";

import { Alert, Skeleton } from "antd";
import { useTenantDetail } from "@/features/admin/tenant/hooks/use-tenant";
import { useAuthStore } from "@/stores/auth.store";
import BillingCheckoutPanel from "./BillingCheckoutPanel";

export default function CustomerBillingPage() {
  const tenantId = useAuthStore((state) => state.user?.tenantId);
  const tenantQuery = useTenantDetail(tenantId ?? "", Boolean(tenantId));
  if (!tenantId) {
    return <Alert type="warning" showIcon title="Chưa chọn công ty" description="Vui lòng chọn công ty trước khi thanh toán gói." />;
  }
  return (
    <div className="mx-auto max-w-[1600px] space-y-6 py-1">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Gói & thanh toán</h1>
        <p className="mt-1 text-sm text-slate-600">Quản lý gói dịch vụ, thanh toán và lịch sử giao dịch của công ty.</p>
      </header>
      {tenantQuery.isLoading ? <Skeleton active paragraph={{ rows: 8 }} /> : (
        <BillingCheckoutPanel
          tenantId={tenantId}
          currentSubscription={tenantQuery.data ? {
            planId: tenantQuery.data.planId,
            planDisplayName: tenantQuery.data.planDisplayName || tenantQuery.data.planName,
            status: tenantQuery.data.subscriptionStatus,
            billingCycle: tenantQuery.data.billingCycle,
            expiresAt: tenantQuery.data.subscriptionExpiresAt,
          } : undefined}
        />
      )}
    </div>
  );
}
