import TenantSettingsPage from "@/features/tenant/components/TenantSettingsPage";

export const metadata = {
  title: "Cấu hình Công ty | FAMS",
};

export default function SettingsTenantPage() {
  return (
    <div className="max-w-[1600px] mx-auto py-2">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-brand-950">Cấu hình hệ thống</h1>
        <p className="text-sm text-brand-600 mt-1">
          Thiết lập giao diện, múi giờ và danh sách IP truy cập an toàn
        </p>
      </div>
      <TenantSettingsPage />
    </div>
  );
}
