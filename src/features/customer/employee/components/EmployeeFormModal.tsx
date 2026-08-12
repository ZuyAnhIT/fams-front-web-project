"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { App } from "antd";
import FormInput from "@/components/forms/FormInput";
import FormSelect from "@/components/forms/FormSelect";
import BaseModal from "@/components/ui/BaseModal";
import { useCreateEmployee, useUpdateEmployee } from "../hooks/use-employee";
import { employeeSchema, type EmployeeFormData } from "../schemas/employee.schema";
import type { EmployeeDetailResponse } from "../types/employee.type";
import { useWorkspacesQuery } from "@/features/customer/workspace/hooks/use-workspace";
import { useAuthStore } from "@/stores/auth.store";
import { getApiErrorMessage } from "@/utils/api-error.util";
import type { CreateEmployeePayload } from "../types/employee.type";

interface EmployeeFormModalProps {
  open: boolean;
  onClose: () => void;
  initialData?: EmployeeDetailResponse | null;
}

export default function EmployeeFormModal({ open, onClose, initialData }: EmployeeFormModalProps) {
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

  const isEditMode = !!initialData;
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
      departmentId: "",
      hiredDate: "",
    },
  });

  useEffect(() => {
    if (open) {
      if (initialData) {
        reset({
          firstName: initialData.firstName || "",
          lastName: initialData.lastName || "",
          email: initialData.email || "",
          phone: initialData.phone || "",
          employeeCode: initialData.employeeCode || "",
          position: initialData.position || "",
          department: initialData.department || "",
          departmentId: initialData.departmentId || "",
          hiredDate: initialData.hiredDate || "",
        });
      } else {
        reset({
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          employeeCode: "",
          position: "",
          department: "",
          departmentId: "",
          hiredDate: "",
        });
      }
    }
  }, [open, initialData, reset]);

  const onSubmit = async (data: EmployeeFormData) => {
    try {
      // Clean up empty strings to undefined to avoid backend parsing errors
      const optional = (value?: string) => value === "" ? undefined : value;
      const payload: CreateEmployeePayload = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: optional(data.email),
        phone: optional(data.phone),
        employeeCode: optional(data.employeeCode),
        position: optional(data.position),
        department: optional(data.department),
        departmentId: optional(data.departmentId),
        hiredDate: optional(data.hiredDate),
      };

      if (isEditMode && initialData) {
        await updateEmployee({ id: initialData.id, payload });
        message.success("Cập nhật thông tin nhân viên thành công");
      } else {
        await createEmployee(payload);
        message.success("Thêm mới nhân viên thành công");
      }
      onClose();
    } catch (error: unknown) {
      message.error(getApiErrorMessage(error, "Đã xảy ra lỗi, vui lòng thử lại sau"));
    }
  };

  return (
    <BaseModal
      title={isEditMode ? "Sửa thông tin nhân viên" : "Thêm nhân viên mới"}
      isOpen={open}
      onClose={onClose}
      width={760}
      confirmText={isEditMode ? "Lưu thay đổi" : "Tạo mới"}
      confirmLoading={isPending}
      confirmButtonProps={{
        htmlType: "submit",
        form: "employee-form",
        disabled: !isDirty
      }}
    >
      <form id="employee-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {!isEditMode && (
          <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm text-blue-800">
            Luồng này chỉ tạo hồ sơ nhân sự để HR quản lý, không tạo tài khoản đăng nhập.
            Nếu nhập email và mời người này sau, hệ thống sẽ nối tài khoản vào đúng hồ sơ,
            giữ nguyên dữ liệu đã khai báo.
          </div>
        )}
        {/* Thông tin cơ bản */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="font-bold text-slate-800 text-[15px]">Thông tin cơ bản</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4">
            <FormInput
              control={control}
              name="firstName"
              label="Tên"
              placeholder="Ví dụ: Anh"
              error={errors.firstName}
              required
              labelClassName="!text-slate-700 !font-semibold !text-sm"
            />

            <FormInput
              control={control}
              name="lastName"
              label="Họ và tên đệm"
              placeholder="Ví dụ: Nguyễn Văn"
              error={errors.lastName}
              required
              labelClassName="!text-slate-700 !font-semibold !text-sm"
            />

            <FormInput
              control={control}
              name="email"
              label="Email liên hệ"
              placeholder="Ví dụ: email@domain.com"
              error={errors.email}
              labelClassName="!text-slate-700 !font-semibold !text-sm"
            />

            <FormInput
              control={control}
              name="phone"
              label="Số điện thoại"
              placeholder="Ví dụ: 0912345678"
              error={errors.phone}
              labelClassName="!text-slate-700 !font-semibold !text-sm"
            />
          </div>
        </div>

        {/* Thông tin công việc */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="font-bold text-slate-800 text-[15px]">Thông tin công việc</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4">
            <FormInput
              control={control}
              name="employeeCode"
              label="Mã nhân viên (Tùy chọn)"
              placeholder="Ví dụ: NV001"
              error={errors.employeeCode}
              labelClassName="!text-slate-700 !font-semibold !text-sm"
            />

            <FormInput
              control={control}
              name="hiredDate"
              label="Ngày vào làm"
              type="date"
              error={errors.hiredDate}
              labelClassName="!text-slate-700 !font-semibold !text-sm"
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
              labelClassName="!text-slate-700 !font-semibold !text-sm"
            />
          </div>
        </div>
      </form>
    </BaseModal>
  );
}
