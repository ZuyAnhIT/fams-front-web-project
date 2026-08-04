import { Suspense } from "react";
import RoleGuard from "@/components/guards/RoleGuard";
import ViolationManagementPage from "@/features/customer/violation/components/violation.component";
import { SystemRole } from "@/features/customer/auth/types/auth.type";

export const metadata = { title: "Quản lý vi phạm | FAMS" };

export default function ViolationsPage() {
  return (
    <RoleGuard allowedPermissions={["violations:list", "violations:read"]} allowedRoles={[SystemRole.PLATFORM_ADMIN]}>
      <Suspense fallback={<div className="flex min-h-[50vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" /></div>}>
        <ViolationManagementPage />
      </Suspense>
    </RoleGuard>
  );
}
