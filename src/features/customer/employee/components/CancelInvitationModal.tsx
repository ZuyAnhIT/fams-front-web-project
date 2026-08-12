import { message } from "antd";
import BaseModal from "@/components/ui/BaseModal";
import { useCancelInvitation } from "../hooks/use-employee";
import type { InvitationResponse } from "../types/employee.type";
import { AlertCircle } from "lucide-react";
import { getApiErrorMessage } from "@/utils/api-error.util";

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
    } catch (error: unknown) {
      message.error(getApiErrorMessage(error, "Lỗi khi hủy lời mời."));
    }
  };

  return (
    <BaseModal
      title={
        <div className="flex items-center gap-2 text-rose-600">
          <AlertCircle className="w-5 h-5" />
          <span>Xác nhận hủy lời mời</span>
        </div>
      }
      isOpen={open}
      onClose={onClose}
      onConfirm={handleCancel}
      confirmText="Hủy lời mời"
      cancelText="Đóng"
      confirmLoading={isPending}
      confirmButtonProps={{ 
        danger: true, 
        className: "!bg-rose-600 hover:!bg-rose-700 !border-0 text-white font-bold shadow-lg shadow-rose-500/25 transition-all" 
      }}
      destroyOnHidden
      width={480}
    >
      <div className="mt-4">
        <p className="mb-2 text-slate-600 text-[15px]">
          Bạn có chắc chắn muốn hủy lời mời đã gửi đến email <span className="font-semibold text-slate-900">{invitation?.email}</span> không?
        </p>
        <p className="text-sm text-slate-500">
          Sau khi hủy, đường link đăng ký trong email sẽ không còn hiệu lực.
        </p>
      </div>
    </BaseModal>
  );
}
