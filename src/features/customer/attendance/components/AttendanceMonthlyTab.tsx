"use client";

import React, { useState } from "react";
import { message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { DownloadOutlined } from "@ant-design/icons";
import { AttendanceHrMonthlyResponse } from "../types/attendance.type";
import { useExportMonthlyAttendance, useMonthlyAttendance } from "../hooks/use-attendance";
import dayjs, { Dayjs } from "dayjs";
import { useAuthStore } from "@/stores/auth.store";
import BaseDatePicker from "@/components/ui/BaseDatePicker";
import BaseButton from "@/components/ui/BaseButton";
import DataTable from "@/components/tables/DataTable";

export default function AttendanceMonthlyTab() {
  const user = useAuthStore((state) => state.user);
  const currentTenantId = user?.tenantId;

  const [selectedMonth, setSelectedMonth] = useState<Dayjs>(dayjs());
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);

  const monthlyParams = {
    year: selectedMonth.year(),
    month: selectedMonth.month() + 1,
    page,
    size,
  };
  const { data: pageData, isLoading } = useMonthlyAttendance(
    currentTenantId || undefined,
    monthlyParams
  );
  const exportAttendance = useExportMonthlyAttendance();

  const handleExport = async () => {
    if (!currentTenantId) return;
    try {
      const blob = await exportAttendance.mutateAsync({
        tenantId: currentTenantId,
        params: {
          year: selectedMonth.year(),
          month: selectedMonth.month() + 1,
        },
      });
      
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `BangCong_${selectedMonth.format("MM_YYYY")}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export", error);
      message.error("Lỗi khi xuất báo cáo");
    } finally {
      // Mutation state controls the button loading indicator.
    }
  };

  const columns: ColumnsType<AttendanceHrMonthlyResponse> = [
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
      title: "Tháng/Năm",
      key: "monthYear",
      render: (_, record) => `${String(record.month).padStart(2, '0')}/${record.year}`,
    },
    {
      title: "Ngày công",
      dataIndex: "presentDays",
      key: "presentDays",
      render: (val) => val || 0,
    },
    {
      title: "Tổng giờ làm",
      dataIndex: "totalWorkMinutes",
      key: "totalWorkMinutes",
      render: (val) => val ? `${(val / 60).toFixed(1)}h` : "0h",
    },
    {
      title: "Đi muộn",
      key: "late",
      render: (_, record) => {
        const formatMin = (m?: number) => {
          if (!m) return "";
          const h = Math.floor(m / 60);
          const min = m % 60;
          if (h > 0) return min > 0 ? `${h}h ${min}p` : `${h}h`;
          return `${min}p`;
        };
        return record.lateDays > 0 ? (
          <span className="text-orange-500">
            {record.lateDays} ngày ({formatMin(record.totalLateMinutes)})
          </span>
        ) : "-";
      },
    },
    {
      title: "Về sớm",
      key: "earlyLeave",
      render: (_, record) => {
        const formatMin = (m?: number) => {
          if (!m) return "";
          const h = Math.floor(m / 60);
          const min = m % 60;
          if (h > 0) return min > 0 ? `${h}h ${min}p` : `${h}h`;
          return `${min}p`;
        };
        return record.earlyLeaveDays > 0 ? (
          <span className="text-orange-500">
            {record.earlyLeaveDays} ngày ({formatMin(record.totalEarlyLeaveMinutes)})
          </span>
        ) : "-";
      },
    },
    {
      title: "Làm thêm (OT)",
      dataIndex: "totalOtMinutes",
      key: "totalOtMinutes",
      render: (val) => val > 0 ? <span className="text-blue-500">{val}p</span> : "-",
    },
    {
      title: "Thiếu check-out",
      dataIndex: "missingCheckoutDays",
      key: "missingCheckoutDays",
      render: (val) => val > 0 ? <span className="text-red-500 font-medium">{val} ngày</span> : "-",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-slate-50 p-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
          <span className="text-slate-600 font-medium">Chọn tháng:</span>
          <BaseDatePicker
            aria-label="Chọn tháng lập bảng công"
            picker="month"
            value={selectedMonth}
            onChange={(date) => {
              if (date && !Array.isArray(date)) {
                setSelectedMonth(date);
                setPage(0);
              }
            }}
            allowClear={false}
          />
        </div>
        
        <BaseButton 
          type="primary" 
          icon={<DownloadOutlined />} 
          onClick={handleExport}
          loading={exportAttendance.isPending}
          className="bg-green-600 hover:bg-green-700"
        >
          Xuất báo cáo
        </BaseButton>
      </div>

      <DataTable
        ariaLabel="Bảng công tổng hợp theo tháng"
        emptyTitle="Chưa có bảng công tháng"
        emptyDescription="Chọn tháng khác để kiểm tra dữ liệu."
        columns={columns}
        data={pageData?.content || []}
        rowKey={(record) => `${record.employeeId}-${record.siteId}-${record.month}-${record.year}`}
        loading={isLoading}
        currentPage={page}
        pageSize={size}
        totalElements={pageData?.totalElements || 0}
        onPageChange={(nextPage, nextSize) => {
          setPage(nextPage);
          setSize(nextSize);
        }}
        scroll={{ x: 1200 }}
      />
    </div>
  );
}
