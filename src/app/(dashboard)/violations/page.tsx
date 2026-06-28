import RoleGuard from "@/components/guards/RoleGuard";
import { SystemRole } from "@/features/auth/types/auth.type";
export default function ViolationsPage() {
  return (
    <RoleGuard allowedRoles={[SystemRole.TENANT_ADMIN, SystemRole.HR_MANAGER, SystemRole.SITE_SUPERVISOR, SystemRole.PLATFORM_ADMIN]}>
      <div className="p-6 bg-slate-900/40 rounded-2xl border border-white/10">
      <h1 className="text-xl font-bold text-white mb-2">Quản lý vi phạm</h1>
      <p className="text-slate-400 text-sm">Trang thống kê và xử lý vi phạm chấm công đang được phát triển.</p>
      </div>
    </RoleGuard>
  );
}
