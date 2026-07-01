"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Tabs, Tag } from "antd";
import { ArrowLeft, Building2, Settings, ShieldCheck, CreditCard } from "lucide-react";
import { useTenantStore } from "@/stores/tenant.store";
import { ROUTES, ADMIN_ROUTES } from "@/constants/routes";
import UpdateTenantForm from "./UpdateTenantForm";
import TenantSettingsPage from "./TenantSettingsPage";
import IpWhitelistTable from "./IpWhitelistTable";
import SubscriptionManager from "@/features/admin/subscription/components/SubscriptionManager";
import DetailHeader from "@/components/shared/layout/DetailHeader";
import ContentCard from "@/components/shared/layout/ContentCard";

export default function TenantDetailPage({ id }: { id: string }) {
  const router = useRouter();
  const activeTenant = useTenantStore((state) => state.activeTenant);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Nếu không có activeTenant trong store (do F5 lại trang), đẩy về list
    if (!activeTenant) {
      router.push(ADMIN_ROUTES.TENANTS);
    }
  }, [activeTenant, router]);

  if (!mounted || !activeTenant) {
    return null; // Tránh hydration mismatch và đợi redirect
  }

  const items = [
    {
      key: "info",
      label: (
        <span className="flex items-center gap-2">
          <Building2 className="w-4 h-4" />
          Thông tin chung
        </span>
      ),
      children: <UpdateTenantForm tenant={activeTenant} />,
    },
    {
      key: "settings",
      label: (
        <span className="flex items-center gap-2">
          <Settings className="w-4 h-4" />
          Giao diện
        </span>
      ),
      children: <TenantSettingsPage tenantId={id} />,
    },
    {
      key: "security",
      label: (
        <span className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4" />
          Bảo mật IP
        </span>
      ),
      children: <IpWhitelistTable tenantId={id} />,
    },
    {
      key: "subscription",
      label: (
        <span className="flex items-center gap-2">
          <CreditCard className="w-4 h-4" />
          Gói dịch vụ
        </span>
      ),
      children: <SubscriptionManager tenantId={id} />,
    },
  ];

  return (
    <div className="space-y-6">
      <DetailHeader
        onBack={() => router.push(ADMIN_ROUTES.TENANTS)}
        title={activeTenant.name}
        subtitle={`${activeTenant.domain || activeTenant.slug} • ${activeTenant.industry || "Chưa cập nhật lĩnh vực"} • ${activeTenant.countryCode || "Global"}`}
        avatarUrl={activeTenant.logoUrl}
        avatarFallback={<Building2 className="w-6 h-6" />}
        tags={
          <Tag color={activeTenant.status === "active" ? "success" : activeTenant.status === "inactive" ? "warning" : activeTenant.status === "trial" ? "processing" : "error"}>
            {activeTenant.status === "active" ? "Hoạt động" : activeTenant.status === "inactive" ? "Tạm dừng" : activeTenant.status === "trial" ? "Dùng thử" : "Đình chỉ"}
          </Tag>
        }
      />

      {/* Tabs Wrapper */}
      <ContentCard className="p-6">
        <Tabs
          defaultActiveKey="info"
          items={items}
          className="[&_.ant-tabs-nav]:mb-6 [&_.ant-tabs-tab]:px-4 [&_.ant-tabs-tab]:py-3 [&_.ant-tabs-tab-active_.ant-tabs-tab-btn]:text-brand-600 [&_.ant-tabs-ink-bar]:bg-brand-600"
        />
      </ContentCard>
    </div>
  );
}
