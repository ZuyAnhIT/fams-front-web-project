"use client";

import React, { useEffect, useState } from "react";
import { Tag, DatePicker } from "antd";
import type { ColumnsType } from "antd/es/table";
import { attendanceService } from "../services/attendance.service";
import { AttendanceSummaryResponse, AttendanceListParams } from "../types/attendance.type";
import dayjs from "dayjs";
import { useAuthStore } from "@/stores/auth.store";
import BaseSelect from "@/components/ui/BaseSelect";
import DataTable from "@/components/tables/DataTable";

const { RangePicker } = DatePicker;

export default function AttendanceSummaryTab() {
  const user = useAuthStore(state => state.user);
  const currentTenantId = user?.tenantId;
  
  const [data, setData] = useState<AttendanceSummaryResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  
  const [params, setParams] = useState<AttendanceListParams>({
    page: 0,
    size: 20,
    from: dayjs().startOf('month').format('YYYY-MM-DD'),
    to: dayjs().endOf('month').format('YYYY-MM-DD'),
  });

  useEffect(() => {
    if (currentTenantId) {
      fetchData();
    }
  }, [params, currentTenantId]);

  const fetchData = async () => {
    if (!currentTenantId) return;
    try {
      setLoading(true);
      const res = await attendanceService.listSummaries(currentTenantId, params);
      setData(res.content);
      setTotal(res.totalElements);
    } catch (error) {
      console.error("Failed to fetch attendance summaries", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTableChange = (pagination: any, filters: any, sorter: any) => {
    setParams((prev) => ({
      ...prev,
      page: pagination.current ? pagination.current - 1 : 0,
      size: pagination.pageSize || 20,
    }));
  };

  const columns: ColumnsType<AttendanceSummaryResponse> = [
    {
      title: "Ngày",
      dataIndex: "attendanceDate",
      key: "attendanceDate",
      render: (val) => dayjs(val).format("DD/MM/YYYY"),
    },
    {
      title: "Nhân viên (ID)",
      key: "employee",
      render: (_, record) => record.employeeId, // Should map to name if backend provides it or we join it
    },
    {
      title: "Site (ID)",
      key: "site",
      render: (_, record) => record.siteId, // Same here
    },
    {
      title: "Giờ vào - ra",
      key: "time",
      render: (_, record) => (
        <div className="whitespace-nowrap">
          Vào: {record.firstCheckinAt ? dayjs(record.firstCheckinAt).format("HH:mm") : "-"}<br/>
          Ra: {record.lastCheckoutAt ? dayjs(record.lastCheckoutAt).format("HH:mm") : "-"}
        </div>
      )
    },
    {
      title: "Số giờ làm",
      dataIndex: "totalWorkMinutes",
      key: "totalWorkMinutes",
      render: (val) => val ? `${(val / 60).toFixed(1)}h` : "-",
    },
    {
      title: "Đi muộn / Về sớm",
      key: "lateEarly",
      render: (_, record) => {
        const formatMin = (m?: number) => {
          if (!m) return "";
          const h = Math.floor(m / 60);
          const min = m % 60;
          if (h > 0) return min > 0 ? `${h}h ${min}p` : `${h}h`;
          return `${min}p`;
        };
        return (
          <div className="flex flex-col gap-1">
            {record.late && <Tag color="warning">Muộn {formatMin(record.lateMinutes)}</Tag>}
            {record.earlyLeave && <Tag color="warning">Sớm {formatMin(record.earlyLeaveMinutes)}</Tag>}
            {!record.late && !record.earlyLeave && "-"}
          </div>
        );
      },
    },
    {
      title: "Làm thêm (OT)",
      dataIndex: "otMinutes",
      key: "otMinutes",
      render: (val) => val > 0 ? <Tag color="blue">{val}p</Tag> : "-",
    },
    {
      title: "Trạng thái",
      key: "status",
      render: (_, record) => {
        if (record.missingCheckout) return <Tag color="error">Thiếu check-out</Tag>;
        if (record.status === "present") return <Tag color="success">Hoàn thành</Tag>;
        return <Tag color="default">{record.status}</Tag>;
      }
    }
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
            { label: "Hoàn thành", value: "present" },
            { label: "Chưa hoàn thành", value: "incomplete" },
          ]}
        />
        <RangePicker 
          value={[
            params.from ? dayjs(params.from) : null,
            params.to ? dayjs(params.to) : null,
          ]}
          onChange={(dates, dateStrings) => {
            setParams(p => ({
              ...p,
              from: dateStrings[0] || undefined,
              to: dateStrings[1] || undefined,
              page: 0
            }));
          }}
        />
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
        scroll={{ x: 1000 }}
      />
    </div>
  );
}
