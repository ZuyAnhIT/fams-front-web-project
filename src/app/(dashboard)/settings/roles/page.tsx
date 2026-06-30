import RoleGuard from "@/components/guards/RoleGuard";
import { SystemRole } from "@/features/auth/types/auth.type";
import { RoleManagementPage } from "@/features/role-permission/components/RoleManagementPage";

export const metadata = {
  title: "Vai trò & Phân quyền | FAMS",
};

export default function RolesPage() {
  return (
    <RoleGuard allowedRoles={[SystemRole.TENANT_ADMIN, SystemRole.PLATFORM_ADMIN]}>
      <div className="max-w-[1600px] mx-auto py-2">
      <div className="mb-6">
      <h1 className="text-2xl font-bold text-brand-950">Vai trò & Phân quyền</h1>
      <p className="text-sm text-brand-600 mt-1">
      Quản lý các vai trò và thiết lập quyền hạn truy cập hệ thống
      </p>
      </div>
      <RoleManagementPage />
      </div>
    </RoleGuard>
  );
}
