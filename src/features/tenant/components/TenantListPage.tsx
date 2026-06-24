"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Building2 } from "lucide-react";
import { Input, Tag } from "antd";
import DataTable from "@/components/tables/DataTable";
import BaseButton from "@/components/ui/BaseButton";
import { usePagination } from "@/hooks/usePagination";
import { useDebounce } from "@/hooks/useDebounce";
import { useTenants } from "../hooks/use-tenant";
import CreateTenantModal from "./CreateTenantModal";
import type { Tenant } from "../types/tenant.type";
import { format } from "date-fns";
import RoleGuard from "@/components/guards/RoleGuard";
import { SystemRole } from "@/features/auth/types/auth.type";

import { useRouter } from "next/navigation";

export default function TenantListPage() {
  const router = useRouter();
  const { state, setPagination } = usePagination(20);
  const [searchInput, setSearchInput] = useState(state.search || "");
  const debouncedSearch = useDebounce(searchInput, 600);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Sync debounce search to URL
  useEffect(() => {
    const currentSearch = state.search || "";
    if (debouncedSearch !== currentSearch) {
      setPagination({ search: debouncedSearch });
    }
  }, [debouncedSearch, state.search, setPagination]);

  // Handle API error gently (e.g. if user is not Platform Admin)
  const { data: pageData, isLoading, error } = useTenants(state);

  if (error && (error as { response?: { status?: number } }).response?.status === 403) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 bg-rose-50/50 rounded-2xl border border-rose-100">
        <Building2 className="h-12 w-12 text-rose-300 mb-4" />
        <h2 className="text-xl font-bold text-rose-800 mb-2">Không có quyền truy cập</h2>
        <p className="text-rose-600 max-w-md">
          Chức năng Quản lý danh sách công ty (Tenants) chỉ dành cho Platform Admin.
          Vui lòng liên hệ quản trị viên hệ thống nếu bạn cần truy cập.
        </p>
      </div>
    );
  }

  const columns = [
    {
      title: "Công ty",
      key: "name",
      render: (_: unknown, record: Tenant) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-brand-100 text-brand-600 rounded-lg flex items-center justify-center font-bold">
            {record.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-brand-900">{record.name}</span>
            <span className="text-xs text-brand-500">{record.domain || record.slug}</span>
          </div>
        </div>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        let color = "default";
        let label = status;
        if (status === "active") { color = "success"; label = "Hoạt động"; }
        else if (status === "inactive") { color = "warning"; label = "Tạm dừng"; }
        else if (status === "suspended") { color = "error"; label = "Đình chỉ"; }

        return <Tag color={color}>{label}</Tag>;
      },
    },
    {
      title: "Quốc gia",
      dataIndex: "countryCode",
      key: "countryCode",
      render: (code: string) => code || "---",
    },
    {
      title: "Ngày đăng ký",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (dateStr: string) => format(new Date(dateStr), "dd/MM/yyyy"),
    },
    {
      title: "Nhân viên",
      key: "limits",
      render: (_: unknown, record: Tenant) => (
        <span className="text-sm text-brand-600 font-medium">Tối đa {record.maxEmployees}</span>
      ),
    },
  ];

  return (
    <RoleGuard allowedRoles={[SystemRole.PLATFORM_ADMIN]}>
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex-1 w-full max-w-md relative">
          <Input
            placeholder="Tìm kiếm công ty theo tên, slug..."
            prefix={<Search className="h-4 w-4 text-brand-400" />}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="h-10 rounded-lg border-brand-300 focus:border-brand-500 focus:ring-brand-500/20"
            allowClear
          />
        </div>

        <div className="flex gap-3 w-full sm:w-auto">
          <BaseButton
            type="primary"
            icon={<Plus className="h-4 w-4" />}
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-brand-600 border-transparent"
          >
            Thêm công ty mới
          </BaseButton>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={pageData?.content || []}
        loading={isLoading}
        totalElements={pageData?.page.totalElements || 0}
        currentPage={state.page}
        pageSize={state.size}
        onPageChange={(page, size) => setPagination({ page, size })}
        onRow={(record) => ({
          onClick: () => {
            const { setActiveTenant } = require("@/stores/tenant.store").useTenantStore.getState();
            setActiveTenant(record as Tenant);
            router.push(`/tenants/${record.id}`);
          },
          className: "cursor-pointer hover:bg-brand-50 transition-colors",
        })}
      />

        <CreateTenantModal
          open={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
        />
      </div>
    </RoleGuard>
  );
}
