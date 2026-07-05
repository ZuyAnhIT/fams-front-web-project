"use client";

import { useState, useEffect } from "react";
import { Search, RotateCcw } from "lucide-react";
import { Input, Select, Tag } from "antd";
import DataTable from "@/components/tables/DataTable";
import BaseButton from "@/components/ui/BaseButton";
import { usePagination } from "@/hooks/usePagination";
import { useDebounce } from "@/hooks/useDebounce";
import { useInvitations } from "../hooks/use-employee";
import CancelInvitationModal from "./CancelInvitationModal";
import type { InvitationResponse } from "../types/employee.type";
import { format } from "date-fns";
import ListHeader from "@/components/shared/layout/ListHeader";
import ContentCard from "@/components/shared/layout/ContentCard";
import { useAuthStore } from "@/stores/auth.store";

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

  const columns = [
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      render: (text: string) => <span className="font-medium text-slate-700">{text}</span>,
    },
    {
      title: "Họ tên",
      key: "name",
      render: (_: any, record: InvitationResponse) => (
        <span className="text-slate-600 text-sm">
          {record.firstName || record.lastName ? `${record.firstName || ""} ${record.lastName || ""}`.trim() : "---"}
        </span>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        const statusConfig: Record<string, { color: string; text: string }> = {
          pending: { color: "blue", text: "Chờ xác nhận" },
          accepted: { color: "green", text: "Đã chấp nhận" },
          cancelled: { color: "red", text: "Đã hủy" },
          expired: { color: "default", text: "Hết hạn" },
        };
        const config = statusConfig[status] || { color: "default", text: status };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: "Ngày gửi",
      dataIndex: "createdAt",
      key: "createdAt",
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
      render: (_: any, record: InvitationResponse) => (
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
    <div className="space-y-6">
      <ListHeader
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        searchPlaceholder="Tìm kiếm theo email..."
        filters={
          <Select
            placeholder="Tất cả trạng thái"
            className="w-40 h-11"
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

      <ContentCard noPadding>
        <DataTable
          columns={columns}
          data={pageData?.content || []}
          loading={isLoading}
          totalElements={pageData?.totalElements || 0}
          currentPage={state.page}
          pageSize={state.size}
          onPageChange={(page, size) => setPagination({ page, size })}
        />
      </ContentCard>

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
