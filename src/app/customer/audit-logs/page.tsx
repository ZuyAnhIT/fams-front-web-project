import RoleGuard from '@/components/guards/RoleGuard';
import AuditLogViewerPage from '@/features/shared/audit/components/AuditLogViewerPage';

export const metadata = { title: 'Nhật ký audit công ty | FAMS' };

export default function TenantAuditLogsPage() {
  return <RoleGuard allowedPermissions={['audit:list']}><AuditLogViewerPage platformMode={false} /></RoleGuard>;
}
