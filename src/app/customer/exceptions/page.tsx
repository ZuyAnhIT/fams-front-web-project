import RoleGuard from '@/components/guards/RoleGuard';
import { SystemRole } from '@/features/customer/auth/types/auth.type';
import MyExceptionsPage from '@/features/customer/violation/components/MyExceptionsPage';

export const metadata = { title: 'Cần tôi giải thích | FAMS' };

export default function ExceptionsPage() {
  return (
    <RoleGuard allowedRoles={[SystemRole.EMPLOYEE, SystemRole.SITE_SUPERVISOR, SystemRole.HR_MANAGER, SystemRole.TENANT_ADMIN]}>
      <MyExceptionsPage />
    </RoleGuard>
  );
}
