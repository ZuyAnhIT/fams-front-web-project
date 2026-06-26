"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Mail, Search, FileDown, ChevronRight } from "lucide-react";
import { Input, Tag, Dropdown, MenuProps, message } from "antd";
import DataTable from "@/components/tables/DataTable";
import BaseButton from "@/components/ui/BaseButton";
import { usePagination } from "@/hooks/usePagination";
import { useDebounce } from "@/hooks/useDebounce";
import { useEmployees, useChangeEmployeeStatus, useExportEmployees } from "../hooks/use-employee";
import InviteEmployeeModal from "./InviteEmployeeModal";
import EmployeeFormModal from "./EmployeeFormModal";
import type { Employee, EmployeeDetailResponse } from "../types/employee.type";
import { format } from "date-fns";
import ListHeader from "@/components/shared/layout/ListHeader";
import ContentCard from "@/components/shared/layout/ContentCard";

export default function EmployeeListPage() {
  const router = useRouter();
  const { state, setPagination } = usePagination(20);
  const [searchInput, setSearchInput] = useState(state.search || "");
  const debouncedSearch = useDebounce(searchInput, 600);

  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isEmployeeFormOpen, setIsEmployeeFormOpen] = useState(false);
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
        const statusConfig: Record<string, { bg: string, text: string, label: string }> = {
          active: { bg: "bg-emerald-100", text: "text-emerald-700", label: "Hoạt động" },
          inactive: { bg: "bg-amber-100", text: "text-amber-700", label: "Tạm nghỉ" },
          terminated: { bg: "bg-rose-100", text: "text-rose-700", label: "Đã nghỉ" },
        };
        const config = statusConfig[status] || { bg: "bg-slate-100", text: "text-slate-700", label: status };
        
        return (
          <Dropdown menu={{ items: getStatusActionMenu(record) }} trigger={["click"]}>
            <span className={`px-2 py-1 cursor-pointer rounded-md text-[11px] font-bold uppercase tracking-wider hover:opacity-80 transition-opacity ${config.bg} ${config.text}`}>
              {config.label}
            </span>
          </Dropdown>
        );
      },
    },
    {
      title: "Ngày tham gia",
      dataIndex: "createdAt",
      key: "createdAt",
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
          className="!text-brand-600 !border-brand-200 hover:!bg-brand-50 hover:!border-brand-300 shadow-sm h-8 px-3 rounded-lg text-xs font-semibold flex flex-row-reverse"
          onClick={(e) => {
            e.stopPropagation();
            // Since we don't have full details in the list, we pass partial data 
            // and the form will be updated or we can just pass the whole record as any
            setEditingEmployee(record as any);
            setIsEmployeeFormOpen(true);
          }}
        >
          Chi tiết
        </BaseButton>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <ListHeader
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        searchPlaceholder="Tìm kiếm theo tên, mã NV, email..."
        actions={
          <>
            <BaseButton 
              icon={<FileDown className="h-4.5 w-4.5" />} 
              onClick={handleExport}
              loading={isExporting}
              className="h-11 px-4 rounded-xl font-semibold shadow-sm text-slate-700 hover:text-brand-600 hover:border-brand-300 transition-all"
            >
              Xuất Excel
            </BaseButton>
            <BaseButton 
              icon={<Mail className="h-4.5 w-4.5" />} 
              onClick={() => setIsInviteOpen(true)}
              className="!bg-emerald-600 !text-white hover:!bg-emerald-700 !border-0 shadow-lg shadow-emerald-500/25 h-11 px-5 rounded-xl font-bold hover:-translate-y-0.5 transition-all flex items-center gap-2"
            >
              Mời nhân viên
            </BaseButton>
            <BaseButton 
              type="primary" 
              icon={<Plus className="h-4.5 w-4.5" />}
              onClick={() => {
                setEditingEmployee(null);
                setIsEmployeeFormOpen(true);
              }}
              className="!bg-brand-600 !text-white hover:!bg-brand-700 !border-0 shadow-lg shadow-brand-500/25 h-11 px-5 rounded-xl font-bold hover:-translate-y-0.5 transition-all flex items-center gap-2"
            >
              Thêm mới
            </BaseButton>
          </>
        }
      />

      {/* Data Table Wrapper */}
      <ContentCard noPadding>
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
              setEditingEmployee(record as any);
              setIsEmployeeFormOpen(true);
            },
            className: "cursor-pointer hover:bg-brand-50/50 transition-colors duration-200 group",
          })}
        />
      </ContentCard>

      {/* Modal Mời Nhân Viên */}
      <InviteEmployeeModal open={isInviteOpen} onClose={() => setIsInviteOpen(false)} />

      {/* Modal Thêm/Sửa Nhân Viên */}
      <EmployeeFormModal 
        open={isEmployeeFormOpen} 
        onClose={() => setIsEmployeeFormOpen(false)} 
        initialData={editingEmployee}
      />
    </div>
  );
}
