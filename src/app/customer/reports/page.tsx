import RoleGuard from '@/components/guards/RoleGuard';
import { SystemRole } from '@/features/customer/auth/types/auth.type';
import ReportCenterPage from '@/features/customer/report/components/ReportCenterPage';

export const metadata = { title: 'Trung tâm báo cáo | FAMS' };

export default function ReportsPage() {
  return <RoleGuard allowedRoles={[SystemRole.PLATFORM_ADMIN]} allowedPermissions={['reports:list']}><ReportCenterPage /></RoleGuard>;
}
