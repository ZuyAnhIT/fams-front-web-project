import { Modal, message, Input } from "antd";
import { useState } from "react";
import BaseButton from "@/components/ui/BaseButton";
import { useCancelInvitation } from "../hooks/use-employee";

interface CancelInvitationModalProps {
  open: boolean;
  onClose: () => void;
}

export default function CancelInvitationModal({ open, onClose }: CancelInvitationModalProps) {
  const { mutateAsync: cancelInvitation, isPending } = useCancelInvitation();
  const [invitationId, setInvitationId] = useState("");

  const handleCancel = async () => {
    if (!invitationId) {
      message.error("Vui lòng nhập ID lời mời.");
      return;
    }
    try {
      await cancelInvitation(invitationId);
      message.success("Hủy lời mời thành công.");
      setInvitationId("");
      onClose();
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Lỗi khi hủy lời mời. Vui lòng kiểm tra lại ID.");
    }
  };

  return (
    <Modal
      title="Hủy lời mời"
      open={open}
      onCancel={onClose}
      footer={null}
      destroyOnHidden
    >
      <div className="mt-4">
        <p className="mb-2 text-slate-600">
          Nhập ID của lời mời (UUID) mà bạn muốn hủy. (Tính năng này được thiết kế để thao tác nhanh khi chưa có giao diện danh sách lời mời chờ xác nhận).
        </p>
        <Input
          placeholder="Nhập Invitation ID..."
          value={invitationId}
          onChange={(e) => setInvitationId(e.target.value)}
        />

        <div className="flex justify-end gap-3 mt-6">
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
