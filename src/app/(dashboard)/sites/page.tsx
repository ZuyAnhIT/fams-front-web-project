import RoleGuard from "@/components/guards/RoleGuard";
import { SystemRole } from "@/features/auth/types/auth.type";
export default function SitesPage() {
  return (
    <RoleGuard allowedRoles={[SystemRole.TENANT_ADMIN, SystemRole.SITE_SUPERVISOR, SystemRole.PLATFORM_ADMIN]}>
      <div className="p-6 bg-slate-900/40 rounded-2xl border border-white/10">
      <h1 className="text-xl font-bold text-white mb-2">Quản lý địa bàn</h1>
      <p className="text-slate-400 text-sm">Danh sách địa bàn chấm công thực địa đang được phát triển.</p>
      </div>
    </RoleGuard>
  );
}
