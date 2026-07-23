import RoleGuard from "@/components/guards/RoleGuard";
import { SystemRole } from "@/features/customer/auth/types/auth.type";
import TenantConfigurationPage from "@/features/admin/tenant/components/TenantConfigurationPage";

export const metadata = {
  title: "Cấu hình Công ty | FAMS",
};

export default function SettingsTenantPage() {
  return (
    <RoleGuard allowedRoles={[SystemRole.TENANT_ADMIN]}>
      <div className="mx-auto max-w-[1600px] py-1">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Cấu hình công ty</h1>
          <p className="mt-1 text-sm text-slate-600">
            Thiết lập định dạng hiển thị, màu thương hiệu và danh sách IP truy cập an toàn
          </p>
        </div>
        <TenantConfigurationPage />
      </div>
    </RoleGuard>
  );
}
