import SitePage from "@/features/site/components/SitePage";
import RoleGuard from "@/components/guards/RoleGuard";
import { SystemRole } from "@/features/auth/types/auth.type";

export default function SitesPage() {
  return (
    <RoleGuard allowedRoles={[SystemRole.TENANT_ADMIN, SystemRole.SITE_SUPERVISOR, SystemRole.PLATFORM_ADMIN]}>
      <SitePage />
    </RoleGuard>
  );
}
