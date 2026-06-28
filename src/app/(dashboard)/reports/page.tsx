import RoleGuard from "@/components/guards/RoleGuard";
import { SystemRole } from "@/features/auth/types/auth.type";
export default function ReportsPage() {
  return (
    <RoleGuard allowedRoles={[SystemRole.TENANT_ADMIN, SystemRole.HR_MANAGER, SystemRole.PLATFORM_ADMIN]}>
      <div className="p-6 bg-slate-900/40 rounded-2xl border border-white/10">
      <h1 className="text-xl font-bold text-white mb-2">Báo cáo & Thống kê</h1>
      <p className="text-slate-400 text-sm">Trang kết xuất báo cáo và thống kê đang được phát triển.</p>
      </div>
    </RoleGuard>
  );
}
