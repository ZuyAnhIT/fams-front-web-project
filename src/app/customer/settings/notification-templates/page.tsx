import RoleGuard from "@/components/guards/RoleGuard";
import { SystemRole } from "@/features/customer/auth/types/auth.type";
import NotificationTemplateManagementPage from "@/features/customer/notification/components/NotificationTemplateManagementPage";

export const metadata = { title: "Mẫu thông báo | FAMS" };

export default function NotificationTemplatesPage() {
  return (
    <RoleGuard
      allowedRoles={[SystemRole.PLATFORM_ADMIN]}
      allowedPermissions={["notifications:manage", "tenant:admin"]}
    >
      <NotificationTemplateManagementPage />
    </RoleGuard>
  );
}
