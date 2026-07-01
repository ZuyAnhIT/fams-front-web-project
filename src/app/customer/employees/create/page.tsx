"use client";

import { useRouter } from "next/navigation";
import EmployeeForm from "@/features/customer/employee/components/EmployeeForm";
import DetailHeader from "@/components/shared/layout/DetailHeader";

export default function CreateEmployeePage() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <DetailHeader
        onBack={() => router.push("/employees")}
        title="Thêm mới nhân viên"
        subtitle="Điền đầy đủ thông tin hồ sơ nhân sự"
      />

      <EmployeeForm isEditMode={false} />
    </div>
  );
}
