"use client";

import React, { useEffect, useState } from "react";
import { Table, DatePicker, Button, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { DownloadOutlined } from "@ant-design/icons";
import { attendanceService } from "../services/attendance.service";
import { AttendanceHrMonthlyResponse } from "../types/attendance.type";
import dayjs, { Dayjs } from "dayjs";
import { useAuthStore } from "@/stores/auth.store";

export default function AttendanceMonthlyTab() {
  const user = useAuthStore((state) => state.user);
  const currentTenantId = user?.tenantId;

  const [data, setData] = useState<AttendanceHrMonthlyResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);

  const [selectedMonth, setSelectedMonth] = useState<Dayjs>(dayjs());
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (currentTenantId) {
      fetchData();
    }
  }, [selectedMonth, page, size, currentTenantId]);

  const fetchData = async () => {
    if (!currentTenantId) return;
    try {
      setLoading(true);
      const res = await attendanceService.listMonthlyAttendance(currentTenantId, {
        year: selectedMonth.year(),
        month: selectedMonth.month() + 1,
        page,
        size,
      });
      setData(res.content);
      setTotal(res.totalElements);
    } catch (error) {
      console.error("Failed to fetch monthly attendance", error);
      message.error("Lỗi khi tải bảng công tháng");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (!currentTenantId) return;
    try {
      setExporting(true);
      const blob = await attendanceService.exportMonthlyAttendance(currentTenantId, {
        year: selectedMonth.year(),
        month: selectedMonth.month() + 1,
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
      setExporting(false);
    }
  };

  const handleTableChange = (pagination: any, filters: any, sorter: any) => {
    setPage(pagination.current ? pagination.current - 1 : 0);
    setSize(pagination.pageSize || 20);
  };

  const columns: ColumnsType<AttendanceHrMonthlyResponse> = [
    {
      title: "Nhân viên (ID)",
      key: "employee",
      render: (_, record) => record.employeeId,
    },
    {
      title: "Site (ID)",
      key: "site",
      render: (_, record) => record.siteId,
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
      render: (_, record) => record.lateDays > 0 ? (
        <span className="text-orange-500">
          {record.lateDays} ngày ({record.totalLateMinutes}p)
        </span>
      ) : "-",
    },
    {
      title: "Về sớm",
      key: "earlyLeave",
      render: (_, record) => record.earlyLeaveDays > 0 ? (
        <span className="text-orange-500">
          {record.earlyLeaveDays} ngày ({record.totalEarlyLeaveMinutes}p)
        </span>
      ) : "-",
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
      <div className="flex gap-4 flex-wrap bg-slate-50 p-4 rounded-lg border border-slate-200 justify-between items-center">
        <div className="flex gap-4 items-center">
          <span className="text-slate-600 font-medium">Chọn tháng:</span>
          <DatePicker
            picker="month"
            value={selectedMonth}
            onChange={(date) => {
              if (date) {
                setSelectedMonth(date);
                setPage(0);
              }
            }}
            allowClear={false}
          />
        </div>
        
        <Button 
          type="primary" 
          icon={<DownloadOutlined />} 
          onClick={handleExport}
          loading={exporting}
          className="bg-green-600 hover:bg-green-700"
        >
          Xuất báo cáo
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={data}
        rowKey={(record) => `${record.employeeId}-${record.siteId}-${record.month}-${record.year}`}
        loading={loading}
        pagination={{
          current: page + 1,
          pageSize: size,
          total: total,
          showSizeChanger: true,
        }}
        onChange={handleTableChange}
        scroll={{ x: 1200 }}
      />
    </div>
  );
}
