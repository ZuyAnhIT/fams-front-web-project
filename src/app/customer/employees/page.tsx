import RoleGuard from "@/components/guards/RoleGuard";
import { SystemRole } from "@/features/customer/auth/types/auth.type";
import EmployeeTabs from "@/features/customer/employee/components/EmployeeTabs";

export const metadata = {
  title: "Quản lý nhân viên | FAMS",
};

export default function EmployeesPage() {
  return (
    <RoleGuard
      allowedRoles={[
        SystemRole.PLATFORM_ADMIN,
      ]}
      allowedPermissions={["employees:list", "employees:read"]}
    >
      <div className="mx-auto max-w-[1600px] py-1">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Quản lý nhân sự</h1>
          <p className="mt-1 text-sm text-slate-600">
            Quản lý hồ sơ HR, tài khoản tham gia, phân công và trạng thái nhân viên
          </p>
        </div>
        <EmployeeTabs />
      </div>
    </RoleGuard>
  );
}
