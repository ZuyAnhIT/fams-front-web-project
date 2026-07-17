"use client";

import React, { useState, useEffect } from "react";
import { Tag, Tooltip, type TableProps } from "antd";
import { Search, Plus, MapPin, Edit3, Eye } from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/stores/auth.store";
import BaseButton from "@/components/ui/BaseButton";
import BaseSelect from "@/components/ui/BaseSelect";
import ContentCard from "@/components/shared/layout/ContentCard";
import ListHeader from "@/components/shared/layout/ListHeader";
import { useSitesQuery } from "../hooks/use-site";
import CreateSiteModal from "./CreateSiteModal";
import UpdateSiteModal from "./UpdateSiteModal";
import { SiteResponse } from "../types/site.type";
import DataTable from "@/components/tables/DataTable";

export default function SitePage() {
  const user = useAuthStore((state) => state.user);
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const tenantId = user?.tenantId;

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [sortBy, setSortBy] = useState<string | undefined>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc" | undefined>("asc");

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingSite, setEditingSite] = useState<SiteResponse | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setPage(0); // Reset page on new search
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data: pageResponse, isLoading } = useSitesQuery({
    tenantId: tenantId as any,
    search: debouncedSearchTerm || undefined,
    status: statusFilter,
    page,
    size,
    sortBy,
    sortDir,
  });

  const sites = pageResponse?.data?.content || [];
  const totalElements = pageResponse?.data?.totalElements || 0;

  const columns: TableProps<SiteResponse>['columns'] = [
    {
      title: "Mã CT",
      dataIndex: "code",
      key: "code",
      width: 140,
      render: (text: string) => text || <span className="text-slate-400">---</span>,
    },
    {
      title: "Tên CT",
      dataIndex: "name",
      key: "name",
      sorter: true,
      width: 180,
      render: (text: string, record: SiteResponse) => (
        <Link href={`/customer/sites/${record.id}`} className="font-medium text-brand-600 hover:text-brand-700 underline underline-offset-2 transition-colors">
          {text}
        </Link>
      ),
    },
    {
      title: "Địa chỉ",
      dataIndex: "address",
      key: "address",

      render: (text: string) => {
        if (!text) return <span className="text-slate-400">---</span>;
        return (
          <Tooltip title={text} placement="topLeft">
            <div className="max-w-[200px] truncate text-slate-700">
              {text}
            </div>
          </Tooltip>
        );
      },
    },
    {
      title: "Mô tả",
      dataIndex: "description",
      key: "description",

      render: (text: string) => {
        if (!text) return <span className="text-slate-400">---</span>;
        return (
          <Tooltip title={text} placement="topLeft">
            <div className="max-w-[170px] truncate text-slate-600">
              {text}
            </div>
          </Tooltip>
        );
      },
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 130,
      render: (status: string) => (
        <Tag color={status === "active" ? "green" : "red"}>
          {status === "active" ? "Hoạt động" : "Ngưng hoạt động"}
        </Tag>
      ),
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 120,
      sorter: true,
      render: (date: string) => new Date(date).toLocaleDateString("vi-VN"),
    },
  ];

  if (hasPermission("sites:update") || hasPermission("sites:read") || true) {
    columns!.push({
      title: "Thao tác",
      dataIndex: "actions",
      key: "actions",
      width: 100,
      /* align: "right" as any */
      render: (_, record: SiteResponse) => (
        <div className="flex items-center gap-2">
          <Link href={`/customer/sites/${record.id}`}>
            <Tooltip title="Chi tiết">
              <BaseButton
                type="text"
                icon={<Eye className="h-4 w-4 text-brand-600" />}
                className="hover:bg-brand-50 text-brand-600 rounded-lg flex items-center justify-center w-8 h-8 p-0"
              />
            </Tooltip>
          </Link>
          {hasPermission("sites:update") && (
            <Tooltip title="Sửa">
              <BaseButton
                type="text"
                icon={<Edit3 className="h-4 w-4 text-slate-500" />}
                onClick={() => setEditingSite(record)}
                className="hover:bg-slate-100 rounded-lg flex items-center justify-center w-8 h-8 p-0"
              />
            </Tooltip>
          )}
        </div>
      ),
    });
  }

  return (
    <div className="flex flex-col space-y-6 max-w-[1600px] mx-auto py-2 w-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="!text-[35px] !font-semibold text-slate-900 tracking-tight">Quản lý công trình</h1>
          <p className="text-sm text-slate-500 mt-1">
            Danh sách tất cả các địa điểm chấm công của công ty
          </p>
        </div>
        {hasPermission("sites:create") && (
          <BaseButton
            type="primary"
            icon={<Plus className="h-4.5 w-4.5" />}
            onClick={() => setIsCreateModalOpen(true)}
            className="!bg-blue-600 !text-white hover:!bg-blue-700 !border-0 shadow-lg shadow-blue-500/25 h-10 px-5 rounded-xl font-bold hover:-translate-y-0.5 transition-all flex items-center gap-2"
          >
            Thêm công trình
          </BaseButton>
        )}
      </div>

      <ContentCard noPadding>
        <ListHeader
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-5 border-b border-slate-100"
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Tìm kiếm theo tên, mã, địa chỉ..."
          filters={
            <BaseSelect
              placeholder="Tất cả trạng thái"
              allowClear
              value={statusFilter}
              onChange={(val) => {
                setStatusFilter(val);
                setPage(0);
              }}
              className="w-48 h-10 [&_.ant-select-selector]:rounded-xl [&_.ant-select-selector]:border-slate-200 hover:[&_.ant-select-selector]:border-blue-300 focus:[&_.ant-select-selector]:border-blue-500 bg-slate-50/50 hover:bg-white"
              options={[
                { value: "active", label: "Hoạt động" },
                { value: "inactive", label: "Ngưng hoạt động" },
              ]}
            />
          }
        />

        <div className="p-5">
          {/* Table */}
          <DataTable
            columns={columns as any}
            data={sites}
            loading={isLoading}
            totalElements={totalElements}
            currentPage={page}
            pageSize={size}
            onPageChange={(p, s) => {
              setPage(p);
              setSize(s);
            }}
            onChange={(_, __, sorter: any) => {
              if (!Array.isArray(sorter) && (sorter.columnKey || sorter.field)) {
                setSortBy((sorter.columnKey || sorter.field) as string);
                setSortDir(sorter.order === "ascend" ? "asc" : sorter.order === "descend" ? "desc" : undefined);
              } else {
                setSortBy(undefined);
                setSortDir(undefined);
              }
            }}
            onRow={(record) => ({
              className: "hover:bg-blue-50/50 transition-colors duration-200 group",
            })}
          />
        </div>
      </ContentCard>

      {/* Modals */}
      <CreateSiteModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      <UpdateSiteModal
        site={editingSite}
        isOpen={!!editingSite}
        onClose={() => setEditingSite(null)}
      />
    </div>
  );
}
