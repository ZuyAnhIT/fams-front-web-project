"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Shield, Trash2, Edit } from "lucide-react";
import { Input, Tag, message, Popconfirm } from "antd";
import DataTable from "@/components/tables/DataTable";
import BaseButton from "@/components/ui/BaseButton";
import ListHeader from "@/components/shared/layout/ListHeader";
import ContentCard from "@/components/shared/layout/ContentCard";
import { usePagination } from "@/hooks/usePagination";
import { useDebounce } from "@/hooks/useDebounce";
import { useRoles, useDeleteRole } from "../hooks/use-role";
import type { Role } from "../types/role.type";
import { format } from "date-fns";

export default function RoleListPage() {
  const router = useRouter();
  const { state, setPagination } = usePagination(20);
  const [searchInput, setSearchInput] = useState(state.search || "");
  const debouncedSearch = useDebounce(searchInput, 600);

  // Sync debounce search to URL
  useMemo(() => {
    if (debouncedSearch !== state.search) {
      setPagination({ search: debouncedSearch });
    }
  }, [debouncedSearch, state.search, setPagination]);

  const { data: pageData, isLoading } = useRoles(state);
  const { mutateAsync: deleteRole, isPending: isDeleting } = useDeleteRole();

  const handleDelete = async (id: string) => {
    try {
      await deleteRole(id);
      message.success("Xóa vai trò thành công");
    } catch (error: any) {
      message.error(error.response?.data?.message || "Lỗi khi xóa vai trò");
    }
  };

  const columns = [
    {
      title: "Vai trò",
      key: "name",
      render: (_: any, record: Role) => (
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${record.isSystem ? 'bg-rose-50 text-rose-600 ring-1 ring-rose-500/20' : 'bg-blue-50 text-blue-600 ring-1 ring-blue-500/20'}`}>
            <Shield className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-brand-900">{record.name}</span>
            <span className="text-xs text-brand-500 line-clamp-1">{record.description || "---"}</span>
          </div>
        </div>
      ),
    },
    {
      title: "Loại vai trò",
      dataIndex: "isSystem",
      key: "isSystem",
      render: (isSystem: boolean) => (
        isSystem 
          ? <Tag color="error" className="border-rose-200">Hệ thống</Tag>
          : <Tag color="blue" className="border-blue-200">Tùy chỉnh</Tag>
      ),
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (dateStr: string) => format(new Date(dateStr), "dd/MM/yyyy"),
    },
    {
      title: "Thao tác",
      key: "actions",
      render: (_: any, record: Role) => (
        <div className="flex gap-2">
          <BaseButton 
            size="small" 
            onClick={() => router.push(`/settings/roles/${record.id}`)}
            icon={<Edit className="h-4 w-4" />}
          >
            Sửa
          </BaseButton>
          {!record.isSystem && (
            <Popconfirm
              title="Xóa vai trò"
              description="Bạn có chắc chắn muốn xóa vai trò này? Các nhân viên đang giữ vai trò này có thể bị mất quyền."
              onConfirm={() => handleDelete(record.id)}
              okText="Xóa"
              cancelText="Hủy"
              okButtonProps={{ danger: true, loading: isDeleting }}
            >
              <BaseButton size="small" danger icon={<Trash2 className="h-4 w-4" />} />
            </Popconfirm>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <ListHeader
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        searchPlaceholder="Tìm kiếm vai trò..."
        actions={
          <BaseButton 
            type="primary" 
            icon={<Plus className="h-4.5 w-4.5" />}
            onClick={() => router.push("/settings/roles/create")}
            className="!bg-blue-600 !text-white hover:!bg-blue-700 !border-0 shadow-lg shadow-blue-500/25 h-11 px-5 rounded-xl font-bold hover:-translate-y-0.5 transition-all flex items-center gap-2"
          >
            Thêm vai trò mới
          </BaseButton>
        }
      />

      {/* Data Table */}
      <ContentCard noPadding>
        <DataTable
          columns={columns}
          data={pageData?.content || []}
          loading={isLoading}
          totalElements={pageData?.page.totalElements || 0}
          currentPage={state.page}
          pageSize={state.size}
          onPageChange={(page, size) => setPagination({ page, size })}
        />
      </ContentCard>
    </div>
  );
}
