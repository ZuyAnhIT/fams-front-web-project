"use client";

import { Descriptions, Progress, Tag } from "antd";
import { CreditCard, Gauge } from "lucide-react";
import type { TenantOperationalDetail } from "../types/tenant.type";
import BillingCheckoutPanel from "@/features/shared/billing/components/BillingCheckoutPanel";

function UsageMetric({
  label,
  current,
  maximum,
}: {
  label: string;
  current?: number | null;
  maximum?: number | null;
}) {
  const hasUsage = current !== undefined && current !== null;
  const percent = maximum && hasUsage
    ? Math.min(100, Math.round((current / maximum) * 100))
    : 0;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-2 flex justify-between gap-3 text-sm">
        <span className="font-semibold text-slate-700">{label}</span>
        <span className="text-slate-600">
          {hasUsage ? current.toLocaleString("vi-VN") : "Chưa có số liệu"}
          {" / "}
          {maximum == null ? "Không giới hạn" : maximum.toLocaleString("vi-VN")}
        </span>
      </div>
      {maximum != null && hasUsage && (
        <Progress
          percent={percent}
          status={percent >= 100 ? "exception" : percent >= 80 ? "normal" : "active"}
          strokeColor={percent >= 80 && percent < 100 ? "#f59e0b" : undefined}
        />
      )}
    </div>
  );
}

export default function TenantUsagePanel({ tenant }: { tenant: TenantOperationalDetail }) {
  const statusColor = tenant.subscriptionStatus === "ACTIVE"
    ? "success"
    : tenant.subscriptionStatus === "TRIAL"
      ? "processing"
      : tenant.subscriptionStatus === "EXPIRED"
        ? "error"
        : "default";

  return (
    <div className="mx-auto max-w-4xl space-y-6 pt-2">
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="mb-5 flex items-center gap-2 border-b border-slate-100 pb-4">
          <CreditCard className="h-5 w-5 text-blue-600" aria-hidden="true" />
          <h3 className="text-lg font-bold text-slate-800">Gói dịch vụ hiện tại</h3>
        </div>
        <Descriptions bordered column={{ xs: 1, md: 2 }} size="small">
          <Descriptions.Item label="Gói">
            {tenant.planDisplayName || tenant.planName || "Chưa gán"}
          </Descriptions.Item>
          <Descriptions.Item label="Trạng thái">
            <Tag color={statusColor}>{tenant.subscriptionStatus || "—"}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Chu kỳ">
            {tenant.billingCycle === "YEARLY"
              ? "Hàng năm"
              : tenant.billingCycle === "MONTHLY"
                ? "Hàng tháng"
                : "—"}
          </Descriptions.Item>
          <Descriptions.Item label="Hết hạn">
            {tenant.subscriptionExpiresAt
              ? new Date(tenant.subscriptionExpiresAt).toLocaleString("vi-VN")
              : "Không thời hạn"}
          </Descriptions.Item>
        </Descriptions>
      </div>

      <div>
        <h3 className="mb-3 flex items-center gap-2 font-bold text-slate-800">
          <Gauge className="h-5 w-5 text-blue-600" aria-hidden="true" />
          Mức sử dụng
        </h3>
        <div className="grid gap-3 md:grid-cols-2">
          <UsageMetric label="Nhân viên" current={tenant.currentEmployeeCount} maximum={tenant.maxEmployees} />
          <UsageMetric label="Công trình" current={tenant.currentSiteCount} maximum={tenant.maxSites} />
          <UsageMetric
            label="Kiểm tra ngẫu nhiên tháng này"
            current={tenant.currentMonthRandomChecks}
            maximum={tenant.maxRandomChecksPerMonth}
          />
          <UsageMetric
            label="Dung lượng lưu trữ (GB)"
            current={Math.round(tenant.currentStorageGb * 1000) / 1000}
            maximum={tenant.maxStorageGb}
          />
        </div>
      </div>

      <BillingCheckoutPanel
        tenantId={tenant.id}
        currentSubscription={{
          planId: tenant.planId,
          planDisplayName: tenant.planDisplayName || tenant.planName,
          status: tenant.subscriptionStatus,
          billingCycle: tenant.billingCycle,
          expiresAt: tenant.subscriptionExpiresAt,
        }}
      />

      <p className="text-xs text-slate-500">
        Dung lượng đã dùng chỉ tính file avatar và bằng chứng giải trình vi phạm (S3/MinIO) — CHƯA
        gồm ảnh đăng ký/chấm công Face ID (lưu ở hệ thống AI riêng), nên số liệu là mức tối thiểu,
        không phải tổng chính xác.
      </p>
    </div>
  );
}
