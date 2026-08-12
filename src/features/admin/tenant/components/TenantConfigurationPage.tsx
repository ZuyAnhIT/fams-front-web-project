"use client";

import { Alert, Result, Spin, Tabs } from "antd";
import { Building2, CreditCard, Palette, ShieldCheck } from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";
import IpWhitelistTable from "./IpWhitelistTable";
import TenantSettingsPage from "./TenantSettingsPage";
import TenantUsagePanel from "./TenantUsagePanel";
import UpdateTenantForm from "./UpdateTenantForm";
import { useTenantDetail } from "../hooks/use-tenant";

export default function TenantConfigurationPage() {
  const tenantId = useAuthStore((state) => state.user?.tenantId);
  const userId = useAuthStore((state) => state.user?.id);
  const { data: tenant, isLoading, error } = useTenantDetail(tenantId || "", Boolean(tenantId));

  if (!tenantId) {
    return (
      <Alert
        type="error"
        showIcon
        title="Không xác định được công ty"
        description="Phiên đăng nhập hiện tại chưa có công ty đang hoạt động. Vui lòng chọn công ty hoặc đăng nhập lại."
      />
    );
  }

  if (isLoading) {
    return <div className="flex min-h-96 items-center justify-center"><Spin size="large" /></div>;
  }

  const status = (error as { response?: { status?: number } } | undefined)?.response?.status;
  const isOwner = Boolean(tenant && userId && tenant.ownerId === userId);

  if (error || !tenant || !isOwner) {
    return (
      <Result
        status="403"
        title="Chỉ chủ sở hữu được quản trị công ty"
        subTitle={status === 403
          ? "Bạn là thành viên hoặc quản trị viên được gán, nhưng không phải chủ sở hữu của công ty này."
          : "Không thể xác minh quyền chủ sở hữu. Vui lòng tải lại trang hoặc liên hệ hỗ trợ."}
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
            label: <span className="flex items-center gap-2"><Building2 className="h-4 w-4" /> Hồ sơ công ty</span>,
            children: (
              <div>
                <Alert
                  type="success"
                  showIcon
                  className="mb-5"
                  title="Bạn là chủ sở hữu công ty"
                  description="Chỉ các trường thực sự thay đổi được gửi lên backend."
                />
                <UpdateTenantForm tenant={tenant} tenantId={tenantId} />
              </div>
            ),
          },
          {
            key: "display",
            label: <span className="flex items-center gap-2"><Palette className="h-4 w-4" /> Giao diện & định dạng</span>,
            children: <TenantSettingsPage tenantId={tenantId} canEdit />,
          },
          {
            key: "security",
            label: <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Bảo mật IP</span>,
            children: <IpWhitelistTable tenantId={tenantId} canManage />,
          },
          {
            key: "subscription",
            label: <span className="flex items-center gap-2"><CreditCard className="h-4 w-4" /> Gói & mức sử dụng</span>,
            children: <TenantUsagePanel tenant={tenant} />,
          },
        ]}
      />
    </div>
  );
}
