"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, App } from "antd";
import { Save } from "lucide-react";
import FormInput from "@/components/forms/FormInput";
import FormSelect from "@/components/forms/FormSelect";
import BaseButton from "@/components/ui/BaseButton";
import ContentCard from "@/components/shared/layout/ContentCard";
import { useCreateEmployee, useUpdateEmployee } from "../hooks/use-employee";
import { employeeSchema, type EmployeeFormData } from "../schemas/employee.schema";
import type { EmployeeDetailResponse } from "../types/employee.type";
import { useWorkspacesQuery } from "@/features/customer/workspace/hooks/use-workspace";
import { useAuthStore } from "@/stores/auth.store";

interface EmployeeFormProps {
  initialData?: EmployeeDetailResponse;
  isEditMode?: boolean;
}

export default function EmployeeForm({ initialData, isEditMode = false }: EmployeeFormProps) {
  const router = useRouter();
  const { message } = App.useApp();
  const { mutateAsync: createEmployee, isPending: isCreating } = useCreateEmployee();
  const { mutateAsync: updateEmployee, isPending: isUpdating } = useUpdateEmployee();
  const tenantId = useAuthStore((state) => state.user?.tenantId ?? undefined);
  const { data: departments, isLoading: isLoadingDepartments } = useWorkspacesQuery({
    tenantId,
    type: "department",
    status: "active",
    sortBy: "name",
    sortDir: "asc",
    size: 100,
  });

  const isPending = isCreating || isUpdating;
  const piiMasked = Boolean(initialData?.piiMasked);

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
      departmentId: "",
      hiredDate: "",
    },
  });

  useEffect(() => {
    if (initialData) {
      reset({
        firstName: initialData.firstName || "",
        lastName: initialData.lastName || "",
        // Masked values are display-only. Never send a***@... or ***123 back to
        // PATCH when HR changes an unrelated field.
        email: piiMasked ? "" : initialData.email || "",
        phone: piiMasked ? "" : initialData.phone || "",
        employeeCode: initialData.employeeCode || "",
        position: initialData.position || "",
        department: initialData.department || "",
        departmentId: initialData.departmentId || "",
        hiredDate: initialData.hiredDate || "",
      });
    }
  }, [initialData, piiMasked, reset]);

  const onSubmit = async (data: EmployeeFormData) => {
    try {
      // Clean up empty strings to undefined to avoid backend parsing errors (e.g. LocalDate)
      const payload = Object.fromEntries(
        Object.entries(data).filter(([, value]) => value !== ""),
      ) as EmployeeFormData;

      if (isEditMode && initialData) {
        await updateEmployee({ id: initialData.id, payload });
        message.success("Cập nhật thông tin nhân viên thành công");
      } else {
        await createEmployee(payload);
        message.success("Thêm mới nhân viên thành công");
        router.push("/customer/employees");
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
          {piiMasked && (
            <Alert
              showIcon
              type="info"
              message="Dữ liệu liên hệ hiện tại đang được che"
              description="Web không đưa giá trị đã che vào form và không gửi lại khi bạn lưu trường khác. Chỉ nhập email hoặc số điện thoại đầy đủ nếu bạn thực sự muốn thay thế giá trị hiện tại."
            />
          )}
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
              helpText={piiMasked && initialData?.email ? `Giá trị hiện tại: ${initialData.email}. Để trống nếu không thay đổi.` : undefined}
            />

            <FormInput
              control={control}
              name="phone"
              label="Số điện thoại"
              placeholder="Ví dụ: 0912345678"
              error={errors.phone}
              helpText={piiMasked && initialData?.phone ? `Giá trị hiện tại: ${initialData.phone}. Để trống nếu không thay đổi.` : undefined}
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

            <FormSelect
              control={control}
              name="departmentId"
              label="Phòng ban"
              placeholder="Chọn phòng ban đang hoạt động"
              allowClear
              showSearch
              optionFilterProp="label"
              loading={isLoadingDepartments}
              error={errors.departmentId}
              options={(departments?.data?.content ?? []).map((workspace) => ({
                value: workspace.id,
                label: workspace.name,
              }))}
              helperText="Danh sách được đồng bộ từ Cơ cấu tổ chức."
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
