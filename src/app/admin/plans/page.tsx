import PlanListPage from "@/features/admin/subscription/components/PlanListPage";
import RoleGuard from "@/components/guards/RoleGuard";
import { SystemRole } from "@/features/customer/auth/types/auth.type";

export const metadata = {
  title: "Quản lý Gói dịch vụ | FAMS",
};

export default function PlansPage() {
  return (
    <RoleGuard allowedRoles={[SystemRole.PLATFORM_ADMIN]}>
      <div className="max-w-[1600px] mx-auto py-2">

        <PlanListPage />
      </div>
    </RoleGuard>
  );
}
