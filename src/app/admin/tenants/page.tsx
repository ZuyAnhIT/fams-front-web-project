import RoleGuard from "@/components/guards/RoleGuard";
import { SystemRole } from "@/features/customer/auth/types/auth.type";
import TenantListPage from "@/features/admin/tenant/components/TenantListPage";

export const metadata = {
  title: "Quản lý công ty | FAMS",
};

export default function TenantsPage() {
  return (
    <RoleGuard allowedRoles={[SystemRole.PLATFORM_ADMIN]}>
      <div className="max-w-[1600px] mx-auto py-2">

      <TenantListPage />
      </div>
    </RoleGuard>
  );
}
