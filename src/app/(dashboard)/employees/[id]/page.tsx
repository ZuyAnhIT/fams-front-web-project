"use client";

import { use } from "react";
import EmployeeForm from "@/features/employee/components/EmployeeForm";
import { useEmployeeDetail } from "@/features/employee/hooks/use-employee";

export default function EditEmployeePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { data, isLoading } = useEmployeeDetail(resolvedParams.id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-brand-500">
        Không tìm thấy thông tin nhân viên
      </div>
    );
  }

  return (
    <div className="py-2">
      <EmployeeForm isEditMode={true} initialData={data} />
    </div>
  );
}
