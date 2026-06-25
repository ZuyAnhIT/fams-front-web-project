"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import EmployeeForm from "@/features/employee/components/EmployeeForm";

export default function CreateEmployeePage() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/employees")}
            className="p-2 rounded-lg hover:bg-brand-50 text-brand-500 transition-colors cursor-pointer border border-transparent hover:border-brand-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-brand-950">Thêm mới nhân viên</h1>
              </div>
            </div>
            <p className="text-sm text-brand-500 mt-1">
              Điền đầy đủ thông tin hồ sơ nhân sự
            </p>
          </div>
        </div>
      </div>

      <EmployeeForm isEditMode={false} />
    </div>
  );
}
