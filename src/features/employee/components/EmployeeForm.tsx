"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { message } from "antd";
import { ArrowLeft, Save } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import FormInput from "@/components/forms/FormInput";
import BaseButton from "@/components/ui/BaseButton";
import { useCreateEmployee, useUpdateEmployee } from "../hooks/use-employee";
import { employeeSchema, type EmployeeFormData } from "../schemas/employee.schema";
import type { EmployeeDetailResponse } from "../types/employee.type";

interface EmployeeFormProps {
  initialData?: EmployeeDetailResponse;
  isEditMode?: boolean;
}

export default function EmployeeForm({ initialData, isEditMode = false }: EmployeeFormProps) {
  const router = useRouter();
  const { mutateAsync: createEmployee, isPending: isCreating } = useCreateEmployee();
  const { mutateAsync: updateEmployee, isPending: isUpdating } = useUpdateEmployee();

  const isPending = isCreating || isUpdating;

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      employeeCode: "",
      position: "",
      department: "",
      hiredDate: "",
    },
  });

  useEffect(() => {
    if (initialData) {
      reset({
        firstName: initialData.firstName || "",
        lastName: initialData.lastName || "",
        email: initialData.email || "",
        phone: initialData.phone || "",
        employeeCode: initialData.employeeCode || "",
        position: initialData.position || "",
        department: initialData.department || "",
        hiredDate: initialData.hiredDate || "",
      });
    }
  }, [initialData, reset]);

  const onSubmit = async (data: EmployeeFormData) => {
    try {
      if (isEditMode && initialData) {
        await updateEmployee({ id: initialData.id, payload: data });
        message.success("Cập nhật thông tin nhân viên thành công");
      } else {
        await createEmployee(data);
        message.success("Thêm mới nhân viên thành công");
        router.push("/employees");
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Đã xảy ra lỗi, vui lòng thử lại sau";
      message.error(errorMessage);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.back()}
            className="p-2 rounded-lg hover:bg-brand-200 text-brand-700 transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-brand-950">
              {isEditMode ? "Chỉnh sửa nhân viên" : "Thêm mới nhân viên"}
            </h1>
            <p className="text-sm text-brand-600 mt-1">
              Điền đầy đủ thông tin hồ sơ nhân sự
            </p>
          </div>
        </div>
        
        <BaseButton 
          type="primary"
          icon={<Save className="h-4 w-4" />}
          loading={isPending}
          onClick={handleSubmit(onSubmit)}
          className="bg-brand-600 hover:bg-brand-700"
        >
          Lưu thông tin
        </BaseButton>
      </div>

      {/* Form Content */}
      <GlassCard className="border-brand-200 bg-white shadow-sm p-6 sm:p-8">
        <form id="employee-form" onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2 pb-2 mb-2 border-b border-brand-100">
            <h3 className="font-semibold text-brand-800 text-lg">Thông tin cơ bản</h3>
          </div>

          <FormInput
            control={control}
            name="firstName"
            label="Tên"
            placeholder="Ví dụ: Anh"
            error={errors.firstName}
            required
          />

          <FormInput
            control={control}
            name="lastName"
            label="Họ và tên đệm"
            placeholder="Ví dụ: Nguyễn Văn"
            error={errors.lastName}
            required
          />

          <FormInput
            control={control}
            name="email"
            label="Email liên hệ"
            placeholder="Ví dụ: email@domain.com"
            error={errors.email}
          />

          <FormInput
            control={control}
            name="phone"
            label="Số điện thoại"
            placeholder="Ví dụ: 0912345678"
            error={errors.phone}
          />

          <div className="md:col-span-2 pb-2 mb-2 mt-4 border-b border-brand-100">
            <h3 className="font-semibold text-brand-800 text-lg">Thông tin công việc</h3>
          </div>

          <FormInput
            control={control}
            name="employeeCode"
            label="Mã nhân viên (Tùy chọn)"
            placeholder="Ví dụ: NV001"
            error={errors.employeeCode}
          />

          <FormInput
            control={control}
            name="hiredDate"
            label="Ngày vào làm"
            type="date"
            error={errors.hiredDate}
          />

          <FormInput
            control={control}
            name="department"
            label="Phòng ban"
            placeholder="Ví dụ: Kỹ thuật"
            error={errors.department}
          />

          <FormInput
            control={control}
            name="position"
            label="Vị trí/Chức vụ"
            placeholder="Ví dụ: Developer"
            error={errors.position}
          />
        </form>
      </GlassCard>
    </div>
  );
}
