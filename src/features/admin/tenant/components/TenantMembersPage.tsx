"use client";

import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Alert, App, Popconfirm, Result, Tag } from "antd";
import { isAxiosError } from "axios";
import { Search, UserX, Users } from "lucide-react";
import { format } from "date-fns";
import type { ColumnsType } from "antd/es/table";
import BaseButton from "@/components/ui/BaseButton";
import BaseInput from "@/components/ui/BaseInput";
import DataTable from "@/components/tables/DataTable";
import { useAuthStore } from "@/stores/auth.store";
import { useTenantMembers } from "../hooks/use-tenant";
import { useRevokeRoleMutation } from "@/features/admin/role-permission/hooks/use-role-permission";
import { getApiErrorMessage } from "@/utils/api-error.util";
import { matchesVietnameseSearch } from "@/utils/vietnamese-search.util";
import { getDashboardRoute } from "@/utils/route.util";
import type { TenantMember } from "../types/tenant.type";

const ROLE_TAG_COLOR = "blue";

export default function TenantMembersPage() {
  const { message } = App.useApp();
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const canManageRoles = hasPermission("roles:update");
  const [search, setSearch] = useState("");

  const { data: members, isLoading, isError, error } = useTenantMembers(user?.tenantId ?? undefined);
  const revokeRole = useRevokeRoleMutation();

  const filteredMembers = useMemo(() => {
    if (!members) return [];
    if (!search.trim()) return members;
    return members.filter(
      (m) =>
        matchesVietnameseSearch(m.displayName ?? "", search) ||
        matchesVietnameseSearch(m.contact ?? "", search) ||
        m.roleNames.some((r) => matchesVietnameseSearch(r, search)),
    );
  }, [members, search]);

  const handleRevoke = async (userRoleId: string, roleName: string, memberName: string) => {
    try {
      await revokeRole.mutateAsync(userRoleId);
      message.success(`Đã thu hồi role "${roleName}" khỏi ${memberName}`);
      queryClient.invalidateQueries({ queryKey: ["tenant-members"] });
    } catch (err: unknown) {
      message.error(getApiErrorMessage(err, "Không thể thu hồi role"));
    }
  };

  const columns: ColumnsType<TenantMember> = [
    {
      title: "Thành viên",
      dataIndex: "displayName",
      key: "displayName",
      render: (_: string, record: TenantMember) => (
        <div className="flex flex-col">
          <span className="font-medium text-slate-800 text-sm">
            {record.displayName || "(Chưa đặt tên)"}
            {record.isOwner && (
              <Tag color="gold" className="ml-2">
                Chủ sở hữu
              </Tag>
            )}
          </span>
          <span className="text-xs text-slate-400">{record.contact || "---"}</span>
        </div>
      ),
    },
    {
      title: "Vai trò",
      dataIndex: "roleNames",
      key: "roleNames",
      render: (_: string[], record: TenantMember) =>
        record.roleNames.length === 0 ? (
          <span className="text-xs text-slate-400 italic">Chưa có role</span>
        ) : (
          <div className="flex flex-wrap gap-1">
            {record.roleNames.map((name, idx) => {
              const userRoleId = record.userRoleIds[idx];
              const canRevokeThis = canManageRoles && !record.isOwner && userRoleId;
              return canRevokeThis ? (
                <Popconfirm
                  key={userRoleId}
                  title="Thu hồi role"
                  description={`Thu hồi role "${name}" khỏi ${record.displayName || record.contact}?`}
                  okText="Thu hồi"
                  okType="danger"
                  cancelText="Hủy"
                  onConfirm={() => handleRevoke(userRoleId, name, record.displayName || record.contact || "")}
                >
                  <Tag color={ROLE_TAG_COLOR} className="cursor-pointer group">
                    {name}
                    <UserX className="ml-1 inline h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Tag>
                </Popconfirm>
              ) : (
                <Tag key={userRoleId || name} color={ROLE_TAG_COLOR}>
                  {name}
                </Tag>
              );
            })}
          </div>
        ),
    },
    {
      title: "Hồ sơ nhân sự",
      dataIndex: "hasEmployeeProfile",
      key: "hasEmployeeProfile",
      render: (_: boolean, record: TenantMember) =>
        record.hasEmployeeProfile ? (
          <div className="flex flex-col">
            <span className="text-sm text-slate-700">{record.position || "---"}</span>
            <span className="text-xs text-slate-400">{record.department || ""}</span>
          </div>
        ) : (
          <span className="text-xs text-slate-400 italic">Chưa có hồ sơ HR</span>
        ),
    },
    {
      title: "Tham gia từ",
      dataIndex: "memberSince",
      key: "memberSince",
      render: (value: string | null) => (
        <span className="text-sm text-slate-600">{value ? format(new Date(value), "dd/MM/yyyy") : "---"}</span>
      ),
    },
  ];

  if (isError && isAxiosError(error) && error.response?.status === 403) {
    return (
      <Result
        status="403"
        title="403 Không có quyền truy cập"
        subTitle="Bạn không phải chủ sở hữu công ty và không có quyền xem danh sách thành viên."
        extra={
          <BaseButton customVariant="default" onClick={() => router.push(getDashboardRoute(user?.role))}>
            Về Trang chủ
          </BaseButton>
        }
      />
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-slate-500" />
          <h2 className="text-lg font-semibold text-slate-800">Thành viên công ty</h2>
        </div>
        <p className="text-sm text-slate-500">
          Toàn bộ người có quyền truy cập công ty — chủ sở hữu, quản trị, HR, giám sát công trình và nhân
          viên — kể cả những người chưa có hồ sơ nhân sự (HR).
        </p>
      </div>

      <div className="mb-4 max-w-sm">
        <BaseInput
          aria-label="Tìm kiếm thành viên"
          placeholder="Tìm theo tên, email hoặc vai trò..."
          prefix={<Search className="h-4 w-4 text-slate-400" />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          allowClear
        />
      </div>

      {isError ? (
        <Alert
          type="error"
          showIcon
          message="Không tải được danh sách thành viên"
          description={getApiErrorMessage(error, "Vui lòng thử lại.")}
        />
      ) : (
        <DataTable<TenantMember>
          columns={columns}
          data={filteredMembers}
          loading={isLoading}
          showPagination={false}
          rowKey="userId"
          emptyTitle="Chưa có thành viên nào"
        />
      )}
    </div>
  );
}
