"use client";

import { Modal, message, Select } from "antd";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import FormInput from "@/components/forms/FormInput";
import BaseButton from "@/components/ui/BaseButton";
import { useSendInvitation } from "../hooks/use-employee";
import { inviteEmployeeSchema, type InviteEmployeeFormData } from "../schemas/employee.schema";
import { useEffect } from "react";
import { useRolesQuery } from "@/features/admin/role-permission/hooks/use-role-permission";

interface InviteEmployeeModalProps {
  open: boolean;
  onClose: () => void;
}

export default function InviteEmployeeModal({ open, onClose }: InviteEmployeeModalProps) {
  const { mutateAsync: sendInvitation, isPending } = useSendInvitation();
  const { data: rolesData, isLoading: isLoadingRoles } = useRolesQuery({ size: 100 });

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InviteEmployeeFormData>({
    resolver: zodResolver(inviteEmployeeSchema),
    defaultValues: {
      email: "",
      firstName: "",
      lastName: "",
      roleId: "",
    },
  });

  useEffect(() => {
    if (open) {
      reset();
    }
  }, [open, reset]);

  const onSubmit = async (data: InviteEmployeeFormData) => {
    try {
      // Remove empty strings to not send empty values
      const payload = Object.fromEntries(
        Object.entries(data).filter(([_, v]) => v !== "")
      ) as InviteEmployeeFormData;

      await sendInvitation({ payload });
      message.success(`Đã gửi lời mời tới ${data.email} thành công!`);
      onClose();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Không thể gửi lời mời. Vui lòng thử lại.";
      message.error(errorMessage);
    }
  };

  const roleOptions = rolesData?.data?.content
    ?.filter((role) => role.name !== "PLATFORM_ADMIN")
    ?.map((role) => ({
      label: role.name,
      value: role.id,
    })) || [];

  return (
    <Modal
      title="Mời nhân viên mới"
      open={open}
      onCancel={onClose}
      footer={null}
      destroyOnHidden
      centered
      classNames={{
        header: "border-b pb-3",
        body: "pt-4",
      }}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <p className="text-sm text-brand-700">
          Hệ thống sẽ gửi một email chứa đường dẫn đặc biệt để nhân viên tự tạo tài khoản và điền thông tin cá nhân.
        </p>
        
        <FormInput
          control={control}
          name="email"
          label="Địa chỉ Email"
          placeholder="Ví dụ: nhanvien@congty.com"
          id="invite-email"
          error={errors.email}
          className="text-brand-900 border-brand-300 focus:border-brand-500"
        />

        <div className="grid grid-cols-2 gap-4">
          <FormInput
            control={control}
            name="lastName"
            label="Họ (Tùy chọn)"
            placeholder="Ví dụ: Nguyễn"
            error={errors.lastName}
            className="text-brand-900 border-brand-300 focus:border-brand-500"
          />
          <FormInput
            control={control}
            name="firstName"
            label="Tên (Tùy chọn)"
            placeholder="Ví dụ: Văn A"
            error={errors.firstName}
            className="text-brand-900 border-brand-300 focus:border-brand-500"
          />
        </div>

        <div className="flex flex-col space-y-1">
          <label className="text-sm font-medium text-slate-700">
            Vai trò (Role)
          </label>
          <Controller
            name="roleId"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                className="w-full h-11"
                placeholder="Chọn vai trò cho nhân viên"
                options={roleOptions}
                loading={isLoadingRoles}
                allowClear
                size="large"
              />
            )}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-brand-100 mt-6">
          <BaseButton onClick={onClose} disabled={isPending}>
            Hủy
          </BaseButton>
          <BaseButton type="primary" htmlType="submit" loading={isPending} className="bg-brand-600">
            Gửi lời mời
          </BaseButton>
        </div>
      </form>
    </Modal>
  );
}
