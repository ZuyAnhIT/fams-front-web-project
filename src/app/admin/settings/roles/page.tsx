import RoleGuard from "@/components/guards/RoleGuard";
import { SystemRole } from "@/features/customer/auth/types/auth.type";
import { RoleManagementPage } from "@/features/admin/role-permission/components/RoleManagementPage";

export const metadata = {
  title: "Vai trò & Phân quyền | FAMS",
};

export default function RolesPage() {
  return (
    <RoleGuard allowedRoles={[SystemRole.TENANT_ADMIN, SystemRole.PLATFORM_ADMIN]}>
      <div className="max-w-[1600px] mx-auto py-2">
        <RoleManagementPage />
      </div>
    </RoleGuard>
  );
}
