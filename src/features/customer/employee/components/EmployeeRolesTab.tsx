"use client";

import { useState } from "react";
import { Alert, message, Tag } from "antd";
import { Trash2, ShieldCheck, Plus } from "lucide-react";
import { format } from "date-fns";
import DataTable from "@/components/tables/DataTable";
import { useQueryClient } from "@tanstack/react-query";
import { BaseButton, BaseConfirmModal } from "@/components/ui";
import GlassCard from "@/components/ui/GlassCard";
import { AssignRoleModal } from "@/features/admin/role-permission/components/AssignRoleModal";
import { useRevokeRoleMutation } from "@/features/admin/role-permission/hooks/use-role-permission";
import type { EmployeeDetailResponse, EmployeeRoleAssignment } from "../types/employee.type";
import { useAuthStore } from "@/stores/auth.store";
import { getApiErrorMessage } from "@/utils/api-error.util";
import type { ColumnsType } from "antd/es/table";

interface EmployeeRolesTabProps {
  employee: EmployeeDetailResponse;
}

export default function EmployeeRolesTab({ employee }: EmployeeRolesTabProps) {
  const canManage = useAuthStore((state) => state.hasPermission("roles:update"));
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [revokeRoleId, setRevokeRoleId] = useState<string | null>(null);
  const revokeRole = useRevokeRoleMutation();
  const queryClient = useQueryClient();

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["employees", employee.id] });
    setIsAssignOpen(false);
  };

  const handleRevoke = (userRoleId: string) => {
    setRevokeRoleId(userRoleId);
  };

  const confirmRevoke = async () => {
    if (!revokeRoleId) return;
    try {
      await revokeRole.mutateAsync(revokeRoleId);
      message.success("Đã thu hồi role thành công");
      handleSuccess();
    } catch (error: unknown) {
      message.error(getApiErrorMessage(error, "Lỗi khi thu hồi role"));
    } finally {
      setRevokeRoleId(null);
    }
  };

  const columns: ColumnsType<EmployeeRoleAssignment> = [
    {
      title: "Tên Role",
      dataIndex: "roleName",
      key: "roleName",
      sorter: (a: EmployeeRoleAssignment, b: EmployeeRoleAssignment) =>
        (a.roleName ?? "").localeCompare(b.roleName ?? ""),
      render: (text?: string) => <span className="font-semibold text-brand-900">{text || "—"}</span>,
    },
    {
      title: "Ngày gán",
      dataIndex: "assignedAt",
      key: "assignedAt",
      sorter: (a: EmployeeRoleAssignment, b: EmployeeRoleAssignment) =>
        new Date(a.assignedAt ?? 0).getTime() - new Date(b.assignedAt ?? 0).getTime(),
      render: (dateStr?: string) => dateStr ? format(new Date(dateStr), "dd/MM/yyyy HH:mm") : "—",
    },
    {
      title: "Phạm vi",
      dataIndex: "siteIds",
      key: "siteIds",
      render: (siteIds: string[] | undefined, record: EmployeeRoleAssignment) => (
        <Tag
          color={siteIds?.length ? "gold" : "green"}
          title={record.sites?.map((site) => site.name).join(", ")}
        >
          {record.sites?.length
            ? record.sites.map((site) => site.name).join(", ")
            : siteIds?.length
              ? `${siteIds.length} công trình`
              : "Toàn công ty"}
        </Tag>
      ),
    },
    ...(canManage ? [{
      title: "Thao tác",
      key: "actions",
      width: 120,
      render: (_: unknown, record: EmployeeRoleAssignment) => (
        <BaseButton
          size="small"
          danger
          icon={<Trash2 className="h-4 w-4" />}
          onClick={() => handleRevoke(record.id)}
        >
          Thu hồi
        </BaseButton>
      ),
    }] : []),
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
        {canManage && (
          <BaseButton
            type="primary"
            icon={<Plus className="h-4 w-4" />}
            onClick={() => setIsAssignOpen(true)}
            disabled={!employee.userId}
            className="!bg-blue-600 !text-white hover:!bg-blue-700 !border-0 shadow-md shadow-blue-500/20 h-10 px-5 rounded-xl font-semibold hover:-translate-y-0.5 transition-all flex items-center gap-2 disabled:!bg-slate-300 disabled:!text-slate-500 disabled:!shadow-none disabled:translate-y-0"
          >
            Gán Role
          </BaseButton>
        )}
      </div>

      {!employee.userId && (
        <Alert
          type="warning"
          showIcon
          title="Chưa có tài khoản đăng nhập"
          description="Nhân viên này được tạo thủ công và chưa liên kết với tài khoản hệ thống nào. Bạn cần gửi lời mời tham gia (Invite) để họ thiết lập tài khoản trước khi có thể gán quyền."
        />
      )}

      <GlassCard className="border-brand-200 bg-white shadow-sm overflow-hidden">
        <DataTable
          columns={columns}
          data={employee.roles || []}
          showPagination={false}
        />
      </GlassCard>

      {/* Modal */}
      {employee.userId && canManage && (
        <AssignRoleModal
          open={isAssignOpen}
          onClose={() => setIsAssignOpen(false)}
          userId={employee.userId}
          tenantId={employee.tenantId}
          onSuccess={handleSuccess}
        />
      )}

      <BaseConfirmModal
        isOpen={!!revokeRoleId}
        onClose={() => setRevokeRoleId(null)}
        onConfirm={confirmRevoke}
        title="Xác nhận thu hồi quyền"
        message="Bạn có chắc chắn muốn thu hồi role này khỏi nhân viên? Họ sẽ mất các quyền truy cập tương ứng ngay lập tức."
        confirmText="Thu hồi"
        type="danger"
        isLoading={revokeRole.isPending}
      />
    </div>
  );
}
