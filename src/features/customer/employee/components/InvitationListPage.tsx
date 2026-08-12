"use client";

import { useState, useEffect } from "react";
import BaseSelect from "@/components/ui/BaseSelect";
import DataTable from "@/components/tables/DataTable";
import BaseButton from "@/components/ui/BaseButton";
import { usePagination } from "@/hooks/usePagination";
import { useDebounce } from "@/hooks/useDebounce";
import { useInvitations } from "../hooks/use-employee";
import CancelInvitationModal from "./CancelInvitationModal";
import type { InvitationResponse } from "../types/employee.type";
import { format } from "date-fns";
import ListHeader from "@/components/shared/layout/ListHeader";
import { useAuthStore } from "@/stores/auth.store";
import StatusBadge from "@/components/ui/StatusBadge";
import { INVITATION_STATUS } from "@/constants/status";
import { formatVietnameseName } from "@/utils/name.util";
import type { ColumnsType } from "antd/es/table";

export default function InvitationListPage() {
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const { state, setPagination } = usePagination(20);
  const [searchInput, setSearchInput] = useState(state.email || "");
  const debouncedSearch = useDebounce(searchInput, 600);

  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [selectedInvitation, setSelectedInvitation] = useState<InvitationResponse | null>(null);

  // Sync debounce search to URL
  useEffect(() => {
    const currentSearch = state.email || "";
    if (debouncedSearch !== currentSearch) {
      setPagination({ email: debouncedSearch, page: 0 });
    }
  }, [debouncedSearch, state.email, setPagination]);

  const { data: pageData, isLoading } = useInvitations(state);

  const handleCancelClick = (invitation: InvitationResponse) => {
    setSelectedInvitation(invitation);
    setIsCancelModalOpen(true);
  };

  const columns: ColumnsType<InvitationResponse> = [
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      sorter: true,
      render: (text: string) => <span className="font-medium text-slate-700">{text}</span>,
    },
    {
      title: "Họ tên",
      key: "name",
      render: (_, record) => (
        <span className="text-slate-600 text-sm">
          {record.firstName || record.lastName ? formatVietnameseName(record.firstName, record.lastName) : "---"}
        </span>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: string) => <StatusBadge status={status} variant="tag" configMap={INVITATION_STATUS} />,
    },
    {
      title: "Ngày gửi",
      dataIndex: "createdAt",
      key: "createdAt",
      sorter: true,
      render: (dateStr: string) => (
        <span className="text-slate-600 text-sm">
          {dateStr ? format(new Date(dateStr), "dd/MM/yyyy HH:mm") : "---"}
        </span>
      ),
    },
    {
      title: "Hết hạn",
      dataIndex: "expiresAt",
      key: "expiresAt",
      render: (dateStr: string) => (
        <span className="text-slate-600 text-sm">
          {dateStr ? format(new Date(dateStr), "dd/MM/yyyy HH:mm") : "---"}
        </span>
      ),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 120,
      render: (_, record) => (
        <div className="flex items-center gap-2">
          {record.status === "pending" && hasPermission("employees:create") && (
            <BaseButton
              type="text"
              danger
              className="text-xs font-semibold"
              onClick={() => handleCancelClick(record)}
            >
              Hủy
            </BaseButton>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 px-2 sm:px-4 pb-4">
      <ListHeader
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        searchPlaceholder="Tìm kiếm theo email..."
        searchAriaLabel="Tìm lời mời theo email"
        filters={
          <BaseSelect
            aria-label="Lọc lời mời theo trạng thái"
            placeholder="Tất cả trạng thái"
            className="w-full sm:w-44"
            allowClear
            value={state.status}
            onChange={(val) => setPagination({ status: val, page: 0 })}
            options={[
              { label: "Chờ xác nhận", value: "pending" },
              { label: "Đã chấp nhận", value: "accepted" },
              { label: "Đã hủy", value: "cancelled" },
              { label: "Hết hạn", value: "expired" },
            ]}
          />
        }
      />


        <DataTable
          ariaLabel="Danh sách lời mời nhân viên"
          emptyTitle="Không tìm thấy lời mời"
          emptyDescription="Lời mời nhân viên đã gửi sẽ xuất hiện tại đây."
          columns={columns}
          data={pageData?.content || []}
          loading={isLoading}
          totalElements={pageData?.totalElements || 0}
          currentPage={state.page}
          pageSize={state.size}
          onPageChange={(page, size) => setPagination({ page, size })}
          onChange={(_, __, sorter) => {
            if (!Array.isArray(sorter) && (sorter.columnKey || sorter.field)) {
              setPagination({
                sortBy: (sorter.columnKey || sorter.field) as string,
                sortDir: sorter.order === "ascend" ? "asc" : sorter.order === "descend" ? "desc" : undefined,
              });
            } else {
              setPagination({ sortBy: undefined, sortDir: undefined });
            }
          }}
        />


      <CancelInvitationModal
        open={isCancelModalOpen}
        onClose={() => {
          setIsCancelModalOpen(false);
          setSelectedInvitation(null);
        }}
        invitation={selectedInvitation}
      />
    </div>
  );
}
