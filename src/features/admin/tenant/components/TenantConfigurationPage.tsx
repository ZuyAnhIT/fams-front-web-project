"use client";

import { Alert, Tabs } from "antd";
import { Palette, ShieldCheck } from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";
import IpWhitelistTable from "./IpWhitelistTable";
import TenantSettingsPage from "./TenantSettingsPage";

export default function TenantConfigurationPage() {
  const tenantId = useAuthStore((state) => state.user?.tenantId);

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
        defaultActiveKey="display"
        items={[
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
        ]}
      />
    </div>
  );
}
