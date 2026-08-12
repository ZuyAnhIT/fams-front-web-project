"use client";

import { useState, useEffect } from "react";
import { Plus, Building2, ChevronRight, MoreVertical, Ban, PlayCircle } from "lucide-react";
import { Dropdown, MenuProps, Modal, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import DataTable from "@/components/tables/DataTable";
import { BaseButton, BaseSelect } from "@/components/ui";
import { usePagination } from "@/hooks/usePagination";
import { useDebounce } from "@/hooks/useDebounce";
import { useTenants, useSuspendTenant, useReactivateTenant, useCancelTenant } from "../hooks/use-tenant";
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
import { useTenantStore } from "@/stores/tenant.store";
import { useAuthStore } from "@/stores/auth.store";
import type { TenantListParams } from "../types/tenant.type";
import { getApiErrorMessage } from "@/utils/api-error.util";
import Image from "next/image";

export default function TenantListPage() {
  const router = useRouter();
  const setActiveTenant = useTenantStore((state) => state.setActiveTenant);
  const user = useAuthStore((authState) => authState.user);
  const isPlatformAdmin = user?.role === SystemRole.PLATFORM_ADMIN;
  const canCreate = isPlatformAdmin || user?.permissions?.includes("tenants:create");
  const { state, setPagination } = usePagination(20);
  const { mutate: suspendTenant, isPending: isSuspending } = useSuspendTenant();
  const { mutate: reactivateTenant, isPending: isReactivating } = useReactivateTenant();
  const { mutate: cancelTenant } = useCancelTenant();
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
  const listParams: TenantListParams = {
    ...state,
    sortBy: state.sortBy as TenantListParams["sortBy"],
  };
  const { data: pageData, isLoading, error } = useTenants(listParams);

  if (error && (error as { response?: { status?: number } }).response?.status === 403) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-10 bg-blue-50/50 rounded-3xl border border-blue-100 backdrop-blur-sm">
        <div className="p-4 bg-white rounded-full shadow-sm mb-4">
          <Building2 className="h-10 w-10 text-blue-400" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-3 tracking-tight">Không có quyền truy cập</h2>
        <p className="text-slate-500 max-w-md leading-relaxed font-medium">
          Tài khoản cần quyền <code>tenants:list</code> để xem danh sách công ty.
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
            onError: (error: unknown) => {
              message.error(`Không thể đình chỉ công ty: ${getApiErrorMessage(error, "Vui lòng thử lại")}`);
              reject(error);
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
            onError: (error: unknown) => {
              message.error(`Không thể kích hoạt công ty: ${getApiErrorMessage(error, "Vui lòng thử lại")}`);
              reject(error);
            }
          });
        });
      }
    });
  };

  const handleCancel = (tenant: Tenant) => {
    Modal.confirm({
      title: "Xác nhận hủy bỏ vĩnh viễn",
      content: `Bạn có chắc chắn muốn hủy bỏ vĩnh viễn công ty "${tenant.name}" không? Hành động này không thể hoàn tác và toàn bộ dữ liệu truy cập sẽ bị chặn vĩnh viễn.`,
      okText: "Hủy bỏ vĩnh viễn",
      cancelText: "Thoát",
      okButtonProps: { danger: true },
      onOk: () => {
        return new Promise((resolve, reject) => {
          cancelTenant(tenant.id, {
            onSuccess: () => {
              message.success(`Đã hủy bỏ vĩnh viễn công ty ${tenant.name} thành công`);
              resolve(true);
            },
            onError: (error: unknown) => {
              message.error(`Không thể hủy bỏ công ty: ${getApiErrorMessage(error, "Vui lòng thử lại")}`);
              reject(error);
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
          setActiveTenant(record);
          router.push(`/admin/tenants/${record.id}`);
        }
      }
    ];

    if (isPlatformAdmin && record.status !== 'cancelled') {
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
      
      items.push({
        key: 'cancel',
        label: 'Hủy bỏ',
        danger: true,
        icon: <Ban className="h-4 w-4 text-red-600" />,
        onClick: () => handleCancel(record)
      });
    }

    return items;
  };

  const columns: ColumnsType<Tenant> = [
    {
      title: "Công ty",
      key: "name",
      dataIndex: "name",
      sorter: true,
      render: (_: unknown, record: Tenant) => (
        <div className="flex items-center gap-3 py-1">
          {record.logoUrl ? (
            <Image
              src={record.logoUrl}
              alt={record.name}
              width={36}
              height={36}
              unoptimized
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
      title: "Chủ công ty",
      key: "owner",
      render: (_: unknown, record: Tenant) => (
        <div className="flex flex-col">
          <span className="font-medium text-slate-900 text-sm">{record.ownerName || "---"}</span>
          <span className="text-xs text-slate-500">{record.ownerEmail || ""}</span>
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
      align: "center",
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
    <RoleGuard allowedRoles={[SystemRole.PLATFORM_ADMIN]} allowedPermissions={["tenants:list"]}>
      <div className="space-y-6">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Danh sách công ty</h1>
            <p className="text-sm text-brand-600 mt-1">
              Quản lý toàn bộ công ty (tenants) đang sử dụng hệ thống
            </p>
          </div>
          {canCreate && (
            <BaseButton
              type="primary"
              icon={<Plus className="h-4.5 w-4.5" />}
              onClick={() => setIsCreateModalOpen(true)}
              className="!bg-blue-600 !text-white hover:!bg-blue-700 !border-0 shadow-lg shadow-blue-500/25 h-10 px-5 rounded-xl font-bold hover:-translate-y-0.5 transition-all flex items-center gap-2"
            >
              Cấp phát công ty
            </BaseButton>
          )}
        </div>
        {/* Data Table Wrapper */}
        <ContentCard noPadding>
          <ListHeader
            className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-5"
            searchValue={searchInput}
            onSearchChange={setSearchInput}
            searchPlaceholder="Tìm kiếm theo tên công ty, đường dẫn, tên miền,..."
            searchAriaLabel="Tìm công ty theo tên, đường dẫn hoặc tên miền"
            filters={
              <div className="flex flex-wrap gap-2">
                <input
                  aria-label="Lọc theo lĩnh vực"
                  value={state.industry || ""}
                  onChange={(event) => setPagination({ industry: event.target.value || undefined })}
                  placeholder="Lĩnh vực"
                  className="h-8 w-36 rounded-md border border-slate-300 px-3 text-sm"
                />
                <input
                  aria-label="Lọc theo mã quốc gia"
                  value={state.countryCode || ""}
                  onChange={(event) => setPagination({ countryCode: event.target.value.toUpperCase() || undefined })}
                  placeholder="Quốc gia (VN)"
                  maxLength={2}
                  className="h-8 w-36 rounded-md border border-slate-300 px-3 text-sm uppercase"
                />
                <BaseSelect
                aria-label="Lọc công ty theo trạng thái"
                placeholder="Trạng thái"
                allowClear
                className="w-40"
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
              </div>
            }
          />
          <div className="p-5">
            <DataTable
              ariaLabel="Danh sách công ty sử dụng nền tảng"
              emptyTitle="Không tìm thấy công ty"
              emptyDescription="Thử thay đổi từ khóa hoặc bộ lọc trạng thái."
              columns={columns}
              data={pageData?.content || []}
              loading={isLoading}
              totalElements={pageData?.totalElements || 0}
              currentPage={state.page}
              pageSize={state.size}
              onPageChange={(page, size) => setPagination({ page, size })}
              onChange={(_, __, sorter) => {
                if (!Array.isArray(sorter) && (sorter.field || sorter.columnKey)) {
                  setPagination({
                    sortBy: (sorter.field || sorter.columnKey) as string,
                    sortDir: sorter.order === "ascend" ? "asc" : sorter.order === "descend" ? "desc" : undefined,
                  });
                } else {
                  setPagination({ sortBy: undefined, sortDir: undefined });
                }
              }}
              onRow={() => ({
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
