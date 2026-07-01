"use client";

import React, { useState, useEffect } from "react";
import { Input, Button, Table, Tag, Select, Tooltip } from "antd";
import { Search, Plus, MapPin, Edit3 } from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";
import { useSitesQuery } from "../hooks/use-site";
import CreateSiteModal from "./CreateSiteModal";
import UpdateSiteModal from "./UpdateSiteModal";
import { SiteResponse } from "../types/site.type";

export default function SitePage() {
  const user = useAuthStore((state) => state.user);
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const tenantId = user?.tenantId;

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);

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
    sortBy: "name",
    sortDir: "asc"
  });

  const sites = pageResponse?.data?.content || [];
  const totalElements = pageResponse?.data?.totalElements || 0;

  const columns = [
    {
      title: "Mã công trình",
      dataIndex: "code",
      key: "code",
      render: (text: string) => text || <span className="text-slate-400">---</span>,
    },
    {
      title: "Tên công trình",
      dataIndex: "name",
      key: "name",
      render: (text: string, record: SiteResponse) => (
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            <MapPin size={16} />
          </div>
          <div className="font-medium text-slate-700">{text}</div>
        </div>
      ),
    },
    {
      title: "Địa chỉ",
      dataIndex: "address",
      key: "address",
      render: (text: string) => text || <span className="text-slate-400">---</span>,
    },
    {
      title: "Mô tả",
      dataIndex: "description",
      key: "description",
      render: (text: string) => {
        if (!text) return <span className="text-slate-400">---</span>;
        return (
          <Tooltip title={text} placement="topLeft">
            <div className="max-w-[200px] truncate text-slate-600">
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
      render: (date: string) => new Date(date).toLocaleDateString("vi-VN"),
    },
  ];

  if (hasPermission("sites:update")) {
    columns.push({
      title: "Thao tác",
      dataIndex: "actions" as any,
      key: "actions",
      /* align: "right" as any */
      render: (_, record: SiteResponse) => (
        <Button
          type="text"
          icon={<Edit3 className="h-4 w-4 text-slate-500" />}
          onClick={() => setEditingSite(record)}
          className="hover:bg-slate-100 rounded-lg"
        >
          Sửa
        </Button>
      ),
    });
  }

  return (
    <div className="flex h-full flex-col p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Quản lý Công trình</h1>
          <p className="text-sm text-slate-500">
            Danh sách tất cả các địa điểm chấm công của công ty
          </p>
        </div>

        {hasPermission("sites:create") && (
          <Button
            type="primary"
            icon={<Plus className="h-5 w-5" />}
            className="flex items-center bg-brand-600 hover:bg-brand-700 h-10 px-4 font-semibold rounded-lg shadow-sm"
            onClick={() => setIsCreateModalOpen(true)}
          >
            Thêm công trình
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <Input
          placeholder="Tìm kiếm theo tên, mã, địa chỉ..."
          prefix={<Search className="h-4 w-4 text-slate-400" />}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md h-10"
        />
        <Select
          placeholder="Tất cả trạng thái"
          allowClear
          value={statusFilter}
          onChange={(val) => {
            setStatusFilter(val);
            setPage(0);
          }}
          className="w-48 h-10"
          options={[
            { value: "active", label: "Hoạt động" },
            { value: "inactive", label: "Ngưng hoạt động" },
          ]}
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <Table
          bordered
          columns={columns}
          dataSource={sites}
          rowKey="id"
          loading={isLoading}
          pagination={{
            current: page + 1,
            pageSize: size,
            total: totalElements,
            showSizeChanger: true,
            onChange: (p, s) => {
              setPage(p - 1);
              setSize(s);
            },
            showTotal: (total, range) => `${range[0]}-${range[1]} trên tổng số ${total} bản ghi`,
            position: ["bottomCenter"],
          }}
        />
      </div>

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
