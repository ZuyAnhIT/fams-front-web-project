"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Mail, Search, FileDown, FileUp, ChevronRight } from "lucide-react";
import { Input, Tag, Dropdown, MenuProps, App } from "antd";
import BaseSelect from "@/components/ui/BaseSelect";
import DataTable from "@/components/tables/DataTable";
import BaseButton from "@/components/ui/BaseButton";
import { usePagination } from "@/hooks/usePagination";
import { useDebounce } from "@/hooks/useDebounce";
import { useEmployees, useChangeEmployeeStatus, useExportEmployees } from "../hooks/use-employee";
import InviteEmployeeModal from "./InviteEmployeeModal";
import EmployeeFormModal from "./EmployeeFormModal";
import { useAuthStore } from "@/stores/auth.store";
import ImportEmployeeModal from "./ImportEmployeeModal";
import type { Employee, EmployeeDetailResponse } from "../types/employee.type";
import { format } from "date-fns";
import ListHeader from "@/components/shared/layout/ListHeader";
import ContentCard from "@/components/shared/layout/ContentCard";
import StatusBadge from "@/components/ui/StatusBadge";
import { EMPLOYEE_STATUS } from "@/constants/status";

export default function EmployeeListPage() {
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const currentUser = useAuthStore((state) => state.user);
  const { message } = App.useApp();
  const router = useRouter();
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

  const handleStatusChange = (id: string, newStatus: "active" | "inactive" | "terminated") => {
    changeStatus(
      { id, payload: { status: newStatus } },
      {
        onSuccess: () => message.success("Cập nhật trạng thái thành công"),
        onError: () => message.error("Lỗi khi cập nhật trạng thái"),
      }
    );
  };

  const handleExport = async () => {
    try {
      const blob = await exportEmployees({ search: state.search });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `employees_${format(new Date(), "yyyyMMdd_HHmmss")}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      message.success("Xuất dữ liệu thành công!");
    } catch (error) {
      message.error("Lỗi khi xuất dữ liệu, vui lòng thử lại.");
    }
  };

  const getStatusActionMenu = (record: Employee): MenuProps["items"] => {
    if (!hasPermission("employees:update")) return [];
    const items: MenuProps["items"] = [];
    if (record.status !== "active") {
      items.push({ key: "active", label: "Đánh dấu Hoạt động", onClick: () => handleStatusChange(record.id, "active") });
    }
    if (record.status !== "inactive") {
      items.push({ key: "inactive", label: "Đánh dấu Tạm nghỉ", onClick: () => handleStatusChange(record.id, "inactive") });
    }
    if (record.status !== "terminated") {
      items.push({ key: "terminated", label: "Đánh dấu Đã nghỉ việc", danger: true, onClick: () => handleStatusChange(record.id, "terminated") });
    }
    return items;
  };

  const columns = [
    {
      title: "Nhân viên",
      key: "name",
      sorter: true,
      render: (_: any, record: Employee) => (
        <div className="flex items-center gap-3 py-1">
          {record.avatarUrl ? (
            <img
              src={record.avatarUrl}
              alt={record.firstName}
              className="h-9 w-9 rounded-lg ring-1 ring-slate-200 object-cover bg-white shadow-sm"
            />
          ) : (
            <div className="h-9 w-9 bg-brand-100 text-brand-700 rounded-lg flex items-center justify-center font-bold text-base shrink-0 shadow-inner uppercase">
              {record.firstName.charAt(0)}
            </div>
          )}
          <div className="flex flex-col">
            <span className="font-bold text-slate-900 text-sm">{record.firstName} {record.lastName}</span>
            <span className="text-xs text-slate-500 font-medium">{record.email}</span>
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
      title: "Vị trí",
      dataIndex: "position",
      key: "position",
      render: (text: string) => <span className="font-medium text-slate-600 text-sm">{text || "---"}</span>,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: string, record: Employee) => {
        return (
          <Dropdown menu={{ items: getStatusActionMenu(record) }} trigger={["click"]} disabled={!hasPermission("employees:update")}>
            <div className={`${hasPermission("employees:update") ? "cursor-pointer hover:opacity-70" : ""} transition-opacity`}>
              <StatusBadge status={status} variant="dot" configMap={EMPLOYEE_STATUS} />
            </div>
          </Dropdown>
        );
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
      render: (_: any, record: Employee) => (
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
      <ListHeader
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        searchPlaceholder="Tìm kiếm theo tên, mã NV, email..."
        filters={
          <BaseSelect
            placeholder="Tất cả trạng thái"
            className="w-40"
            allowClear
            value={state.status}
            onChange={(val) => setPagination({ status: val, page: 0 })}
            options={[
              { label: "Hoạt động", value: "active" },
              { label: "Tạm nghỉ", value: "inactive" },
              { label: "Đã nghỉ việc", value: "terminated" },
            ]}
          />
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
                Mời nhân viên
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
                Thêm mới
              </BaseButton>
            )}
          </>
        }
      />

      {/* Data Table Wrapper */}
      <DataTable
        columns={columns}
        data={pageData?.content?.filter((emp) => emp.email !== currentUser?.email) || []}
        loading={isLoading}
        totalElements={pageData?.totalElements || 0}
        currentPage={state.page}
        pageSize={state.size}
        onPageChange={(page, size) => setPagination({ page, size })}
        onChange={(_, __, sorter: any) => {
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
