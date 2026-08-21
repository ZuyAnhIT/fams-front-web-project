"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Mail, FileDown, FileUp, ChevronRight } from "lucide-react";
import { Tag, Dropdown, MenuProps, App, Alert, Input, Space } from "antd";
import BaseSelect from "@/components/ui/BaseSelect";
import DataTable from "@/components/tables/DataTable";
import BaseButton from "@/components/ui/BaseButton";
import { usePagination } from "@/hooks/usePagination";
import { useDebounce } from "@/hooks/useDebounce";
import { useEmployees, useChangeEmployeeStatus, useExportEmployees } from "../hooks/use-employee";
import { useWorkspacesQuery } from "@/features/customer/workspace/hooks/use-workspace";
import InviteEmployeeModal from "./InviteEmployeeModal";
import EmployeeFormModal from "./EmployeeFormModal";
import { useAuthStore } from "@/stores/auth.store";
import ImportEmployeeModal from "./ImportEmployeeModal";
import type { Employee, EmployeeDetailResponse } from "../types/employee.type";
import { format } from "date-fns";
import ListHeader from "@/components/shared/layout/ListHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import { EMPLOYEE_STATUS } from "@/constants/status";
import { formatVietnameseName } from "@/utils/name.util";
import MaskedValue from "@/components/security/MaskedValue";
import { SystemRole } from "@/features/customer/auth/types/auth.type";
import type { ColumnsType } from "antd/es/table";
import Image from "next/image";
import SavedFilterToolbar from "@/features/shared/saved-filter/components/SavedFilterToolbar";
import type { SavedFilterParams } from "@/features/shared/saved-filter/types/saved-filter.type";

export default function EmployeeListPage() {
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const user = useAuthStore((state) => state.user);
  const { message, modal } = App.useApp();
  const router = useRouter();
  const canViewSensitiveData = user?.role === SystemRole.PLATFORM_ADMIN || hasPermission("employees:pii:read");
  const { state, setPagination } = usePagination(20);
  const [searchInput, setSearchInput] = useState(state.search || "");
  const debouncedSearch = useDebounce(searchInput, 600);

  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isEmployeeFormOpen, setIsEmployeeFormOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<EmployeeDetailResponse | null>(null);

  // Sync debounce search to URL
  useEffect(() => {
    const currentSearch = state.search || "";
    if (debouncedSearch !== currentSearch) {
      setPagination({ search: debouncedSearch });
    }
  }, [debouncedSearch, state.search, setPagination]);

  const { data: pageData, isLoading } = useEmployees(state);
  const { mutate: changeStatus } = useChangeEmployeeStatus();
  const { mutateAsync: exportEmployees, isPending: isExporting } = useExportEmployees();
  const { data: workspacesData } = useWorkspacesQuery({
    tenantId: user?.tenantId || "",
    status: "active",
    size: 100,
  });
  const workspaceFilterOptions = workspacesData?.data?.content?.map((w) => ({
    label: w.name,
    value: w.id,
  })) || [];

  const savedParams = useMemo<SavedFilterParams>(() => Object.fromEntries(
    Object.entries({
      status: state.status,
      department: state.department,
      workspaceId: state.workspaceId,
      faceRegistered: state.faceRegistered,
    }).filter(([, value]) => value !== undefined),
  ), [state.status, state.department, state.workspaceId, state.faceRegistered]);

  const applySavedFilter = useCallback((stored: SavedFilterParams) => {
    setPagination({
      page: 0,
      status: typeof stored.status === "string" ? stored.status : undefined,
      department: typeof stored.department === "string" ? stored.department : undefined,
      workspaceId: typeof stored.workspaceId === "string" ? stored.workspaceId : undefined,
      faceRegistered: typeof stored.faceRegistered === "boolean" ? stored.faceRegistered : undefined,
    });
  }, [setPagination]);

  const handleStatusChange = (
    record: Employee,
    newStatus: "active" | "inactive" | "terminated",
  ) => {
    const label = {
      active: "Hoạt động",
      inactive: "Tạm nghỉ",
      terminated: "Đã nghỉ việc",
    }[newStatus];
    modal.confirm({
      title: `Chuyển sang “${label}”?`,
      content:
        newStatus === "active"
          ? "Nhân viên sẽ được phép sử dụng các chức năng theo vai trò hiện có."
          : newStatus === "terminated"
            ? "Nhân viên sẽ bị ngăn truy cập/chấm công. Random Check đang chờ hoặc đã gửi chưa phản hồi sẽ tự động bị hủy; các phân công hiện có không tự kết thúc, HR cần rà soát để kết thúc hoặc chuyển giao. Dữ liệu lịch sử vẫn được giữ."
            : "Nhân viên sẽ bị ngăn truy cập/chấm công trong tenant này. Dữ liệu lịch sử vẫn được giữ.",
      okText: "Xác nhận",
      cancelText: "Hủy",
      okButtonProps: { danger: newStatus !== "active" },
      onOk: () =>
        new Promise<void>((resolve, reject) => {
          changeStatus(
            { id: record.id, payload: { status: newStatus } },
            {
              onSuccess: () => {
                message.success("Cập nhật trạng thái thành công");
                resolve();
              },
              onError: () => {
                message.error("Lỗi khi cập nhật trạng thái");
                reject();
              },
            },
          );
        }),
    });
  };

  const handleExport = async () => {
    try {
      const blob = await exportEmployees({
        search: state.search,
        status: state.status,
        department: state.department,
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `employees_${format(new Date(), "yyyyMMdd_HHmmss")}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      message.success("Xuất dữ liệu thành công!");
    } catch {
      message.error("Lỗi khi xuất dữ liệu, vui lòng thử lại.");
    }
  };

  const getStatusActionMenu = (record: Employee): MenuProps["items"] => {
    if (!hasPermission("employees:update")) return [];
    const items: MenuProps["items"] = [];
    if (record.status !== "active") {
      items.push({ key: "active", label: "Đánh dấu Hoạt động", onClick: () => handleStatusChange(record, "active") });
    }
    if (record.status !== "inactive") {
      items.push({ key: "inactive", label: "Đánh dấu Tạm nghỉ", onClick: () => handleStatusChange(record, "inactive") });
    }
    if (record.status !== "terminated") {
      items.push({ key: "terminated", label: "Đánh dấu Đã nghỉ việc", danger: true, onClick: () => handleStatusChange(record, "terminated") });
    }
    return items;
  };

  const tenantMemberships =
    user?.memberships?.filter((membership) => membership.tenantId === user.tenantId) ?? [];
  const isSiteScoped =
    tenantMemberships.length > 0 &&
    tenantMemberships.every((membership) => (membership.siteIds?.length ?? 0) > 0);

  const columns: ColumnsType<Employee> = [
    {
      title: "Nhân viên",
      key: "firstName",
      sorter: true,
      render: (_, record) => (
        <div className="flex items-center gap-3 py-1">
          {record.avatarUrl ? (
            <Image
              src={record.avatarUrl}
              alt={record.firstName}
              width={36}
              height={36}
              unoptimized
              className="h-9 w-9 rounded-lg ring-1 ring-slate-200 object-cover bg-white shadow-sm"
            />
          ) : (
            <div className="h-9 w-9 bg-brand-100 text-brand-700 rounded-lg flex items-center justify-center font-bold text-base shrink-0 shadow-inner uppercase">
              {(record.lastName || record.firstName || "?")[0]}
            </div>
          )}
          <div className="flex flex-col">
            <span className="font-bold text-slate-900 text-sm">{formatVietnameseName(record.firstName, record.lastName)}</span>
            <span className="text-xs font-medium"><MaskedValue value={record.email} masked={record.piiMasked} fallback="Chưa có email" /></span>
          </div>
        </div>
      ),
    },
    {
      title: "Mã NV",
      dataIndex: "employeeCode",
      key: "employeeCode",
      render: (text: string) => <span className="font-mono font-medium text-slate-600 text-sm">{text || "---"}</span>,
    },
    {
      title: "Phòng ban",
      dataIndex: "department",
      key: "department",
      render: (text: string) => <span className="font-medium text-slate-600 text-sm">{text || "---"}</span>,
    },
    {
      title: "Chức vụ",
      dataIndex: "position",
      key: "position",
      render: (text: string) => <span className="font-medium text-slate-600 text-sm">{text || "---"}</span>,
    },
    {
      title: "Vai trò",
      dataIndex: "roleNames",
      key: "roleNames",
      render: (roleNames: string[] | undefined) =>
        !roleNames || roleNames.length === 0 ? (
          <span className="text-xs text-slate-400 italic">Chưa có role</span>
        ) : (
          <div className="flex flex-wrap gap-1">
            {roleNames.map((name) => (
              <Tag key={name} color="blue">{name}</Tag>
            ))}
          </div>
        ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: string, record: Employee) => {
        return (
          <Dropdown menu={{ items: getStatusActionMenu(record) }} trigger={["click"]} disabled={!hasPermission("employees:update")}>
            <div
              onClick={(event) => event.stopPropagation()}
              className={`${hasPermission("employees:update") ? "cursor-pointer hover:opacity-70" : ""} transition-opacity`}
            >
              <StatusBadge status={status} variant="dot" configMap={EMPLOYEE_STATUS} />
            </div>
          </Dropdown>
        );
      },
    },
    {
      title: "Face ID",
      key: "faceId",
      render: (_, record) => {
        const status = record.faceId?.status;
        if (status === "enrolled") {
          return <Tag color="success" className="font-medium m-0">Đã đăng ký</Tag>;
        }
        if (status === "revoked") {
          return <Tag color="error" className="font-medium m-0">Đã thu hồi</Tag>;
        }
        return <Tag color="default" className="font-medium m-0 text-slate-500">Chưa đăng ký</Tag>;
      },
    },
    {
      title: "Ngày tham gia",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 120,
      sorter: true,
      render: (dateStr: string) => (
        <span className="font-medium text-slate-600 text-sm">
          {format(new Date(dateStr), "dd/MM/yyyy")}
        </span>
      ),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 120,
      render: (_, record) => (
        <BaseButton
          type="default"
          icon={<ChevronRight className="h-4 w-4" />}
          className="!text-blue-600 !border-blue-200 hover:!bg-blue-50 hover:!border-blue-300 shadow-[0_2px_10px_rgb(0,0,0,0.04)] h-8 px-3 rounded-lg text-xs font-bold flex flex-row-reverse hover:-translate-y-0.5 transition-all duration-200"
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/customer/employees/${record.id}`);
          }}
        >
          Chi tiết
        </BaseButton>
      ),
    },
  ];

  return (
    <div className="space-y-6 px-2 sm:px-4 pb-4">
      {isSiteScoped && (
        <Alert
          type="info"
          showIcon
          title="Bạn đang xem dữ liệu theo phạm vi công trường"
          description="Danh sách, chi tiết và file xuất chỉ gồm nhân viên thuộc các site bạn được phân công."
        />
      )}
      {!canViewSensitiveData && (
        <Alert
          type="info"
          showIcon
          title="Thông tin liên hệ được bảo vệ theo quyền"
          description="Email và số điện thoại có thể được che một phần. File Excel xuất ra áp dụng cùng quy tắc; Web không có chức năng giải che dữ liệu."
        />
      )}
      <SavedFilterToolbar
        tenantId={user?.tenantId || ""}
        resourceType="employees"
        currentParams={savedParams}
        onApply={applySavedFilter}
      />
      <ListHeader
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        searchPlaceholder="Tìm kiếm theo tên, mã NV, email..."
        searchAriaLabel="Tìm nhân viên theo tên, mã hoặc email"
        filters={
          <Space wrap>
            <BaseSelect
              aria-label="Lọc nhân viên theo trạng thái"
              placeholder="Tất cả trạng thái"
              className="w-full sm:w-44"
              allowClear
              value={state.status}
              onChange={(val) => setPagination({ status: val, page: 0 })}
              options={[
                { label: "Hoạt động", value: "active" },
                { label: "Tạm nghỉ", value: "inactive" },
                { label: "Đã nghỉ việc", value: "terminated" },
              ]}
            />
            <Input
              aria-label="Lọc nhân viên theo phòng ban"
              allowClear
              className="w-full sm:w-48"
              placeholder="Phòng ban"
              value={state.department}
              onChange={(event) =>
                setPagination({ department: event.target.value || undefined, page: 0 })
              }
            />
            <BaseSelect
              aria-label="Lọc nhân viên theo workspace"
              placeholder="Tất cả workspace"
              className="w-full sm:w-48"
              allowClear
              value={state.workspaceId}
              onChange={(val) => setPagination({ workspaceId: val, page: 0 })}
              options={workspaceFilterOptions}
            />
            <BaseSelect
              aria-label="Lọc trạng thái đăng ký Face ID"
              placeholder="Tất cả Face ID"
              className="w-full sm:w-44"
              allowClear
              value={
                state.faceRegistered === undefined
                  ? undefined
                  : state.faceRegistered
                    ? "registered"
                    : "not_registered"
              }
              onChange={(val) =>
                setPagination({
                  faceRegistered: val === undefined ? undefined : val === "registered",
                  page: 0,
                })
              }
              options={[
                { label: "Đã đăng ký", value: "registered" },
                { label: "Chưa đăng ký", value: "not_registered" },
              ]}
            />
          </Space>
        }
        actions={
          <>
            {hasPermission("employees:create") && (
              <BaseButton
                icon={<FileUp className="h-4.5 w-4.5" />}
                onClick={() => setIsImportOpen(true)}
                className="font-semibold shadow-sm text-slate-700 hover:text-brand-600 hover:border-brand-300 transition-all"
              >
                Nhập Excel
              </BaseButton>
            )}
            {hasPermission("employees:list") && (
              <BaseButton
                icon={<FileDown className="h-4.5 w-4.5" />}
                onClick={handleExport}
                loading={isExporting}
                className="font-semibold shadow-sm text-slate-700 hover:text-brand-600 hover:border-brand-300 transition-all"
              >
                Xuất Excel
              </BaseButton>
            )}
            {hasPermission("employees:create") && (
              <BaseButton
                icon={<Mail className="h-4.5 w-4.5" />}
                onClick={() => setIsInviteOpen(true)}
                className="!bg-emerald-600 !text-white hover:!bg-emerald-700 !border-0 shadow-lg shadow-emerald-500/25 font-bold hover:-translate-y-0.5 transition-all gap-2"
              >
                Mời tham gia (gửi email)
              </BaseButton>
            )}
            {hasPermission("employees:create") && (
              <BaseButton
                type="primary"
                icon={<Plus className="h-4.5 w-4.5" />}
                onClick={() => {
                  setEditingEmployee(null);
                  setIsEmployeeFormOpen(true);
                }}
                className="!bg-blue-600 !text-white hover:!bg-blue-700 !border-0 shadow-lg shadow-blue-500/25 font-bold hover:-translate-y-0.5 transition-all gap-2"
              >
                Thêm hồ sơ (chưa cần đăng nhập)
              </BaseButton>
            )}
          </>
        }
      />

      {/* Data Table Wrapper */}
      <DataTable
        ariaLabel="Danh sách nhân viên"
        emptyTitle="Không tìm thấy nhân viên"
        emptyDescription="Thử thay đổi từ khóa hoặc bộ lọc trạng thái."
        columns={columns}
        data={pageData?.content || []}
        loading={isLoading}
        totalElements={pageData?.totalElements || 0}
        currentPage={state.page}
        pageSize={state.size}
        onPageChange={(page, size) => setPagination({ page, size })}
        onChange={(_, __, sorter, extra) => {
          if (extra.action !== "sort") return;
          if (!Array.isArray(sorter) && (sorter.columnKey || sorter.field)) {
            setPagination({
              sortBy: (sorter.columnKey || sorter.field) as string,
              sortDir: sorter.order === "ascend" ? "asc" : sorter.order === "descend" ? "desc" : undefined,
            });
          } else {
            setPagination({ sortBy: undefined, sortDir: undefined });
          }
        }}
        onRow={(record) => ({
          className: "hover:bg-brand-50/50 transition-colors duration-200 group cursor-pointer",
          onClick: () => router.push(`/customer/employees/${record.id}`),
        })}
      />


      {/* Modal Mời Nhân Viên */}
      <InviteEmployeeModal open={isInviteOpen} onClose={() => setIsInviteOpen(false)} />

      {/* Modal Import Nhân Viên */}
      <ImportEmployeeModal open={isImportOpen} onClose={() => setIsImportOpen(false)} />

      {/* Modal Thêm/Sửa Nhân Viên */}
      <EmployeeFormModal
        open={isEmployeeFormOpen}
        onClose={() => setIsEmployeeFormOpen(false)}
        initialData={editingEmployee}
      />
    </div>
  );
}
