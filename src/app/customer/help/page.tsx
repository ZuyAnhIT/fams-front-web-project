import RoleGuard from "@/components/guards/RoleGuard";
import { SystemRole } from "@/features/customer/auth/types/auth.type";
import RoleUserGuidePage from "@/features/shared/help/components/RoleUserGuidePage";

export const metadata = { title: "Hướng dẫn sử dụng | FAMS" };

export default function CustomerHelpPage() {
  return (
    <RoleGuard allowedRoles={[SystemRole.TENANT_ADMIN, SystemRole.HR_MANAGER, SystemRole.SITE_SUPERVISOR, SystemRole.EMPLOYEE]}>
      <RoleUserGuidePage />
    </RoleGuard>
  );
}
