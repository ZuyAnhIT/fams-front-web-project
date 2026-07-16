import RoleGuard from "@/components/guards/RoleGuard";
import { SystemRole } from "@/features/customer/auth/types/auth.type";
import FaceIdEnrollmentReportPage from "@/features/customer/report/components/FaceIdEnrollmentReportPage";

export default function FaceIdReportRoutePage() {
  return (
    <RoleGuard
      allowedRoles={[
        SystemRole.TENANT_ADMIN,
        SystemRole.HR_MANAGER,
        SystemRole.PLATFORM_ADMIN,
      ]}
    >
      <FaceIdEnrollmentReportPage />
    </RoleGuard>
  );
}