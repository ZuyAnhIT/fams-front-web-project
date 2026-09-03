"use client";

import React, { useState } from "react";
import { Alert, Space, Tag, message, Tooltip, App } from "antd";
import { useAuthStore } from "@/stores/auth.store";
import { EditOutlined, DeleteOutlined, EyeOutlined, PauseCircleOutlined, PlayCircleOutlined, CopyOutlined } from "@ant-design/icons";
import { useRolesQuery, useDeleteRoleMutation, useUpdateRoleMutation } from "../hooks/use-role-permission";
import { RoleFormModal } from "./RoleFormModal";
import { AssignPlatformRoleModal } from "./AssignPlatformRoleModal";
import { CloneRoleModal } from "./CloneRoleModal";
import { BulkAssignRoleModal } from "./BulkAssignRoleModal";
import { RoleMembersModal } from "./RoleMembersModal";
import { RoleResponse, RoleDetailResponse } from "../types";
import { format } from "date-fns";
import { rolePermissionService } from "../services/role-permission.service";
import { useTenants } from "@/features/admin/tenant/hooks/use-tenant";
import { matchesVietnameseSearch } from "@/utils/vietnamese-search.util";
import ListHeader from "@/components/shared/layout/ListHeader";
import ContentCard from "@/components/shared/layout/ContentCard";
import BaseButton from "@/components/ui/BaseButton";
import BaseSelect from "@/components/ui/BaseSelect";
import DataTable from "@/components/tables/DataTable";
import { Plus, Users, Building2 } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import { getApiErrorMessage } from "@/utils/api-error.util";
import type { ColumnsType } from "antd/es/table";




interface RoleManagementPageProps {
  scope: "tenant" | "platform";
}

export const RoleManagementPage: React.FC<RoleManagementPageProps> = ({ scope }) => {
  const user = useAuthStore((state) => state.user);
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const tenantId = user?.tenantId;

  const { modal } = App.useApp();
  const [messageApi, contextHolder] = message.useMessage();
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 500);
  const [isSystemFilter, setIsSystemFilter] = useState<boolean | undefined>(undefined);
  const [isActiveFilter, setIsActiveFilter] = useState<boolean | undefined>(undefined);
  const [sortBy, setSortBy] = useState<string | undefined>(undefined);
  const [sortDir, setSortDir] = useState<"asc" | "desc" | undefined>(undefined);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPlatformAssignOpen, setIsPlatformAssignOpen] = useState(false);
  const [isBulkAssignOpen, setIsBulkAssignOpen] = useState(false);
  const [cloneSourceRole, setCloneSourceRole] = useState<RoleResponse | undefined>(undefined);
  const [membersRole, setMembersRole] = useState<RoleResponse | undefined>(undefined);
  const [selectedRole, setSelectedRole] = useState<RoleDetailResponse | undefined>(undefined);
  const [isFetchingRole, setIsFetchingRole] = useState(false);

  // Platform Admin support view: inspect one company's custom roles by picking it explicitly —
  // backend already scopes this correctly (GET /roles?tenantId=X, Platform Admin bypasses the
  // membership check), this just exposes it in the UI. Without a company picked, the platform
  // page only ever shows global roles (system + platform-scoped custom), same as before.
  const [supportTenantId, setSupportTenantId] = useState<string | undefined>(undefined);
  const isPlatformAdminCaller = user?.role === "PLATFORM_ADMIN";
  const tenantsQuery = useTenants(
    { page: 0, size: 100, sortBy: "name", sortDir: "asc" },
    scope === "platform" && isPlatformAdminCaller,
  );

  const { data: rolesResponse, isLoading, isFetching } = useRolesQuery({
    tenantId: scope === "tenant" ? (tenantId || undefined) : supportTenantId,
    search: debouncedSearch,
    isSystem: isSystemFilter,
    isActive: isActiveFilter,
    sortBy,
    sortDir,
    page,
    size,
  });

  const deleteRole = useDeleteRoleMutation();
  const updateRole = useUpdateRoleMutation();

  const handleFilterChange = (value: string | undefined) => {
    setIsSystemFilter(value === undefined ? undefined : value === "system");
    setPage(0);
  };

  const handleActiveFilterChange = (value: string | undefined) => {
    setIsActiveFilter(value === undefined ? undefined : value === "active");
    setPage(0);
  };

  const openCreateModal = () => {
    setSelectedRole(undefined);
    setIsModalOpen(true);
  };

  const openEditModal = async (role: RoleResponse) => {
    try {
      setIsFetchingRole(true);
      const res = await rolePermissionService.getRoleById(role.id);
      if (res.data) {
        setSelectedRole(res.data);
        setIsModalOpen(true);
      }
    } catch (error: unknown) {
      messageApi.error(getApiErrorMessage(error, "Lỗi khi tải chi tiết role"));
    } finally {
      setIsFetchingRole(false);
    }
  };

  const handleDelete = (id: string, name: string) => {
    modal.confirm({
      title: 'Xóa Role',
      content: `Chỉ có thể xóa role "${name}" khi không còn người đang giữ role. Nên vô hiệu hóa và thu hồi các lượt gán trước khi xóa.`,
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await deleteRole.mutateAsync(id);
          messageApi.success("Role đã được xóa");
        } catch (error: unknown) {
          messageApi.error(getApiErrorMessage(error, "Lỗi khi xóa role"));
        }
      },
    });
  };

  const handleToggleActive = async (role: RoleResponse) => {
    try {
      setIsFetchingRole(true);
      const detail = (await rolePermissionService.getRoleById(role.id)).data;
      await updateRole.mutateAsync({
        id: role.id,
        data: {
          name: detail.name,
          description: detail.description,
          permissionIds: detail.permissions.map((permission) => permission.id),
          isActive: !role.isActive,
        },
      });
      messageApi.success(role.isActive ? "Đã vô hiệu hóa role" : "Đã kích hoạt lại role");
    } catch (error: unknown) {
      messageApi.error(getApiErrorMessage(error, "Không thể cập nhật trạng thái role"));
    } finally {
      setIsFetchingRole(false);
    }
  };

  const columns: ColumnsType<RoleResponse> = [
    {
      title: "Trạng thái",
      dataIndex: "isActive",
      key: "isActive",
      render: (active: boolean) => (
        <Tag color={active ? "success" : "default"}>{active ? "Hoạt động" : "Đã vô hiệu hóa"}</Tag>
      ),
    },
    {
      title: "Tên Quyền",
      dataIndex: "name",
      key: "name",
      sorter: true,
      render: (text: string, record: RoleResponse) => (
        <span className="font-semibold text-gray-800">
          {text} {record.isSystem && <Tag color="blue" className="ml-2">Hệ thống</Tag>}
        </span>
      ),
    },
    {
      title: "Mô tả",
      dataIndex: "description",
      key: "description",
      render: (text: string) => text || <span className="text-gray-400 italic">Không có mô tả</span>,
    },
    {
      title: "Số quyền",
      dataIndex: "permissionCount",
      key: "permissionCount",
      render: (count: number) => (
        <Tag color="cyan">{count} quyền</Tag>
      ),
    },
    {
      title: "Người đang giữ",
      dataIndex: "assignmentCount",
      key: "assignmentCount",
      render: (count: number = 0, record: RoleResponse) => (
        <Tag
          color={count > 0 ? "gold" : "default"}
          className={count > 0 ? "cursor-pointer" : undefined}
          onClick={() => count > 0 && setMembersRole(record)}
        >
          {count} người{count > 0 ? " · Xem" : ""}
        </Tag>
      ),
    },
    {
      title: "Ngày cập nhật",
      dataIndex: "updatedAt",
      key: "updatedAt",
      sorter: true,
      render: (dateStr: string) => format(new Date(dateStr), "dd/MM/yyyy HH:mm"),
    },
    {
      title: "Thao tác",
      key: "action",
      render: (_, record) => {
        const isSystemRole = record.isSystem;
        const canClone = scope === "platform" ? user?.role === "PLATFORM_ADMIN" : hasPermission("roles:create");
        return (
          <Space size="middle">
            {canClone && (
              <Tooltip title="Sao chép role — tạo role mới với đúng permission này, sửa độc lập">
                <BaseButton
                  type="text"
                  aria-label={`Sao chép ${record.name}`}
                  icon={<CopyOutlined />}
                  onClick={() => setCloneSourceRole(record)}
                  className="text-slate-600 hover:text-slate-800"
                />
              </Tooltip>
            )}
            {isSystemRole ? (
              <Tooltip title="Xem chi tiết">
                <BaseButton
                  type="text"
                  aria-label={`Xem ${record.name}`}
                  icon={<EyeOutlined />}
                  onClick={() => openEditModal(record)}
                  loading={isFetchingRole}
                  className="text-blue-600 hover:text-blue-800"
                />
              </Tooltip>
            ) : (
              <>
                {hasPermission("roles:update") && (
                  <>
                    <Tooltip title="Sửa">
                      <BaseButton
                        type="text"
                        aria-label={`Sửa ${record.name}`}
                        icon={<EditOutlined />}
                        onClick={() => openEditModal(record)}
                        disabled={isFetchingRole}
                        className="text-blue-600 hover:text-blue-800"
                      />
                    </Tooltip>
                    <Tooltip title={record.isActive ? "Vô hiệu hóa" : "Kích hoạt lại"}>
                      <BaseButton
                        type="text"
                        aria-label={`${record.isActive ? "Vô hiệu hóa" : "Kích hoạt"} ${record.name}`}
                        icon={record.isActive ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
                        onClick={() => handleToggleActive(record)}
                        disabled={isFetchingRole}
                      />
                    </Tooltip>
                  </>
                )}
                {hasPermission("roles:delete") && (
                  <Tooltip
                    title={
                      record.assignmentCount > 0
                        ? `Còn ${record.assignmentCount} người đang giữ role — cần thu hồi hết trước khi xóa`
                        : "Xóa"
                    }
                  >
                    <span>
                      <BaseButton
                        type="text"
                        aria-label={`Xóa ${record.name}`}
                        danger
                        disabled={record.assignmentCount > 0}
                        icon={<DeleteOutlined />}
                        onClick={() => handleDelete(record.id, record.name)}
                      />
                    </span>
                  </Tooltip>
                )}
              </>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {contextHolder}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {scope === "platform" ? "Vai trò cấp nền tảng" : "Vai trò & Phân quyền"}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {scope === "platform"
              ? "Quản trị vai trò nội bộ FAMS, tách biệt hoàn toàn với vai trò của từng công ty"
              : "Quản lý vai trò tùy chỉnh và quyền truy cập trong công ty hiện tại"}
          </p>
        </div>
        <Space wrap>
          {scope === "platform" && (
            <BaseButton onClick={() => setIsPlatformAssignOpen(true)}>Gán role nền tảng</BaseButton>
          )}
          {scope === "tenant" && tenantId && hasPermission("roles:update") && (
            <BaseButton icon={<Users className="h-4.5 w-4.5" />} onClick={() => setIsBulkAssignOpen(true)}>
              Gán role hàng loạt
            </BaseButton>
          )}
          {(scope === "platform" ? user?.role === "PLATFORM_ADMIN" : hasPermission("roles:create")) && (
            <BaseButton
              type="primary"
              icon={<Plus className="h-4.5 w-4.5" />}
              onClick={openCreateModal}
              className="!bg-blue-600 !text-white hover:!bg-blue-700 !border-0 shadow-lg shadow-blue-500/25 h-10 px-5 rounded-xl font-bold hover:-translate-y-0.5 transition-all flex items-center gap-2"
            >
              Tạo Role
            </BaseButton>
          )}
        </Space>
      </div>

      <Alert
        showIcon
        type="info"
        title={
          scope === "platform"
            ? "Role hệ thống là bất biến; role tùy chỉnh ở đây có tenantId = null và chỉ Platform Admin nhìn thấy."
            : "Role hệ thống chỉ được xem. Vô hiệu hóa role không thu hồi quyền của người đang giữ, nhưng ngăn các lượt gán mới."
        }
      />

      {scope === "platform" && isPlatformAdminCaller && (
        <ContentCard className="space-y-3 p-5">
          <div className="flex items-center gap-2 font-semibold text-slate-800">
            <Building2 className="h-4 w-4 text-blue-600" />
            Xem role của một công ty (hỗ trợ khách hàng)
          </div>
          <p className="text-sm text-slate-500">
            Mặc định danh sách bên dưới chỉ hiện role dùng chung toàn hệ thống. Chọn 1 công ty để
            xem thêm role tùy chỉnh riêng của công ty đó — dùng khi hỗ trợ khách hàng, không ảnh
            hưởng công ty khác.
          </p>
          <BaseSelect
            allowClear
            showSearch
            filterOption={(input, option) =>
              matchesVietnameseSearch(String(option?.label ?? ""), input)
            }
            placeholder="Tìm và chọn công ty... (gõ có dấu hoặc không dấu đều được)"
            className="max-w-md"
            value={supportTenantId}
            onChange={(value) => {
              setSupportTenantId(value);
              setPage(0);
            }}
            loading={tenantsQuery.isLoading}
            options={(tenantsQuery.data?.content || []).map((t) => ({ value: t.id, label: t.name }))}
          />
          {supportTenantId && (
            <Alert
              showIcon
              type="warning"
              title={`Đang xem thêm role riêng của: ${
                tenantsQuery.data?.content.find((t) => t.id === supportTenantId)?.name || supportTenantId
              }`}
            />
          )}
        </ContentCard>
      )}

      <ContentCard noPadding>
        <ListHeader
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-5 border-b border-slate-100"
          searchValue={searchInput}
          onSearchChange={(value) => {
            setSearchInput(value);
            setPage(0);
          }}
          searchPlaceholder="Tìm kiếm theo tên..."
          searchAriaLabel="Tìm vai trò theo tên"
          filters={
            <>
              <BaseSelect
                aria-label="Lọc theo loại vai trò"
                placeholder="Lọc theo loại Role"
                allowClear
                onChange={handleFilterChange}
                options={[
                  { value: "system", label: "Role Hệ thống" },
                  { value: "custom", label: "Role Tùy chỉnh" },
                ]}
              />
              <BaseSelect
                aria-label="Lọc theo trạng thái vai trò"
                placeholder="Lọc trạng thái"
                allowClear
                onChange={handleActiveFilterChange}
                options={[
                  { value: "active", label: "Đang hoạt động" },
                  { value: "inactive", label: "Đã vô hiệu hóa" },
                ]}
              />
            </>
          }
        />
        <div className="p-5">
          <DataTable
            ariaLabel="Danh sách vai trò và phân quyền"
            emptyTitle="Không tìm thấy vai trò"
            emptyDescription="Thử thay đổi từ khóa hoặc bộ lọc."
            columns={columns}
            data={rolesResponse?.data?.content || []}
            loading={isLoading || isFetching}
            totalElements={rolesResponse?.data?.totalElements || 0}
            currentPage={page}
            pageSize={size}
            onPageChange={(p, s) => {
              setPage(p);
              setSize(s);
            }}
            onChange={(_, __, sorter, extra) => {
              if (extra.action !== "sort") return;
              if (!Array.isArray(sorter) && (sorter.columnKey || sorter.field)) {
                setSortBy((sorter.columnKey || sorter.field) as string);
                setSortDir(sorter.order === "ascend" ? "asc" : sorter.order === "descend" ? "desc" : undefined);
              } else {
                setSortBy(undefined);
                setSortDir(undefined);
              }
              setPage(0);
            }}
          />
        </div>
      </ContentCard>

      <RoleFormModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        tenantId={scope === "tenant" ? (tenantId || undefined) : supportTenantId}
        scope={scope === "platform" && supportTenantId ? "tenant" : scope}
        initialData={selectedRole}
      />
      {scope === "platform" && (
        <AssignPlatformRoleModal
          open={isPlatformAssignOpen}
          onClose={() => setIsPlatformAssignOpen(false)}
        />
      )}
      <CloneRoleModal
        open={Boolean(cloneSourceRole)}
        onClose={() => setCloneSourceRole(undefined)}
        sourceRole={cloneSourceRole}
        tenantId={scope === "tenant" ? (tenantId || undefined) : supportTenantId}
      />
      {scope === "tenant" && tenantId && (
        <BulkAssignRoleModal
          open={isBulkAssignOpen}
          onClose={() => setIsBulkAssignOpen(false)}
          tenantId={tenantId}
        />
      )}
      <RoleMembersModal
        open={Boolean(membersRole)}
        onClose={() => setMembersRole(undefined)}
        role={membersRole}
        tenantId={scope === "tenant" ? (tenantId || undefined) : supportTenantId}
        canRevoke={scope === "tenant" ? hasPermission("roles:update") : isPlatformAdminCaller}
      />
    </div>
  );
};
