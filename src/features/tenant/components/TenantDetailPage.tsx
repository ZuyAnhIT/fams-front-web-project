"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Tabs, Tag } from "antd";
import { ArrowLeft, Building2, Settings, ShieldCheck, CreditCard } from "lucide-react";
import BaseButton from "@/components/ui/BaseButton";
import { useTenantStore } from "@/stores/tenant.store";
import { ROUTES } from "@/constants/routes";
import UpdateTenantForm from "./UpdateTenantForm";
import TenantSettingsPage from "./TenantSettingsPage";
import IpWhitelistTable from "./IpWhitelistTable";
import SubscriptionManager from "@/features/subscription/components/SubscriptionManager";

export default function TenantDetailPage({ id }: { id: string }) {
  const router = useRouter();
  const activeTenant = useTenantStore((state) => state.activeTenant);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Nếu không có activeTenant trong store (do F5 lại trang), đẩy về list
    if (!activeTenant) {
      router.push(ROUTES.TENANTS);
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <BaseButton
            icon={<ArrowLeft className="w-4 h-4" />}
            onClick={() => router.push(ROUTES.TENANTS)}
            className="border-none shadow-none text-brand-500 hover:text-brand-700 bg-transparent hover:bg-brand-50"
          />
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-brand-950">{activeTenant.name}</h1>
              <Tag color={activeTenant.status === "active" ? "success" : activeTenant.status === "inactive" ? "warning" : "error"}>
                {activeTenant.status === "active" ? "Hoạt động" : activeTenant.status === "inactive" ? "Tạm dừng" : "Đình chỉ"}
              </Tag>
            </div>
            <p className="text-sm text-brand-500 mt-1">Quản lý toàn diện cấu hình và gói dịch vụ của công ty</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-brand-100 p-6 min-h-[500px]">
        <Tabs defaultActiveKey="info" items={items} />
      </div>
    </div>
  );
}
