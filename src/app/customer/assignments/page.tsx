import RoleGuard from "@/components/guards/RoleGuard";
import { SystemRole } from "@/features/customer/auth/types/auth.type";
export default function AssignmentsPage() {
  return (
    <RoleGuard allowedRoles={[SystemRole.TENANT_ADMIN, SystemRole.HR_MANAGER, SystemRole.PLATFORM_ADMIN]}>
      <div className="p-6 bg-slate-900/40 rounded-2xl border border-white/10">
      <h1 className="text-xl font-bold text-white mb-2">Phân công công việc</h1>
      <p className="text-slate-400 text-sm">Trang phân công lịch trình và nhiệm vụ đang được phát triển.</p>
      </div>
    </RoleGuard>
  );
}
