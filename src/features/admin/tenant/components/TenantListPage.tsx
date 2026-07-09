"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Building2, ChevronRight, MoreVertical, Ban, PlayCircle } from "lucide-react";
import { Input, Select, Dropdown, MenuProps, Modal, message } from "antd";
import DataTable from "@/components/tables/DataTable";
import BaseButton from "@/components/ui/BaseButton";
import { usePagination } from "@/hooks/usePagination";
import { useDebounce } from "@/hooks/useDebounce";
import { useTenants, useSuspendTenant, useReactivateTenant } from "../hooks/use-tenant";
import CreateTenantModal from "./CreateTenantModal";
import type { Tenant } from "../types/tenant.type";
import { format } from "date-fns";
import RoleGuard from "@/components/guards/RoleGuard";
import { SystemRole } from "@/features/customer/auth/types/auth.type";
import ListHeader from "@/components/shared/layout/ListHeader";
import ContentCard from "@/components/shared/layout/ContentCard";
import StatusBadge from "@/components/ui/StatusBadge";
import { TENANT_STATUS } from "@/constants/status";

import { useRouter } from "next/navigation";

export default function TenantListPage() {
  const router = useRouter();
  const { state, setPagination } = usePagination(20);
  const { mutate: suspendTenant, isPending: isSuspending } = useSuspendTenant();
  const { mutate: reactivateTenant, isPending: isReactivating } = useReactivateTenant();
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
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-10 bg-blue-50/50 rounded-3xl border border-blue-100 backdrop-blur-sm">
        <div className="p-4 bg-white rounded-full shadow-sm mb-4">
          <Building2 className="h-10 w-10 text-blue-400" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-3 tracking-tight">Không có quyền truy cập</h2>
        <p className="text-slate-500 max-w-md leading-relaxed font-medium">
          Chức năng Quản lý danh sách công ty (Tenants) chỉ dành cho Platform Admin.
          Vui lòng liên hệ quản trị viên hệ thống nếu bạn cần truy cập.
        </p>
      </div>
    );
  }

  const handleSuspend = (tenant: Tenant) => {
    Modal.confirm({
      title: "Xác nhận đình chỉ",
      content: `Bạn có chắc chắn muốn đình chỉ công ty "${tenant.name}" không? Toàn bộ truy cập của công ty này sẽ bị chặn ngay lập tức.`,
      okText: "Đình chỉ",
      cancelText: "Hủy",
      okButtonProps: { danger: true },
      onOk: () => {
        return new Promise((resolve, reject) => {
          suspendTenant(tenant.id, {
            onSuccess: () => {
              message.success(`Đã đình chỉ công ty ${tenant.name} thành công`);
              resolve(true);
            },
            onError: (err: any) => {
              message.error(`Không thể đình chỉ công ty: ${err?.response?.data?.message || err.message}`);
              reject(err);
            }
          });
        });
      }
    });
  };

  const handleReactivate = (tenant: Tenant) => {
    Modal.confirm({
      title: "Xác nhận kích hoạt",
      content: `Bạn có chắc chắn muốn kích hoạt lại công ty "${tenant.name}" không?`,
      okText: "Kích hoạt",
      cancelText: "Hủy",
      onOk: () => {
        return new Promise((resolve, reject) => {
          reactivateTenant(tenant.id, {
            onSuccess: () => {
              message.success(`Đã kích hoạt công ty ${tenant.name} thành công`);
              resolve(true);
            },
            onError: (err: any) => {
              message.error(`Không thể kích hoạt công ty: ${err?.response?.data?.message || err.message}`);
              reject(err);
            }
          });
        });
      }
    });
  };

  const getActionMenuItems = (record: Tenant): MenuProps['items'] => {
    const items: MenuProps['items'] = [
      {
        key: 'detail',
        label: 'Chi tiết',
        icon: <ChevronRight className="h-4 w-4" />,
        onClick: () => {
          const { setActiveTenant } = require("@/stores/tenant.store").useTenantStore.getState();
          setActiveTenant(record);
          router.push(`/admin/tenants/${record.id}`);
        }
      }
    ];

    if (record.status !== 'cancelled') {
      items.push({ type: 'divider' });
      if (record.status === 'suspended') {
        items.push({
          key: 'reactivate',
          label: 'Kích hoạt lại',
          icon: <PlayCircle className="h-4 w-4 text-green-600" />,
          onClick: () => handleReactivate(record)
        });
      } else {
        items.push({
          key: 'suspend',
          label: 'Đình chỉ',
          danger: true,
          icon: <Ban className="h-4 w-4 text-red-600" />,
          onClick: () => handleSuspend(record)
        });
      }
    }

    return items;
  };

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
            <div className="h-9 w-9 bg-blue-100 text-blue-700 rounded-lg flex items-center justify-center font-bold text-base shrink-0 shadow-inner">
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
      render: (status: string) => (
        <StatusBadge status={status} variant="dot" configMap={TENANT_STATUS} />
      ),
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
      width: 80,
      align: 'center',
      render: (_: unknown, record: Tenant) => (
        <Dropdown menu={{ items: getActionMenuItems(record) }} trigger={['click']} placement="bottomRight">
          <BaseButton
            type="default"
            icon={<MoreVertical className="h-4 w-4" />}
            className="!text-slate-600 !border-transparent hover:!bg-slate-100 hover:!border-slate-200 h-8 w-8 px-0 rounded-lg flex items-center justify-center transition-all duration-200"
            onClick={(e) => e.stopPropagation()}
            disabled={isSuspending || isReactivating}
          />
        </Dropdown>
      ),
    },
  ];

  return (
    <RoleGuard allowedRoles={[SystemRole.PLATFORM_ADMIN]}>
      <div className="space-y-6">
        {/* Data Table Wrapper */}
        <ContentCard noPadding>
          <ListHeader
            className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-5"
            searchValue={searchInput}
            onSearchChange={setSearchInput}
            searchPlaceholder="Tìm kiếm theo tên công ty, đường dẫn, tên miền,..."
            filters={
              <Select
                placeholder="Trạng thái"
                allowClear
                className="w-40 h-10 [&_.ant-select-selector]:rounded-xl [&_.ant-select-selector]:border-slate-200 hover:[&_.ant-select-selector]:border-blue-300 focus:[&_.ant-select-selector]:border-blue-500 bg-slate-50/50 hover:bg-white"
                value={state.status}
                onChange={(val) => setPagination({ status: val || undefined, page: 0 })}
                options={[
                  { label: "Tất cả trạng thái", value: "" },
                  ...Object.entries(TENANT_STATUS).map(([key, config]) => ({
                    label: config.label,
                    value: key,
                  }))
                ]}
              />
            }
            actions={
              <BaseButton
                type="primary"
                icon={<Plus className="h-4.5 w-4.5" />}
                onClick={() => setIsCreateModalOpen(true)}
                className="!bg-brand-primary !text-white hover:!bg-brand-primary/90 !border-0 shadow-lg shadow-brand-primary/25 h-10 px-5 rounded-xl font-bold hover:-translate-y-0.5 transition-all flex items-center gap-2"
              >
                Thêm mới
              </BaseButton>
            }
          />
          <div className="p-5">
            <DataTable
              columns={columns}
              data={pageData?.content || []}
              loading={isLoading}
              totalElements={pageData?.totalElements || 0}
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
                className: "hover:bg-blue-50/50 transition-colors duration-200 group",
              })}
            />
          </div>
        </ContentCard>

        <CreateTenantModal
          open={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
        />
      </div>
    </RoleGuard>
  );
}
