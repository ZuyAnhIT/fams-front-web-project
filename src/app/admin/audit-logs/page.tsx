import RoleGuard from '@/components/guards/RoleGuard';
import { SystemRole } from '@/features/customer/auth/types/auth.type';
import AuditLogViewerPage from '@/features/shared/audit/components/AuditLogViewerPage';

export const metadata = { title: 'Audit toàn hệ thống | FAMS' };

export default function PlatformAuditLogsPage() {
  return <RoleGuard allowedRoles={[SystemRole.PLATFORM_ADMIN]}><AuditLogViewerPage platformMode /></RoleGuard>;
}
