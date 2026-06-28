"use client";

import React, { useState } from "react";
import { Table, Input, Button, Space, Tag, Modal, message, Select, Tooltip, App } from "antd";
import { useAuthStore } from "@/stores/auth.store";
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, InfoCircleOutlined, EyeOutlined } from "@ant-design/icons";
import { useRolesQuery, useDeleteRoleMutation } from "../hooks/use-role-permission";
import { RoleFormModal } from "./RoleFormModal";
import { RoleResponse, RoleDetailResponse } from "../types";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { tenantService } from "@/features/tenant/services/tenant.service";
import { rolePermissionService } from "../services/role-permission.service";




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

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RoleDetailResponse | undefined>(undefined);
  const [isFetchingRole, setIsFetchingRole] = useState(false);

  const { data: rolesResponse, isLoading, isFetching } = useRolesQuery({
    tenantId: user?.role === "PLATFORM_ADMIN" ? selectedFilterTenantId : (tenantId || undefined),
    search,
    isSystem: isSystemFilter,
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
      title: "Tên Role",
      dataIndex: "name",
      key: "name",
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
              <Button
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
                  <Button
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
                  <Button
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
    <div className="p-6 max-w-7xl mx-auto">
      {contextHolder}

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Phân quyền (Roles)</h1>
          <p className="text-sm text-gray-500 mt-1">Quản lý danh sách role và các quyền tương ứng cho hệ thống.</p>
        </div>
        {hasPermission("roles:create") && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={openCreateModal}
            size="large"
            className="bg-blue-600 hover:bg-blue-700"
          >
            Tạo Role
          </Button>
        )}
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6 flex flex-wrap gap-4 items-center justify-between">
        <Space size="middle" className="flex-wrap">
          <Input
            placeholder="Tìm kiếm theo tên..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onPressEnter={handleSearch}
            prefix={<SearchOutlined className="text-gray-400" />}
            className="w-64"
            allowClear
          />
          <Button onClick={handleSearch}>Tìm kiếm</Button>

          <Select
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
            <Select
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
        </Space>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <Table
          columns={columns}
          dataSource={rolesResponse?.data?.content || []}
          rowKey="id"
          loading={isLoading || isFetching}
          pagination={{
            current: page + 1,
            pageSize: size,
            total: rolesResponse?.data?.totalElements || 0,
            showSizeChanger: true,
            onChange: (p, s) => {
              setPage(p - 1);
              setSize(s);
            },
          }}
        />
      </div>

      <RoleFormModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        tenantId={tenantId || ""}
        initialData={selectedRole}
      />
    </div>
  );
};
