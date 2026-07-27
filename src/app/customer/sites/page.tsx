import SitePage from "@/features/customer/site/components/SitePage";
import RoleGuard from "@/components/guards/RoleGuard";
import { SystemRole } from "@/features/customer/auth/types/auth.type";

export default function SitesPage() {
  return (
    <RoleGuard
      allowedRoles={[SystemRole.PLATFORM_ADMIN]}
      allowedPermissions={["sites:list", "sites:read"]}
    >
      <SitePage />
    </RoleGuard>
  );
}
