import React from "react";
import { Form, message, Spin, Typography } from "antd";
import BaseModal from "@/components/ui/BaseModal";
import BaseSelect from "@/components/ui/BaseSelect";
import { useAuthStore } from "@/stores/auth.store";
import { useWorkspacesQuery, useTransferMemberMutation } from "../hooks/use-workspace";
import { TransferWorkspaceMemberRequest } from "../types";

const { Text } = Typography;

interface TransferMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceWorkspaceId: string;
  memberId: string;
  employeeName?: string;
  currentRole?: string;
}

export default function TransferMemberModal({
  isOpen,
  onClose,
  sourceWorkspaceId,
  memberId,
  employeeName,
  currentRole,
}: TransferMemberModalProps) {
  const [form] = Form.useForm();
  const user = useAuthStore((state) => state.user);

  // Fetch all workspaces to populate target workspace dropdown
  const { data: workspacesData, isLoading: isLoadingWorkspaces } = useWorkspacesQuery({
    tenantId: user?.tenantId || undefined,
    status: "active",
    size: 100,
  });

  const { mutateAsync: transferMember, isPending } = useTransferMemberMutation();

  const handleFinish = async (values: any) => {
    try {
      if (!user?.tenantId) {
        message.error("Lỗi: Không xác định được Tenant ID");
        return;
      }

      const payload: TransferWorkspaceMemberRequest = {
        targetWorkspaceId: values.targetWorkspaceId,
        role: values.role,
      };

      await transferMember({
        tenantId: user.tenantId,
        workspaceId: sourceWorkspaceId,
        memberId,
        data: payload,
      });

      message.success("Chuyển phòng ban thành công!");
      form.resetFields();
      onClose();
    } catch (error: any) {
      message.error(error.response?.data?.message || "Có lỗi xảy ra khi chuyển phòng ban");
    }
  };

  // Filter out the source workspace from target choices
  const workspaceOptions = workspacesData?.data?.content
    ?.filter((ws) => ws.id !== sourceWorkspaceId && ws.status === "active")
    .map((ws) => ({
      value: ws.id,
      label: ws.name,
    })) || [];

  return (
    <BaseModal
      title="Chuyển Phòng Ban"
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={() => form.submit()}
      confirmLoading={isPending}
      confirmText="Chuyển ngay"
    >
      <div className="mb-4 text-slate-600">
        Bạn đang thao tác điều chuyển nhân viên <Text strong>{employeeName || "Không xác định"}</Text> sang một phòng ban mới.
      </div>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        initialValues={{ role: currentRole || "member" }}
        className="mt-4"
      >
        <Form.Item
          name="targetWorkspaceId"
          label={<span className="font-medium text-slate-700">Phòng ban đích</span>}
          rules={[{ required: true, message: "Vui lòng chọn phòng ban đích!" }]}
        >
          <BaseSelect
            showSearch
            placeholder="Chọn phòng ban đích..."
            optionFilterProp="label"
            notFoundContent={isLoadingWorkspaces ? <Spin size="small" /> : "Không tìm thấy phòng ban"}
            options={workspaceOptions}
            className="h-10"
          />
        </Form.Item>

        <Form.Item
          name="role"
          label={<span className="font-medium text-slate-700">Vai trò ở phòng ban mới</span>}
          rules={[{ required: true, message: "Vui lòng chọn vai trò!" }]}
          tooltip="Vai trò mặc định được giữ nguyên như ở phòng ban cũ."
        >
          <BaseSelect
            options={[
              { value: "member", label: "Nhân viên (Member)" },
              { value: "lead", label: "Trưởng nhóm (Lead)" },
              { value: "manager", label: "Quản lý (Manager)" },
            ]}
            className="h-10"
          />
        </Form.Item>
      </Form>
    </BaseModal>
  );
}
