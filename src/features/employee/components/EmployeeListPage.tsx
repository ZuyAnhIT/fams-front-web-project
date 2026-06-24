"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, Mail, Search, FileDown } from "lucide-react";
import { Input, Tag, Dropdown, MenuProps, message } from "antd";
import DataTable from "@/components/tables/DataTable";
import BaseButton from "@/components/ui/BaseButton";
import { usePagination } from "@/hooks/usePagination";
import { useDebounce } from "@/hooks/useDebounce";
import { useEmployees, useChangeEmployeeStatus } from "../hooks/use-employee";
import InviteEmployeeModal from "./InviteEmployeeModal";
import type { Employee } from "../types/employee.type";
import { format } from "date-fns";

export default function EmployeeListPage() {
  const router = useRouter();
  const { state, setPagination } = usePagination(20);
  const [searchInput, setSearchInput] = useState(state.search || "");
  const debouncedSearch = useDebounce(searchInput, 600);

  const [isInviteOpen, setIsInviteOpen] = useState(false);

  // Sync debounce search to URL
  useMemo(() => {
    if (debouncedSearch !== state.search) {
      setPagination({ search: debouncedSearch });
    }
  }, [debouncedSearch, state.search, setPagination]);

  const { data: pageData, isLoading } = useEmployees(state);
  const { mutate: changeStatus } = useChangeEmployeeStatus();

  const handleStatusChange = (id: string, newStatus: "active" | "inactive" | "terminated") => {
    changeStatus(
      { id, payload: { status: newStatus } },
      {
        onSuccess: () => message.success("Cập nhật trạng thái thành công"),
        onError: () => message.error("Lỗi khi cập nhật trạng thái"),
      }
    );
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
      title: "Mã NV",
      dataIndex: "employeeCode",
      key: "employeeCode",
      render: (text: string) => <span className="font-mono text-brand-700">{text || "---"}</span>,
    },
    {
      title: "Họ và tên",
      key: "name",
      render: (_: any, record: Employee) => (
        <div className="flex flex-col">
          <span className="font-semibold text-brand-900">{record.firstName} {record.lastName}</span>
          <span className="text-xs text-brand-500">{record.email}</span>
        </div>
      ),
    },
    {
      title: "Phòng ban",
      dataIndex: "department",
      key: "department",
      render: (text: string) => text || "---",
    },
    {
      title: "Vị trí",
      dataIndex: "position",
      key: "position",
      render: (text: string) => text || "---",
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: string, record: Employee) => {
        let color = "default";
        let label = status;
        if (status === "active") { color = "success"; label = "Hoạt động"; }
        else if (status === "inactive") { color = "warning"; label = "Tạm nghỉ"; }
        else if (status === "terminated") { color = "error"; label = "Đã nghỉ"; }
        
        return (
          <Dropdown menu={{ items: getStatusActionMenu(record) }} trigger={["click"]}>
            <Tag color={color} className="cursor-pointer hover:opacity-80 transition-opacity">
              {label}
            </Tag>
          </Dropdown>
        );
      },
    },
    {
      title: "Ngày tham gia",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (dateStr: string) => format(new Date(dateStr), "dd/MM/yyyy"),
    },
    {
      title: "Thao tác",
      key: "actions",
      render: (_: any, record: Employee) => (
        <div className="flex gap-2">
          <BaseButton 
            size="small" 
            onClick={() => router.push(`/employees/${record.id}`)}
          >
            Chi tiết
          </BaseButton>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex-1 w-full max-w-md relative">
          <Input
            placeholder="Tìm kiếm theo tên, mã NV, email..."
            prefix={<Search className="h-4 w-4 text-brand-400" />}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="h-10 rounded-lg border-brand-300 focus:border-brand-500 focus:ring-brand-500/20"
            allowClear
          />
        </div>
        
        <div className="flex gap-3 w-full sm:w-auto">
          <BaseButton 
            icon={<FileDown className="h-4 w-4" />} 
            onClick={() => { /* TODO: Gọi Export API nếu cần */ message.info("Chức năng xuất Excel sẽ sớm ra mắt"); }}
          >
            Xuất Excel
          </BaseButton>
          <BaseButton 
            icon={<Mail className="h-4 w-4" />} 
            onClick={() => setIsInviteOpen(true)}
            className="bg-emerald-600 text-white hover:bg-emerald-700 border-transparent"
          >
            Mời nhân viên
          </BaseButton>
          <BaseButton 
            type="primary" 
            icon={<Plus className="h-4 w-4" />}
            onClick={() => router.push("/employees/create")}
            className="bg-brand-600 border-transparent"
          >
            Thêm thủ công
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
      />

      {/* Modal Mời Nhân Viên */}
      <InviteEmployeeModal open={isInviteOpen} onClose={() => setIsInviteOpen(false)} />
    </div>
  );
}
