"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { App, Modal } from "antd";
import { UserPlus } from "lucide-react";
import FormInput from "@/components/forms/FormInput";
import BaseButton from "@/components/ui/BaseButton";
import { useCreateEmployee, useUpdateEmployee } from "../hooks/use-employee";
import { employeeSchema, type EmployeeFormData } from "../schemas/employee.schema";
import type { EmployeeDetailResponse } from "../types/employee.type";

interface EmployeeFormModalProps {
  open: boolean;
  onClose: () => void;
  initialData?: EmployeeDetailResponse | null;
}

export default function EmployeeFormModal({ open, onClose, initialData }: EmployeeFormModalProps) {
  const { message } = App.useApp();
  const { mutateAsync: createEmployee, isPending: isCreating } = useCreateEmployee();
  const { mutateAsync: updateEmployee, isPending: isUpdating } = useUpdateEmployee();

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
          hiredDate: "",
        });
      }
    }
  }, [open, initialData, reset]);

  const onSubmit = async (data: EmployeeFormData) => {
    try {
      // Clean up empty strings to undefined to avoid backend parsing errors
      const payload: any = { ...data };
      Object.keys(payload).forEach((key) => {
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
      }
      onClose();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Đã xảy ra lỗi, vui lòng thử lại sau";
      message.error(errorMessage);
    }
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-brand-primary/10 rounded-xl flex items-center justify-center">
            <UserPlus className="h-5 w-5 text-brand-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight leading-tight">
              {isEditMode ? "Sửa thông tin nhân viên" : "Thêm nhân viên mới"}
            </h2>
            <p className="text-sm text-slate-500 font-normal mt-0.5">
              {isEditMode ? "Cập nhật hồ sơ nhân sự" : "Điền đầy đủ thông tin hồ sơ nhân sự"}
            </p>
          </div>
        </div>
      }
      open={open}
      onCancel={onClose}
      destroyOnHidden
      centered
      width={760}
      footer={
        <div className="flex justify-end gap-3 mt-4">
          <BaseButton
            onClick={onClose}
            disabled={isPending}
            className="!bg-white !text-slate-700 !border-slate-300 hover:!bg-slate-50 hover:!text-slate-900 h-11 px-6 rounded-xl font-semibold transition-all"
          >
            Hủy bỏ
          </BaseButton>
          <BaseButton
            type="primary"
            htmlType="submit"
            form="employee-form"
            loading={isPending}
            disabled={!isDirty}
            className="!bg-brand-primary !text-white hover:opacity-90 !border-0 shadow-lg shadow-brand-primary/25 h-11 px-8 rounded-xl font-bold hover:-translate-y-0.5 transition-all disabled:!bg-slate-300 disabled:!shadow-none disabled:!translate-y-0"
          >
            {isEditMode ? "Lưu thay đổi" : "Tạo mới"}
          </BaseButton>
        </div>
      }
      classNames={{
        wrapper: "!bg-white !rounded-3xl !p-0 overflow-hidden shadow-2xl shadow-brand-primary/10",
        header: "!bg-white border-b border-slate-100 px-8 py-5 m-0",
        body: "!bg-slate-50/50 p-6 md:p-8 overflow-y-auto max-h-[60vh] scrollbar-thin scrollbar-thumb-slate-200",
        footer: "!bg-white border-t border-slate-100 px-8 py-4 m-0",
        close: "mt-4 mr-4 hover:!bg-slate-100 !rounded-full transition-colors",
      }}
    >
      <form id="employee-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Thông tin cơ bản */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm space-y-5">
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
        <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm space-y-5">
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

            <FormInput
              control={control}
              name="department"
              label="Phòng ban"
              placeholder="Ví dụ: Kỹ thuật"
              error={errors.department}
              labelClassName="!text-slate-700 !font-semibold !text-sm"
            />

            <FormInput
              control={control}
              name="position"
              label="Vị trí/Chức vụ"
              placeholder="Ví dụ: Developer"
              error={errors.position}
              labelClassName="!text-slate-700 !font-semibold !text-sm"
            />
          </div>
        </div>
      </form>
    </Modal>
  );
}
