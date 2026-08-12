"use client";

import { message } from "antd";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import FormInput from "@/components/forms/FormInput";
import FormSelect from "@/components/forms/FormSelect";
import BaseModal from "@/components/ui/BaseModal";
import { useSendInvitation } from "../hooks/use-employee";
import { inviteEmployeeSchema, type InviteEmployeeFormData } from "../schemas/employee.schema";
import { useEffect } from "react";
import { useRolesQuery } from "@/features/admin/role-permission/hooks/use-role-permission";
import { useAuthStore } from "@/stores/auth.store";
import { getApiErrorMessage } from "@/utils/api-error.util";

interface InviteEmployeeModalProps {
  open: boolean;
  onClose: () => void;
}

export default function InviteEmployeeModal({ open, onClose }: InviteEmployeeModalProps) {
  const { mutateAsync: sendInvitation, isPending } = useSendInvitation();
  const tenantId = useAuthStore((state) => state.user?.tenantId);
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
      phone: "",
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
        Object.entries(data).filter(([, value]) => value !== "")
      ) as InviteEmployeeFormData;

      await sendInvitation({ payload });
      message.success(`Đã gửi lời mời tới ${data.email} thành công!`);
      onClose();
    } catch (error: unknown) {
      message.error(getApiErrorMessage(error, "Không thể gửi lời mời. Vui lòng thử lại."));
    }
  };

  const roleOptions = rolesData?.data?.content
    ?.filter(
      (role) =>
        role.isActive &&
        (role.tenantId === tenantId ||
          (role.tenantId === null &&
            ["TENANT_ADMIN", "HR_MANAGER", "SITE_SUPERVISOR", "EMPLOYEE"].includes(
              role.name,
            ))),
    )
    ?.map((role) => ({
      label: role.name,
      value: role.id,
    })) || [];

  return (
    <BaseModal
      title="Mời nhân viên mới"
      isOpen={open}
      onClose={onClose}
      confirmText="Gửi lời mời"
      confirmLoading={isPending}
      confirmButtonProps={{ htmlType: "submit", form: "invite-employee-form" }}
      classNames={{
        header: "border-b pb-3",
        body: "pt-4",
      }}
    >
      <form id="invite-employee-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <p className="text-sm text-brand-700">
          Hệ thống gửi email để người nhận chấp nhận tham gia. Người đã có tài khoản
          chỉ cần xác nhận; người chưa có tài khoản sẽ đặt mật khẩu. Nếu HR đã tạo hồ
          sơ thủ công cùng email, tài khoản sẽ được nối vào hồ sơ đó, không tạo bản ghi trùng.
        </p>
        
        <FormInput
          control={control}
          name="email"
          label="Địa chỉ Email"
          placeholder="Ví dụ: nhanvien@congty.com"
          id="invite-email"
          error={errors.email}
          required
          className="text-brand-900 border-brand-300 focus:border-brand-500"
        />

        <FormInput
          control={control}
          name="phone"
          label="Số điện thoại (Tùy chọn)"
          placeholder="Ví dụ: 0912345678"
          error={errors.phone}
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

        <FormSelect
          control={control}
          name="roleId"
          label="Vai trò (Role)"
          placeholder="Chọn vai trò cho nhân viên"
          options={roleOptions}
          loading={isLoadingRoles}
          error={errors.roleId}
          allowClear
        />

      </form>
    </BaseModal>
  );
}
