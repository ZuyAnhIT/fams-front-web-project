import { useState } from "react";
import { App } from "antd";
import BaseModal from "@/components/ui/BaseModal";
import BaseTextArea from "@/components/ui/BaseTextArea";
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
  const { message } = App.useApp();
  const { mutateAsync: cancelInvitation, isPending } = useCancelInvitation();
  const [reason, setReason] = useState("");

  const closeModal = () => {
    setReason("");
    onClose();
  };

  const handleCancel = async () => {
    if (!invitation?.id) return;
    try {
      await cancelInvitation({ invitationId: invitation.id, reason: reason.trim() || undefined });
      message.success("Hủy lời mời thành công.");
      closeModal();
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
      onClose={closeModal}
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
        <p className="text-sm text-slate-500 mb-3">
          Sau khi hủy, đường link đăng ký trong email sẽ không còn hiệu lực.
        </p>
        <label htmlFor="cancel-invitation-reason" className="text-sm font-medium text-slate-700">
          Lý do hủy (Tùy chọn)
        </label>
        <BaseTextArea
          id="cancel-invitation-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Ví dụ: Ứng viên đã từ chối offer"
          rows={2}
          className="mt-1"
        />
      </div>
    </BaseModal>
  );
}
