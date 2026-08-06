import RoleGuard from "@/components/guards/RoleGuard";
import SystemOperationsPage from "@/features/admin/system-operations/components/SystemOperationsPage";
import { SystemRole } from "@/features/customer/auth/types/auth.type";

export const metadata = { title: "Vận hành hệ thống | FAMS" };

export default function PlatformSystemStatusPage() {
  return (
    <RoleGuard allowedRoles={[SystemRole.PLATFORM_ADMIN]} allowedPermissions={["system:read"]}>
      <SystemOperationsPage />
    </RoleGuard>
  );
}
