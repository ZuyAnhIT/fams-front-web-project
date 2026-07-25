import RoleGuard from "@/components/guards/RoleGuard";
import { RoleManagementPage } from "@/features/admin/role-permission/components/RoleManagementPage";

export const metadata = {
  title: "Vai trò & Phân quyền công ty | FAMS",
};

export default function CompanyRolesPage() {
  return (
    <RoleGuard allowedPermissions={["roles:read", "roles:create", "roles:update", "roles:delete"]}>
      <div className="mx-auto max-w-[1600px] py-2">
        <RoleManagementPage scope="tenant" />
      </div>
    </RoleGuard>
  );
}
