"use client";

import React, { useState } from "react";
import { Tag, DatePicker } from "antd";
import type { ColumnsType } from "antd/es/table";
import { AttendanceSummaryResponse, AttendanceListParams } from "../types/attendance.type";
import { useAttendanceSummaries } from "../hooks/use-attendance";
import dayjs from "dayjs";
import { useAuthStore } from "@/stores/auth.store";
import BaseSelect from "@/components/ui/BaseSelect";
import DataTable from "@/components/tables/DataTable";

const { RangePicker } = DatePicker;

export default function AttendanceSummaryTab() {
  const user = useAuthStore(state => state.user);
  const currentTenantId = user?.tenantId;
  
  const [params, setParams] = useState<AttendanceListParams>({
    page: 0,
    size: 20,
    from: dayjs().startOf('month').format('YYYY-MM-DD'),
    to: dayjs().endOf('month').format('YYYY-MM-DD'),
  });

  const { data: pageData, isLoading } = useAttendanceSummaries(currentTenantId || undefined, params);

  const columns: ColumnsType<AttendanceSummaryResponse> = [
    {
      title: "Ngày",
      dataIndex: "attendanceDate",
      key: "attendanceDate",
      render: (val) => dayjs(val).format("DD/MM/YYYY"),
    },
    {
      title: "Nhân viên",
      key: "employee",
      render: (_, record) => record.employeeName || record.employeeId,
    },
    {
      title: "Site",
      key: "site",
      render: (_, record) => record.siteName || record.siteId,
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
      <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 sm:flex-row sm:flex-wrap sm:p-4">
        <BaseSelect
          aria-label="Lọc bảng công theo trạng thái"
          allowClear
          placeholder="Trạng thái"
          className="w-full sm:w-44"
          onChange={(val) => setParams(p => ({ ...p, status: val, page: 0 }))}
          options={[
            { label: "Hoàn thành", value: "present" },
            { label: "Chưa hoàn thành", value: "incomplete" },
          ]}
        />
        <RangePicker 
          aria-label="Lọc bảng công theo khoảng ngày"
          className="w-full sm:w-auto"
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
        ariaLabel="Bảng công tổng hợp theo ngày"
        emptyTitle="Không có dữ liệu bảng công"
        emptyDescription="Thử chọn khoảng ngày hoặc trạng thái khác."
        columns={columns}
        data={pageData?.content || []}
        rowKey="id"
        loading={isLoading}
        currentPage={params.page || 0}
        pageSize={params.size || 20}
        totalElements={pageData?.totalElements || 0}
        onPageChange={(page, size) => setParams((current) => ({ ...current, page, size }))}
        scroll={{ x: 1000 }}
      />
    </div>
  );
}
