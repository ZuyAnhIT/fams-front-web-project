"use client";

import { useAuthStore } from "@/stores/auth.store";
import { Tabs, Alert } from "antd";
import { Building2, Settings, ShieldCheck } from "lucide-react";
import UpdateTenantForm from "@/features/admin/tenant/components/UpdateTenantForm";
import TenantSettingsPage from "@/features/admin/tenant/components/TenantSettingsPage";
import IpWhitelistTable from "@/features/admin/tenant/components/IpWhitelistTable";

export default function SettingsTenantPage() {
  const user = useAuthStore((state) => state.user);

  if (!user || !user.tenantId) {
    return (
      <div className="max-w-[1600px] mx-auto py-2">
        <Alert
          type="error"
          message="Lỗi truy cập"
          description="Tài khoản của bạn không thuộc bất kỳ công ty nào."
          showIcon
        />
      </div>
    );
  }

  const items = [
    {
      key: "info",
      label: (
        <span className="flex items-center gap-2">
          <Building2 className="w-4 h-4" />
          Hồ sơ công ty
        </span>
      ),
      children: (
        <div className="pt-2">
          <Alert 
            type="info" 
            showIcon 
            message="Lưu ý" 
            description="Do hệ thống chưa cung cấp dữ liệu cũ, bạn cần điền lại đầy đủ các trường thông tin muốn cập nhật." 
            className="mb-6 max-w-3xl"
          />
          <UpdateTenantForm tenant={null} tenantId={user.tenantId} />
        </div>
      ),
    },
    {
      key: "settings",
      label: (
        <span className="flex items-center gap-2">
          <Settings className="w-4 h-4" />
          Giao diện & Cấu hình
        </span>
      ),
      children: <TenantSettingsPage tenantId={user.tenantId} />,
    },
    {
      key: "security",
      label: (
        <span className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4" />
          Bảo mật IP
        </span>
      ),
      children: <IpWhitelistTable tenantId={user.tenantId} />,
    },
  ];

  return (
    <div className="max-w-[1600px] mx-auto py-2">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-brand-950">Quản lý Công ty</h1>
        <p className="text-sm text-brand-600 mt-1">
          Cập nhật hồ sơ, cấu hình giao diện, múi giờ và danh sách IP truy cập an toàn
        </p>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-brand-100 p-6 min-h-[500px]">
        <Tabs defaultActiveKey="info" items={items} />
      </div>
    </div>
  );
}
