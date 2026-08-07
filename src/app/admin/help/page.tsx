import RoleGuard from "@/components/guards/RoleGuard";
import { SystemRole } from "@/features/customer/auth/types/auth.type";
import RoleUserGuidePage from "@/features/shared/help/components/RoleUserGuidePage";

export const metadata = { title: "Hướng dẫn Platform | FAMS" };

export default function PlatformHelpPage() {
  return <RoleGuard allowedRoles={[SystemRole.PLATFORM_ADMIN, SystemRole.PLATFORM_STAFF]}><RoleUserGuidePage /></RoleGuard>;
}
