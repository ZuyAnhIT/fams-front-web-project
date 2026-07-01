import RoleGuard from "@/components/guards/RoleGuard";
import { SystemRole } from "@/features/customer/auth/types/auth.type";
import EmployeeListPage from "@/features/customer/employee/components/EmployeeListPage";

export const metadata = {
  title: "Quản lý nhân viên | FAMS",
};

export default function EmployeesPage() {
  return (
    <RoleGuard allowedRoles={[SystemRole.TENANT_ADMIN, SystemRole.HR_MANAGER, SystemRole.SITE_SUPERVISOR, SystemRole.PLATFORM_ADMIN]}>
      <div className="max-w-[1600px] mx-auto py-2">
      <div className="mb-6">
      <h1 className="text-2xl font-bold text-brand-950">Quản lý nhân sự</h1>
      <p className="text-sm text-brand-600 mt-1">
      Danh sách toàn bộ nhân viên và tài khoản trong công ty
      </p>
      </div>
      <EmployeeListPage />
      </div>
    </RoleGuard>
  );
}
