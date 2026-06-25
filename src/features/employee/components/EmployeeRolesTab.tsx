"use client";

import { useState } from "react";
import { Table, Modal, message, Alert } from "antd";
import { Trash2, ShieldCheck, Plus } from "lucide-react";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import BaseButton from "@/components/ui/BaseButton";
import GlassCard from "@/components/ui/GlassCard";
import { AssignRoleModal } from "@/features/role-permission/components/AssignRoleModal";
import { useRevokeRoleMutation } from "@/features/role-permission/hooks/use-role-permission";
import type { EmployeeDetailResponse } from "../types/employee.type";
import type { UserRoleResponse } from "@/features/role-permission/types";

interface EmployeeRolesTabProps {
  employee: EmployeeDetailResponse;
}

export default function EmployeeRolesTab({ employee }: EmployeeRolesTabProps) {
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const revokeRole = useRevokeRoleMutation();
  const queryClient = useQueryClient();

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["employees", employee.id] });
  };

  const handleRevoke = (userRoleId: string) => {
    Modal.confirm({
      title: "Xác nhận thu hồi quyền",
      content: "Bạn có chắc chắn muốn thu hồi role này khỏi nhân viên?",
      okText: "Thu hồi",
      okType: "danger",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          await revokeRole.mutateAsync(userRoleId);
          message.success("Đã thu hồi role thành công");
          handleSuccess();
        } catch (error: any) {
          message.error(error?.response?.data?.message || "Lỗi khi thu hồi role");
        }
      },
    });
  };

  const columns = [
    {
      title: "Tên Role",
      dataIndex: "roleName",
      key: "roleName",
      render: (text: string) => <span className="font-semibold text-brand-900">{text}</span>,
    },
    {
      title: "Ngày gán",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (dateStr: string) => format(new Date(dateStr), "dd/MM/yyyy HH:mm"),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 120,
      render: (_: any, record: UserRoleResponse) => (
        <BaseButton
          size="small"
          danger
          icon={<Trash2 className="h-4 w-4" />}
          onClick={() => handleRevoke(record.id)}
        >
          Thu hồi
        </BaseButton>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-semibold text-brand-800 text-lg flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-brand-600" />
            Danh sách quyền hạn
          </h3>
          <p className="text-sm text-brand-500 mt-1">
            Quản lý các vai trò và quyền được cấp cho nhân viên này trong hệ thống.
          </p>
        </div>
        <BaseButton
          type="primary"
          icon={<Plus className="h-4 w-4" />}
          onClick={() => setIsAssignOpen(true)}
          disabled={!employee.userId}
          className="bg-brand-600 border-transparent"
        >
          Gán Role
        </BaseButton>
      </div>

      {!employee.userId && (
        <Alert
          type="warning"
          showIcon
          message="Chưa có tài khoản đăng nhập"
          description="Nhân viên này được tạo thủ công và chưa liên kết với tài khoản hệ thống nào. Bạn cần gửi lời mời tham gia (Invite) để họ thiết lập tài khoản trước khi có thể gán quyền."
        />
      )}

      <GlassCard className="border-brand-200 bg-white shadow-sm overflow-hidden">
        <Table
          columns={columns}
          dataSource={employee.roles || []}
          rowKey="id"
          pagination={false}
        />
      </GlassCard>

      {/* Modal */}
      {employee.userId && (
        <AssignRoleModal
          open={isAssignOpen}
          onClose={() => setIsAssignOpen(false)}
          userId={employee.userId}
          tenantId={employee.tenantId}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}
