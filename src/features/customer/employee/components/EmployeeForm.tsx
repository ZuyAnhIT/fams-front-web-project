"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { App } from "antd";
import { ArrowLeft, Save } from "lucide-react";
import FormInput from "@/components/forms/FormInput";
import BaseButton from "@/components/ui/BaseButton";
import ContentCard from "@/components/shared/layout/ContentCard";
import { useCreateEmployee, useUpdateEmployee } from "../hooks/use-employee";
import { employeeSchema, type EmployeeFormData } from "../schemas/employee.schema";
import type { EmployeeDetailResponse } from "../types/employee.type";

interface EmployeeFormProps {
  initialData?: EmployeeDetailResponse;
  isEditMode?: boolean;
}

export default function EmployeeForm({ initialData, isEditMode = false }: EmployeeFormProps) {
  const router = useRouter();
  const { message } = App.useApp();
  const { mutateAsync: createEmployee, isPending: isCreating } = useCreateEmployee();
  const { mutateAsync: updateEmployee, isPending: isUpdating } = useUpdateEmployee();

  const isPending = isCreating || isUpdating;

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
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
      // Clean up empty strings to undefined to avoid backend parsing errors (e.g. LocalDate)
      const payload: any = { ...data };
      Object.keys(payload).forEach(key => {
        if (payload[key] === "") {
          payload[key] = undefined;
        }
      });

      if (isEditMode && initialData) {
        await updateEmployee({ id: initialData.id, payload });
        message.success("Cập nhật thông tin nhân viên thành công");
      } else {
        await createEmployee(payload);
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
      {/* Form Content */}
      <ContentCard>
        <form id="employee-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Thông tin cơ bản */}
          <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4 relative z-10">
            <h3 className="text-lg font-bold text-slate-800">Thông tin cơ bản</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">

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

          </div>

          {/* Thông tin công việc */}
          <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4 relative z-10 mt-8">
            <h3 className="text-lg font-bold text-slate-800">Thông tin công việc</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">

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
            label="Chức vụ"
            placeholder="Ví dụ: Developer"
            error={errors.position}
          />
          </div>

          <div className="flex justify-end pt-4 pb-4">
            <BaseButton
              type="primary"
              htmlType="submit"
              icon={<Save className="w-4 h-4" />}
              loading={isPending}
              disabled={!isDirty}
              className="!bg-brand-600 !text-white hover:opacity-90 !border-0 shadow-lg shadow-brand-600/25 h-11 px-8 rounded-xl font-bold hover:-translate-y-0.5 transition-all disabled:!bg-slate-300 disabled:!shadow-none disabled:!translate-y-0"
            >
              {isEditMode ? "Lưu thay đổi" : "Thêm nhân viên"}
            </BaseButton>
          </div>
        </form>
      </ContentCard>
    </div>
  );
}
