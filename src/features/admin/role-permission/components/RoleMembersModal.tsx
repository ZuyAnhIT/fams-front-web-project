"use client";

import React from "react";
import { Alert, List, Modal, Popconfirm, Spin, Tag, message } from "antd";
import { format } from "date-fns";
import { UserX } from "lucide-react";
import BaseButton from "@/components/ui/BaseButton";
import { useRoleMembersQuery, useRevokeRoleMutation, rolePermissionKeys } from "../hooks/use-role-permission";
import { useQueryClient } from "@tanstack/react-query";
import { getApiErrorMessage } from "@/utils/api-error.util";
import type { RoleResponse } from "../types";

interface RoleMembersModalProps {
  open: boolean;
  onClose: () => void;
  role?: RoleResponse;
  tenantId?: string;
  canRevoke?: boolean;
}

export const RoleMembersModal: React.FC<RoleMembersModalProps> = ({ open, onClose, role, tenantId, canRevoke }) => {
  const [messageApi, contextHolder] = message.useMessage();
  const queryClient = useQueryClient();
  const needsTenantId = Boolean(role?.isSystem) && !role?.tenantId;
  const { data, isLoading, isError, error } = useRoleMembersQuery(role?.id, tenantId, open && Boolean(role));
  const revokeRole = useRevokeRoleMutation();

  const handleRevoke = async (userRoleId: string) => {
    try {
      await revokeRole.mutateAsync(userRoleId);
      messageApi.success("Đã thu hồi role");
      queryClient.invalidateQueries({ queryKey: rolePermissionKeys.all });
    } catch (err: unknown) {
      messageApi.error(getApiErrorMessage(err, "Không thể thu hồi role"));
    }
  };

  return (
    <>
      {contextHolder}
      <Modal
        title={`Danh sách người giữ role "${role?.name || ""}"`}
        open={open}
        onCancel={onClose}
        footer={null}
        width={560}
        destroyOnHidden
      >
        {needsTenantId && !tenantId ? (
          <Alert
            type="warning"
            showIcon
            title="Cần chọn công ty trước"
            description='Đây là role hệ thống dùng chung nhiều công ty — chọn 1 công ty ở ô "Xem role của một công ty" phía trên trước khi xem danh sách người giữ role này.'
          />
        ) : isLoading ? (
          <div className="flex justify-center p-6"><Spin /></div>
        ) : isError ? (
          <Alert type="error" showIcon title="Không tải được danh sách" description={getApiErrorMessage(error, "Vui lòng thử lại.")} />
        ) : !data?.data || data.data.length === 0 ? (
          <Alert type="info" showIcon title="Chưa có ai giữ role này" />
        ) : (
          <List
            dataSource={data.data}
            renderItem={(member) => (
              <List.Item
                actions={
                  canRevoke
                    ? [
                        <Popconfirm
                          key="revoke"
                          title="Thu hồi role"
                          description={`Thu hồi role khỏi ${member.displayName || member.contact}?`}
                          okText="Thu hồi"
                          okType="danger"
                          cancelText="Hủy"
                          onConfirm={() => handleRevoke(member.userRoleId)}
                        >
                          <BaseButton type="text" danger size="small" icon={<UserX className="h-4 w-4" />}>
                            Thu hồi
                          </BaseButton>
                        </Popconfirm>,
                      ]
                    : undefined
                }
              >
                <List.Item.Meta
                  title={member.displayName || "(Chưa đặt tên)"}
                  description={
                    <div className="flex flex-col gap-1">
                      <span>{member.contact}</span>
                      <span className="text-xs text-slate-400">
                        Gán ngày {format(new Date(member.assignedAt), "dd/MM/yyyy HH:mm")}
                      </span>
                      {member.siteIds.length > 0 && (
                        <Tag color="blue">Giới hạn {member.siteIds.length} công trình</Tag>
                      )}
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Modal>
    </>
  );
};
