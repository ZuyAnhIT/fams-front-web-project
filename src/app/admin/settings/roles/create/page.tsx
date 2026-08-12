import RoleForm from "@/features/admin/role/components/RoleForm";
import RoleGuard from "@/components/guards/RoleGuard";
import { SystemRole } from "@/features/customer/auth/types/auth.type";

export const metadata = {
  title: "Thêm vai trò | FAMS",
};

export default function CreateRolePage() {
  return (
    <RoleGuard allowedRoles={[SystemRole.PLATFORM_ADMIN]}>
      <div className="py-2">
        <RoleForm isEditMode={false} />
      </div>
    </RoleGuard>
  );
}
