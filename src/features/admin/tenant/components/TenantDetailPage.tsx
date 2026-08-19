"use client";

import { useRouter } from "next/navigation";
import { Alert, Descriptions, Progress, Spin, Tabs, Tag } from "antd";
import { Building2, CreditCard, Gauge, Settings, ShieldCheck } from "lucide-react";
import { ADMIN_ROUTES } from "@/constants/routes";
import { SystemRole } from "@/features/customer/auth/types/auth.type";
import { useAuthStore } from "@/stores/auth.store";
import { useTenantDetail } from "../hooks/use-tenant";
import TenantSettingsPage from "./TenantSettingsPage";
import IpWhitelistTable from "./IpWhitelistTable";
import SubscriptionManager from "@/features/admin/subscription/components/SubscriptionManager";
import DetailHeader from "@/components/shared/layout/DetailHeader";
import ContentCard from "@/components/shared/layout/ContentCard";

function Usage({
  label,
  current,
  maximum,
}: {
  label: string;
  current?: number | null;
  maximum?: number | null;
}) {
  const percent = maximum && current != null ? Math.min(100, Math.round((current / maximum) * 100)) : 0;
  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <div className="mb-2 flex justify-between gap-3 text-sm">
        <span className="font-semibold text-slate-700">{label}</span>
        <span>
          {current == null ? "API chưa có số đã dùng" : current.toLocaleString("vi-VN")}
          {" / "}
          {maximum == null ? "Không giới hạn" : maximum.toLocaleString("vi-VN")}
        </span>
      </div>
      {maximum != null && current != null && <Progress percent={percent} status={percent >= 100 ? "exception" : "active"} />}
    </div>
  );
}

export default function TenantDetailPage({ id }: { id: string }) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isPlatformAdmin = user?.role === SystemRole.PLATFORM_ADMIN;
  const { data: tenant, isLoading, error } = useTenantDetail(id);

  if (isLoading) {
    return <div className="flex min-h-96 items-center justify-center"><Spin size="large" /></div>;
  }

  if (error || !tenant) {
    const status = (error as { response?: { status?: number } } | undefined)?.response?.status;
    return (
      <Alert
        showIcon
        type="error"
        title={status === 404 ? "Không tìm thấy công ty" : "Không tải được chi tiết công ty"}
        description={status === 403 ? "Tài khoản cần quyền tenants:read." : "Vui lòng quay lại danh sách và thử lại."}
        action={<button onClick={() => router.push(ADMIN_ROUTES.TENANTS)}>Quay lại</button>}
      />
    );
  }

  const overview = (
    <div className="space-y-6">
      <Alert
        showIcon
        type="info"
        title="Hồ sơ công ty chỉ do chủ sở hữu chỉnh sửa"
        description="Platform Admin và Platform Staff chỉ được xem hồ sơ tại đây. Các thao tác vòng đời và subscription được tách riêng theo đúng phân quyền backend."
      />
      <Descriptions bordered column={{ xs: 1, md: 2 }} size="small">
        <Descriptions.Item label="Tên">{tenant.name}</Descriptions.Item>
        <Descriptions.Item label="Slug">{tenant.slug}</Descriptions.Item>
        <Descriptions.Item label="Tên miền">{tenant.domain || "—"}</Descriptions.Item>
        <Descriptions.Item label="Lĩnh vực">{tenant.industry || "—"}</Descriptions.Item>
        <Descriptions.Item label="Quốc gia">{tenant.countryCode || "—"}</Descriptions.Item>
        <Descriptions.Item label="Múi giờ">{tenant.timezone || "—"}</Descriptions.Item>
        <Descriptions.Item label="Ngôn ngữ">{tenant.locale || "—"}</Descriptions.Item>
        <Descriptions.Item label="Owner ID">{tenant.ownerId}</Descriptions.Item>
      </Descriptions>

      <div>
        <h3 className="mb-3 flex items-center gap-2 font-bold text-slate-800">
          <Gauge className="h-5 w-5 text-blue-600" /> Mức sử dụng và giới hạn
        </h3>
        <div className="grid gap-3 md:grid-cols-2">
          <Usage label="Nhân viên" current={tenant.currentEmployeeCount} maximum={tenant.maxEmployees} />
          <Usage label="Công trình" current={tenant.currentSiteCount} maximum={tenant.maxSites} />
          <Usage label="Kiểm tra ngẫu nhiên tháng này" current={tenant.currentMonthRandomChecks} maximum={tenant.maxRandomChecksPerMonth} />
          <Usage
            label="Dung lượng lưu trữ (GB)"
            current={Math.round(tenant.currentStorageGb * 1000) / 1000}
            maximum={tenant.maxStorageGb}
          />
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Dung lượng đã dùng chỉ tính avatar và bằng chứng giải trình vi phạm (S3/MinIO) — CHƯA
          gồm ảnh Face ID (hệ thống AI riêng), là mức tối thiểu chứ không phải tổng chính xác.
        </p>
      </div>

      <Descriptions bordered column={{ xs: 1, md: 2 }} size="small" title="Subscription hiện tại">
        <Descriptions.Item label="Gói">{tenant.planDisplayName || tenant.planName || "Chưa gán"}</Descriptions.Item>
        <Descriptions.Item label="Trạng thái">{tenant.subscriptionStatus || "—"}</Descriptions.Item>
        <Descriptions.Item label="Chu kỳ">{tenant.billingCycle || "—"}</Descriptions.Item>
        <Descriptions.Item label="Hết hạn">{tenant.subscriptionExpiresAt ? new Date(tenant.subscriptionExpiresAt).toLocaleString("vi-VN") : "Không thời hạn"}</Descriptions.Item>
      </Descriptions>
    </div>
  );

  const items = [
    {
      key: "overview",
      label: <span className="flex items-center gap-2"><Building2 className="h-4 w-4" /> Tổng quan vận hành</span>,
      children: overview,
    },
    ...(isPlatformAdmin ? [
      {
        key: "settings",
        label: <span className="flex items-center gap-2"><Settings className="h-4 w-4" /> Giao diện (chỉ xem)</span>,
        children: <TenantSettingsPage tenantId={id} canEdit={false} />,
      },
      {
        key: "security",
        label: <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Hỗ trợ: IP whitelist</span>,
        children: <IpWhitelistTable tenantId={id} canManage />,
      },
      {
        key: "subscription",
        label: <span className="flex items-center gap-2"><CreditCard className="h-4 w-4" /> Gói dịch vụ</span>,
        children: <SubscriptionManager tenantId={id} canManage />,
      },
    ] : []),
  ];

  return (
    <div className="space-y-6">
      <DetailHeader
        onBack={() => router.push(ADMIN_ROUTES.TENANTS)}
        title={tenant.name}
        subtitle={`${tenant.domain || tenant.slug} • ${tenant.industry || "Chưa cập nhật lĩnh vực"} • ${tenant.countryCode || "Global"}`}
        avatarUrl={tenant.logoUrl}
        avatarFallback={<Building2 className="h-6 w-6" />}
        tags={<Tag color={tenant.status === "active" ? "success" : tenant.status === "trial" ? "processing" : "error"}>{tenant.status.toUpperCase()}</Tag>}
      />
      <ContentCard className="p-6">
        <Tabs defaultActiveKey="overview" items={items} />
      </ContentCard>
    </div>
  );
}
