import { Modal, message } from "antd";
import BaseButton from "@/components/ui/BaseButton";
import { useCancelInvitation } from "../hooks/use-employee";
import type { InvitationResponse } from "../types/employee.type";
import { AlertCircle } from "lucide-react";

interface CancelInvitationModalProps {
  open: boolean;
  onClose: () => void;
  invitation: InvitationResponse | null;
}

export default function CancelInvitationModal({ open, onClose, invitation }: CancelInvitationModalProps) {
  const { mutateAsync: cancelInvitation, isPending } = useCancelInvitation();

  const handleCancel = async () => {
    if (!invitation?.id) return;
    try {
      await cancelInvitation(invitation.id);
      message.success("Hủy lời mời thành công.");
      onClose();
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Lỗi khi hủy lời mời.");
    }
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 text-rose-600">
          <AlertCircle className="w-5 h-5" />
          <span>Xác nhận hủy lời mời</span>
        </div>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      destroyOnHidden
      width={480}
    >
      <div className="mt-4">
        <p className="mb-2 text-slate-600">
          Bạn có chắc chắn muốn hủy lời mời đã gửi đến email <span className="font-semibold text-slate-900">{invitation?.email}</span> không?
        </p>
        <p className="text-sm text-slate-500">
          Sau khi hủy, đường link đăng ký trong email sẽ không còn hiệu lực.
        </p>

        <div className="flex justify-end gap-3 mt-8">
          <BaseButton type="default" onClick={onClose}>
            Đóng
          </BaseButton>
          <BaseButton type="primary" danger onClick={handleCancel} loading={isPending}>
            Hủy lời mời
          </BaseButton>
        </div>
      </div>
    </Modal>
  );
}
