"use client";

import { Modal, message } from "antd";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import FormInput from "@/components/forms/FormInput";
import BaseButton from "@/components/ui/BaseButton";
import { useSendInvitation } from "../hooks/use-employee";
import { inviteEmployeeSchema, type InviteEmployeeFormData } from "../schemas/employee.schema";
import { useEffect } from "react";

interface InviteEmployeeModalProps {
  open: boolean;
  onClose: () => void;
}

export default function InviteEmployeeModal({ open, onClose }: InviteEmployeeModalProps) {
  const { mutateAsync: sendInvitation, isPending } = useSendInvitation();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InviteEmployeeFormData>({
    resolver: zodResolver(inviteEmployeeSchema),
    defaultValues: {
      email: "",
    },
  });

  useEffect(() => {
    if (open) {
      reset();
    }
  }, [open, reset]);

  const onSubmit = async (data: InviteEmployeeFormData) => {
    try {
      await sendInvitation(data);
      message.success(`Đã gửi lời mời tới ${data.email} thành công!`);
      onClose();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Không thể gửi lời mời. Vui lòng thử lại.";
      message.error(errorMessage);
    }
  };

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

        {/* Có thể thêm Select Role ở đây nếu Backend yêu cầu, hiện tại schema để optional */}

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
