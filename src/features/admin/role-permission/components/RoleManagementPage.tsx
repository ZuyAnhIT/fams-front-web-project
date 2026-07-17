"use client";

import React, { useState } from "react";
import { Space, Tag, Modal, message, Tooltip, App } from "antd";
import { useAuthStore } from "@/stores/auth.store";
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, InfoCircleOutlined, EyeOutlined } from "@ant-design/icons";
import { useRolesQuery, useDeleteRoleMutation } from "../hooks/use-role-permission";
import { RoleFormModal } from "./RoleFormModal";
import { RoleResponse, RoleDetailResponse } from "../types";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { tenantService } from "@/features/admin/tenant/services/tenant.service";
import { rolePermissionService } from "../services/role-permission.service";
import ListHeader from "@/components/shared/layout/ListHeader";
import ContentCard from "@/components/shared/layout/ContentCard";
import BaseButton from "@/components/ui/BaseButton";
import BaseSelect from "@/components/ui/BaseSelect";
import DataTable from "@/components/tables/DataTable";
import { Plus } from "lucide-react";




export const RoleManagementPage: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const tenantId = user?.tenantId;

  const { modal } = App.useApp();
  const [messageApi, contextHolder] = message.useMessage();
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [isSystemFilter, setIsSystemFilter] = useState<boolean | undefined>(undefined);
  const [selectedFilterTenantId, setSelectedFilterTenantId] = useState<string | undefined>(undefined);
  const [sortBy, setSortBy] = useState<string | undefined>(undefined);
  const [sortDir, setSortDir] = useState<"asc" | "desc" | undefined>(undefined);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RoleDetailResponse | undefined>(undefined);
  const [isFetchingRole, setIsFetchingRole] = useState(false);

  const { data: rolesResponse, isLoading, isFetching } = useRolesQuery({
    tenantId: user?.role === "PLATFORM_ADMIN" ? selectedFilterTenantId : (tenantId || undefined),
    search,
    isSystem: isSystemFilter,
    sortBy,
    sortDir,
    page,
    size,
  });

  const { data: tenantsData, isLoading: isLoadingTenants } = useQuery({
    queryKey: ["tenants", "all"],
    queryFn: () => tenantService.listTenants({ size: 100 }),
    enabled: user?.role === "PLATFORM_ADMIN",
  });
  const tenantOptions = tenantsData?.content?.map((t) => ({ label: t.name, value: t.id })) || [];

  const deleteRole = useDeleteRoleMutation();

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(0); // Reset page on search
  };

  const handleFilterChange = (value: boolean | undefined) => {
    setIsSystemFilter(value);
    setPage(0);
  };

  const handleTenantFilterChange = (value: string | undefined) => {
    setSelectedFilterTenantId(value);
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
      content: `Bạn có chắc chắn muốn xóa role "${name}" không? Hành động này không thể hoàn tác.`,
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

  const columns = [
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
                  icon={<EyeOutlined />}
                  onClick={() => openEditModal(record)}
                  loading={isFetchingRole}
                  className="text-blue-600 hover:text-blue-800"
                />
              </Tooltip>
            ) : (
              <>
                {hasPermission("roles:update") && (
                  <Tooltip title="Sửa">
                    <BaseButton
                      type="text"
                      icon={<EditOutlined />}
                      onClick={() => openEditModal(record)}
                      disabled={isFetchingRole}
                      loading={isFetchingRole}
                      className="text-blue-600 hover:text-blue-800"
                    />
                  </Tooltip>
                )}
                {hasPermission("roles:delete") && (
                  <Tooltip title="Xóa">
                    <BaseButton
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => handleDelete(record.id, record.name)}
                    />
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
          <h2 className="!text-[35px] !font-semibold text-slate-900 tracking-tight">
            Vai trò & Phân quyền
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Quản lý các vai trò và thiết lập quyền hạn truy cập hệ thống
          </p>
        </div>
        {hasPermission("roles:create") && (
          <BaseButton
            type="primary"
            icon={<Plus className="h-4.5 w-4.5" />}
            onClick={openCreateModal}
            className="!bg-blue-600 !text-white hover:!bg-blue-700 !border-0 shadow-lg shadow-blue-500/25 h-10 px-5 rounded-xl font-bold hover:-translate-y-0.5 transition-all flex items-center gap-2"
          >
            Tạo Role
          </BaseButton>
        )}
      </div>

      <ContentCard noPadding>
        <ListHeader
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-5 border-b border-slate-100"
          searchValue={searchInput}
          onSearchChange={setSearchInput}
          searchPlaceholder="Tìm kiếm theo tên..."
          filters={
            <div className="flex gap-3">
              <BaseSelect
                placeholder="Lọc theo loại Role"
                allowClear
                className="w-48"
                onChange={handleFilterChange}
                options={[
                  { value: true, label: 'Role Hệ thống' },
                  { value: false, label: 'Role Tùy chỉnh' },
                ]}
              />
              {user?.role === "PLATFORM_ADMIN" && (
                <BaseSelect
                  placeholder="Lọc theo Công ty"
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  className="w-56"
                  onChange={handleTenantFilterChange}
                  options={tenantOptions}
                  loading={isLoadingTenants}
                />
              )}
            </div>
          }
        />
        <div className="p-5">
          <DataTable
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
        tenantId={tenantId || ""}
        initialData={selectedRole}
      />
    </div>
  );
};
