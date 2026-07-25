import RoleGuard from "@/components/guards/RoleGuard";
import { SystemRole } from "@/features/customer/auth/types/auth.type";
import { UserDirectoryPage } from "@/features/admin/user/components/UserDirectoryPage";

export const metadata = {
  title: "Nhân sự FAMS | FAMS",
};

export default function AdminUsersPage() {
  return (
    <RoleGuard allowedRoles={[SystemRole.PLATFORM_ADMIN]}>
      <UserDirectoryPage />
    </RoleGuard>
  );
}
