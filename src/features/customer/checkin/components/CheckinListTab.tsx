"use client";

import React, { useEffect, useState } from "react";
import { Tag, Space, DatePicker } from "antd";
import type { ColumnsType } from "antd/es/table";
import { checkinService } from "../services/checkin.service";
import { CheckinResponse, CheckinListParams } from "../types/checkin.type";
import dayjs from "dayjs";
import { EyeOutlined } from "@ant-design/icons";
import { useAuthStore } from "@/stores/auth.store";
import BaseSelect from "@/components/ui/BaseSelect";
import BaseButton from "@/components/ui/BaseButton";
import DataTable from "@/components/tables/DataTable";
import CheckinDetailModal from "./CheckinDetailModal";

const { RangePicker } = DatePicker;

export default function CheckinListTab() {
  const user = useAuthStore(state => state.user);
  const currentTenantId = user?.tenantId;
  
  const [data, setData] = useState<CheckinResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  
  const [params, setParams] = useState<CheckinListParams>({
    page: 0,
    size: 20,
    sortBy: "checkInAt",
    sortDir: "desc",
  });

  const [selectedCheckinId, setSelectedCheckinId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (currentTenantId) {
      fetchData();
    }
  }, [params, currentTenantId]);

  const fetchData = async () => {
    if (!currentTenantId) return;
    try {
      setLoading(true);
      const res = await checkinService.listCheckins(currentTenantId, params);
      setData(res.content);
      setTotal(res.totalElements);
    } catch (error) {
      console.error("Failed to fetch checkins", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTableChange = (pagination: any, filters: any, sorter: any) => {
    setParams((prev) => ({
      ...prev,
      page: pagination.current ? pagination.current - 1 : 0,
      size: pagination.pageSize || 20,
      sortBy: sorter.field || "checkInAt",
      sortDir: sorter.order === "ascend" ? "asc" : "desc",
    }));
  };

  const openDetail = (id: string) => {
    setSelectedCheckinId(id);
    setIsModalOpen(true);
  };

  const columns: ColumnsType<CheckinResponse> = [
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        let color = "default";
        let text = status;
        if (status === "valid") { color = "success"; text = "Hợp lệ"; }
        else if (status === "pending_review") { color = "warning"; text = "Cần xem xét"; }
        else if (status === "rejected") { color = "error"; text = "Bị từ chối"; }
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: "Nhân viên",
      key: "employee",
      render: (_, record) => (
        <div>
          <div className="font-medium">{record.employeeName || record.employeeId}</div>
          {record.employeeCode && <div className="text-xs text-slate-500">{record.employeeCode}</div>}
        </div>
      ),
    },
    {
      title: "Site (Nơi làm việc)",
      key: "site",
      render: (_, record) => record.siteName || record.siteId,
    },
    {
      title: "Giờ vào (Check-in)",
      dataIndex: "checkInAt",
      key: "checkInAt",
      sorter: true,
      render: (val) => val ? dayjs(val).format("DD/MM/YYYY HH:mm:ss") : "-",
    },
    {
      title: "Giờ ra (Check-out)",
      dataIndex: "checkOutAt",
      key: "checkOutAt",
      render: (val) => val ? dayjs(val).format("DD/MM/YYYY HH:mm:ss") : "-",
    },
    {
      title: "Trong vùng",
      key: "geofence",
      render: (_, record) => {
        if (record.checkInInsideGeofence === null) return "-";
        return record.checkInInsideGeofence ? (
          <Tag color="success">Có</Tag>
        ) : (
          <Tag color="error">Không</Tag>
        );
      }
    },
    {
      title: "Thao tác",
      key: "action",
      render: (_, record) => (
        <BaseButton 
          type="link" 
          icon={<EyeOutlined />} 
          onClick={() => openDetail(record.id)}
        >
          Chi tiết
        </BaseButton>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex gap-4 flex-wrap bg-slate-50 p-4 rounded-lg border border-slate-200">
        <BaseSelect
          allowClear
          placeholder="Trạng thái"
          style={{ width: 150 }}
          onChange={(val) => setParams(p => ({ ...p, status: val, page: 0 }))}
          options={[
            { label: "Hợp lệ", value: "valid" },
            { label: "Cần xem xét", value: "pending_review" },
            { label: "Bị từ chối", value: "rejected" },
          ]}
        />
        <RangePicker 
          showTime
          onChange={(dates, dateStrings) => {
            setParams(p => ({
              ...p,
              from: dates ? dates[0]?.toISOString() : undefined,
              to: dates ? dates[1]?.toISOString() : undefined,
              page: 0
            }));
          }}
        />
        {/* We can add Employee/Site filters here if we have APIs to fetch their lists */}
      </div>

      <DataTable
        columns={columns}
        data={data}
        rowKey="id"
        loading={loading}
        currentPage={params.page || 0}
        pageSize={params.size || 20}
        totalElements={total}
        onChange={handleTableChange}
        scroll={{ x: 800 }}
      />

      <CheckinDetailModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        checkinId={selectedCheckinId}
      />
    </div>
  );
}
