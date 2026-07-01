import RoleGuard from "@/components/guards/RoleGuard";
import { SystemRole } from "@/features/customer/auth/types/auth.type";
export default function RandomChecksPage() {
  return (
    <RoleGuard allowedRoles={[SystemRole.TENANT_ADMIN, SystemRole.SITE_SUPERVISOR, SystemRole.PLATFORM_ADMIN]}>
      <div className="p-6 bg-slate-900/40 rounded-2xl border border-white/10">
      <h1 className="text-xl font-bold text-white mb-2">Kiểm tra đột xuất</h1>
      <p className="text-slate-400 text-sm">Trang quản lý kiểm tra đột xuất đang được phát triển.</p>
      </div>
    </RoleGuard>
  );
}
