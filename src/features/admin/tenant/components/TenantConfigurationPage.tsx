"use client";

import { Alert, Tabs } from "antd";
import { Building2, CreditCard, Palette, ShieldCheck } from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";
import IpWhitelistTable from "./IpWhitelistTable";
import TenantSettingsPage from "./TenantSettingsPage";
import UpdateTenantForm from "./UpdateTenantForm";
import SubscriptionManager from "@/features/admin/subscription/components/SubscriptionManager";

export default function TenantConfigurationPage() {
  const tenantId = useAuthStore((state) => state.user?.tenantId);
  const user = useAuthStore((state) => state.user);
  const membership = user?.memberships?.find((item) => item.tenantId === tenantId);

  if (!tenantId) {
    return (
      <Alert
        type="error"
        showIcon
        message="Không xác định được công ty"
        description="Phiên đăng nhập hiện tại chưa có thông tin công ty. Vui lòng đăng nhập lại hoặc liên hệ quản trị viên nền tảng."
      />
    );
  }

  return (
    <div className="min-h-[460px] rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-5">
      <Tabs
        defaultActiveKey="profile"
        items={[
          {
            key: "profile",
            label: (
              <span className="flex items-center gap-2">
                <Building2 className="h-4 w-4" aria-hidden="true" />
                Hồ sơ công ty
              </span>
            ),
            children: (
              <div>
                <Alert
                  type="info"
                  showIcon
                  className="mb-5"
                  message="Chỉ chủ sở hữu được lưu thay đổi"
                  description="Frontend chỉ hiển thị màn này cho TENANT_ADMIN; backend tiếp tục xác minh userId đúng ownerId và trả 403 cho quản trị viên được gán nhưng không phải chủ sở hữu."
                />
                <UpdateTenantForm tenantId={tenantId} tenantName={membership?.tenantName} />
              </div>
            ),
          },
          {
            key: "display",
            label: (
              <span className="flex items-center gap-2">
                <Palette className="h-4 w-4" aria-hidden="true" />
                Hiển thị
              </span>
            ),
            children: <TenantSettingsPage tenantId={tenantId} />,
          },
          {
            key: "security",
            label: (
              <span className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                Danh sách IP an toàn
              </span>
            ),
            children: <IpWhitelistTable tenantId={tenantId} />,
          },
          {
            key: "subscription",
            label: (
              <span className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" aria-hidden="true" />
                Gói dịch vụ
              </span>
            ),
            children: <SubscriptionManager tenantId={tenantId} canManage={false} />,
          },
        ]}
      />
    </div>
  );
}
