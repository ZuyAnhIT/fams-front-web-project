"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Building2, ChevronRight } from "lucide-react";
import { Input } from "antd";
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
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-10 bg-indigo-50/50 rounded-3xl border border-indigo-100 backdrop-blur-sm">
        <div className="h-20 w-20 bg-white rounded-full flex items-center justify-center shadow-sm mb-6">
          <Building2 className="h-10 w-10 text-indigo-400" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-3 tracking-tight">Không có quyền truy cập</h2>
        <p className="text-slate-500 max-w-md leading-relaxed font-medium">
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
      dataIndex: "name",
      sorter: true,
      render: (_: unknown, record: Tenant) => (
        <div className="flex items-center gap-3 py-1">
          {record.logoUrl ? (
            <img 
              src={record.logoUrl} 
              alt={record.name} 
              className="h-9 w-9 rounded-lg ring-1 ring-slate-200 object-contain bg-white p-1 shadow-sm" 
            />
          ) : (
            <div className="h-9 w-9 bg-indigo-100 text-indigo-700 rounded-lg flex items-center justify-center font-bold text-base shrink-0 shadow-inner">
              {record.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex flex-col">
            <span className="font-bold text-slate-900 text-sm">{record.name}</span>
            <span className="text-xs text-slate-500 font-medium">{record.domain || record.slug}</span>
          </div>
        </div>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        const statusConfig: Record<string, { bg: string, text: string, label: string }> = {
          active: { bg: "bg-emerald-100", text: "text-emerald-700", label: "Hoạt động" },
          inactive: { bg: "bg-amber-100", text: "text-amber-700", label: "Tạm dừng" },
          suspended: { bg: "bg-rose-100", text: "text-rose-700", label: "Đình chỉ" },
          trial: { bg: "bg-indigo-100", text: "text-indigo-700", label: "Dùng thử" },
        };
        const config = statusConfig[status] || { bg: "bg-slate-100", text: "text-slate-700", label: status };

        return (
          <span className={`px-2 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider ${config.bg} ${config.text}`}>
            {config.label}
          </span>
        );
      },
    },
    {
      title: "Quốc gia",
      dataIndex: "countryCode",
      key: "countryCode",
      render: (code: string) => (
        <span className="font-medium text-slate-600 text-sm">{code || "---"}</span>
      ),
    },
    {
      title: "Ngày đăng ký",
      dataIndex: "createdAt",
      key: "createdAt",
      sorter: true,
      render: (dateStr: string) => (
        <span className="font-medium text-slate-600 text-sm">
          {format(new Date(dateStr), "dd/MM/yyyy")}
        </span>
      ),
    },
    {
      title: "Thao tác",
      key: "action",
      width: 120,
      render: (_: unknown, record: Tenant) => (
        <BaseButton
          type="default"
          icon={<ChevronRight className="h-4 w-4" />}
          className="!text-indigo-600 !border-indigo-200 hover:!bg-indigo-50 hover:!border-indigo-300 shadow-sm h-8 px-3 rounded-lg text-xs font-semibold flex flex-row-reverse"
          onClick={(e) => {
            e.stopPropagation();
            const { setActiveTenant } = require("@/stores/tenant.store").useTenantStore.getState();
            setActiveTenant(record as Tenant);
            router.push(`/tenants/${record.id}`);
          }}
        >
          Chi tiết
        </BaseButton>
      ),
    },
  ];

  return (
    <RoleGuard allowedRoles={[SystemRole.PLATFORM_ADMIN]}>
      <div className="space-y-6">
        {/* Header Actions - Vibrant Block Style */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200/60 shadow-sm">
          <div className="flex-1 w-full max-w-md relative group">
            <Input
              placeholder="Tìm kiếm theo tên công ty, đường dẫn, tên miền,..."
              prefix={<Search className="h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="h-11 rounded-xl border-slate-200 hover:border-indigo-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 shadow-sm transition-all text-sm font-medium"
              allowClear
            />
          </div>

          <div className="flex gap-3 w-full sm:w-auto">
            <BaseButton
              type="primary"
              icon={<Plus className="h-4.5 w-4.5" />}
              onClick={() => setIsCreateModalOpen(true)}
              className="!bg-indigo-600 !text-white hover:!bg-indigo-700 !border-0 shadow-lg shadow-indigo-500/25 h-11 px-6 rounded-xl font-bold hover:-translate-y-0.5 transition-all flex items-center gap-2"
            >
              Thêm công ty mới
            </BaseButton>
          </div>
        </div>

        {/* Data Table Wrapper */}
        <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden">
          <DataTable
            columns={columns}
            data={pageData?.content || []}
            loading={isLoading}
            totalElements={pageData?.page.totalElements || 0}
            currentPage={state.page}
            pageSize={state.size}
            onPageChange={(page, size) => setPagination({ page, size })}
            onChange={(_, __, sorter) => {
              if (!Array.isArray(sorter) && sorter.field) {
                setPagination({
                  sortBy: sorter.field as string,
                  sortDir: sorter.order === "ascend" ? "asc" : sorter.order === "descend" ? "desc" : undefined,
                });
              } else {
                setPagination({ sortBy: undefined, sortDir: undefined });
              }
            }}
            onRow={(record) => ({
              onClick: () => {
                const { setActiveTenant } = require("@/stores/tenant.store").useTenantStore.getState();
                setActiveTenant(record as Tenant);
                router.push(`/tenants/${record.id}`);
              },
              className: "cursor-pointer hover:bg-indigo-50/50 transition-colors duration-200 group",
            })}
          />
        </div>

        <CreateTenantModal
          open={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
        />
      </div>
    </RoleGuard>
  );
}
