import PlanListPage from "@/features/subscription/components/PlanListPage";
import RoleGuard from "@/components/guards/RoleGuard";
import { SystemRole } from "@/features/auth/types/auth.type";

export const metadata = {
  title: "Quản lý Gói dịch vụ | FAMS",
};

export default function PlansPage() {
  return (
    <RoleGuard allowedRoles={[SystemRole.PLATFORM_ADMIN]}>
      <div className="max-w-[1600px] mx-auto py-2">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-brand-950">Gói dịch vụ (Subscriptions)</h1>
          <p className="text-sm text-brand-600 mt-1">
            Định nghĩa cấu hình các gói thuê bao và giới hạn tài nguyên hệ thống
          </p>
        </div>
        <PlanListPage />
      </div>
    </RoleGuard>
  );
}
