"use client";

import { useRouter } from "next/navigation";
import EmployeeForm from "@/features/customer/employee/components/EmployeeForm";
import DetailHeader from "@/components/shared/layout/DetailHeader";
import RoleGuard from "@/components/guards/RoleGuard";
import { SystemRole } from "@/features/customer/auth/types/auth.type";

export default function CreateEmployeePage() {
  const router = useRouter();

  return (
    <RoleGuard
      allowedRoles={[SystemRole.PLATFORM_ADMIN]}
      allowedPermissions={["employees:create"]}
    >
      <div className="space-y-6">
        <DetailHeader
          onBack={() => router.push("/customer/employees")}
          title="Thêm mới nhân viên"
          subtitle="Điền đầy đủ thông tin hồ sơ nhân sự"
        />

        <EmployeeForm isEditMode={false} />
      </div>
    </RoleGuard>
  );
}
