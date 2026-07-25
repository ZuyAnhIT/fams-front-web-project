"use client";

import React, { useState } from "react";
import { Alert, Space, Tag, message, Tooltip, App } from "antd";
import { useAuthStore } from "@/stores/auth.store";
import { EditOutlined, DeleteOutlined, EyeOutlined, PauseCircleOutlined, PlayCircleOutlined } from "@ant-design/icons";
import { useRolesQuery, useDeleteRoleMutation, useUpdateRoleMutation } from "../hooks/use-role-permission";
import { RoleFormModal } from "./RoleFormModal";
import { AssignPlatformRoleModal } from "./AssignPlatformRoleModal";
import { RoleResponse, RoleDetailResponse } from "../types";
import { format } from "date-fns";
import { rolePermissionService } from "../services/role-permission.service";
import ListHeader from "@/components/shared/layout/ListHeader";
import ContentCard from "@/components/shared/layout/ContentCard";
import BaseButton from "@/components/ui/BaseButton";
import BaseSelect from "@/components/ui/BaseSelect";
import DataTable from "@/components/tables/DataTable";
import { Plus } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";




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
  const [selectedRole, setSelectedRole] = useState<RoleDetailResponse | undefined>(undefined);
  const [isFetchingRole, setIsFetchingRole] = useState(false);

  const { data: rolesResponse, isLoading, isFetching } = useRolesQuery({
    tenantId: scope === "tenant" ? (tenantId || undefined) : undefined,
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
    } catch (error: any) {
      messageApi.error(error?.response?.data?.message || "Lỗi khi tải chi tiết role");
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
        } catch (error: any) {
          messageApi.error(error?.response?.data?.message || "Lỗi khi xóa role");
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
    } catch (error: any) {
      messageApi.error(error?.response?.data?.message || "Không thể cập nhật trạng thái role");
    } finally {
      setIsFetchingRole(false);
    }
  };

  const columns = [
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
          {text} {(record.isSystem || (record as any).system) && <Tag color="blue" className="ml-2">Hệ thống</Tag>}
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
      render: (count: number = 0) => (
        <Tag color={count > 0 ? "gold" : "default"}>{count} người</Tag>
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
      render: (_: any, record: RoleResponse) => {
        const isSystemRole = record.isSystem || (record as any).system;
        return (
          <Space size="middle">
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
        message={
          scope === "platform"
            ? "Role hệ thống là bất biến; role tùy chỉnh ở đây có tenantId = null và chỉ Platform Admin nhìn thấy."
            : "Role hệ thống chỉ được xem. Vô hiệu hóa role không thu hồi quyền của người đang giữ, nhưng ngăn các lượt gán mới."
        }
      />

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
            <div className="flex w-full flex-col gap-3 sm:flex-row">
              <BaseSelect
                aria-label="Lọc theo loại vai trò"
                placeholder="Lọc theo loại Role"
                allowClear
                className="w-full sm:w-48"
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
                className="w-full sm:w-48"
                onChange={handleActiveFilterChange}
                options={[
                  { value: "active", label: "Đang hoạt động" },
                  { value: "inactive", label: "Đã vô hiệu hóa" },
                ]}
              />
            </div>
          }
        />
        <div className="p-5">
          <DataTable
            ariaLabel="Danh sách vai trò và phân quyền"
            emptyTitle="Không tìm thấy vai trò"
            emptyDescription="Thử thay đổi từ khóa hoặc bộ lọc."
            columns={columns as any}
            data={rolesResponse?.data?.content || []}
            loading={isLoading || isFetching}
            totalElements={rolesResponse?.data?.totalElements || 0}
            currentPage={page}
            pageSize={size}
            onPageChange={(p, s) => {
              setPage(p);
              setSize(s);
            }}
            onChange={(_, __, sorter: any) => {
              if (!Array.isArray(sorter) && (sorter.columnKey || sorter.field)) {
                setSortBy((sorter.columnKey || sorter.field) as string);
                setSortDir(sorter.order === "ascend" ? "asc" : sorter.order === "descend" ? "desc" : undefined);
              } else {
                setSortBy(undefined);
                setSortDir(undefined);
              }
            }}
          />
        </div>
      </ContentCard>

      <RoleFormModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        tenantId={scope === "tenant" ? (tenantId || undefined) : undefined}
        scope={scope}
        initialData={selectedRole}
      />
      {scope === "platform" && (
        <AssignPlatformRoleModal
          open={isPlatformAssignOpen}
          onClose={() => setIsPlatformAssignOpen(false)}
        />
      )}
    </div>
  );
};
