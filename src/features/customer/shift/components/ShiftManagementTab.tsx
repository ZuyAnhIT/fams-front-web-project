import React, { useState } from "react";
import { Badge, Tag } from "antd";
import { EditOutlined, SettingOutlined, PlusOutlined } from "@ant-design/icons";
import { BaseButton } from "@/components/ui";
import DataTable from "@/components/tables/DataTable";
import { ShiftResponse } from "../types/shift.type";
import { useShiftsQuery } from "../hooks/use-shift";
import ShiftFormModal from "./ShiftFormModal";
import ShiftOtConfigModal from "./ShiftOtConfigModal";

interface ShiftManagementTabProps {
  tenantId?: string;
  siteId: string;
}

export default function ShiftManagementTab({ tenantId, siteId }: ShiftManagementTabProps) {
  const [shiftPage, setShiftPage] = useState(0);
  const [shiftSort, setShiftSort] = useState({ sortBy: "name", sortDir: "asc" as "asc" | "desc" | undefined });

  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [isOtModalOpen, setIsOtModalOpen] = useState(false);
  const [activeShift, setActiveShift] = useState<ShiftResponse | null>(null);

  const { data: shiftsRes, isLoading: isShiftsLoading } = useShiftsQuery(
    tenantId,
    siteId,
    { page: shiftPage, size: 10, sortBy: shiftSort.sortBy, sortDir: shiftSort.sortDir }
  );
  
  const shifts = shiftsRes?.content || [];
  const totalShifts = shiftsRes?.totalElements || 0;

  const shiftColumns = [
    {
      title: "Tên ca",
      dataIndex: "name",
      key: "name",
      sorter: true,
      className: "font-medium text-slate-700",
    },
    {
      title: "Thời gian",
      key: "time",
      render: (_: any, record: any) => (
        <span className="text-slate-600">
          {record.startTime} - {record.endTime}
        </span>
      ),
    },
    {
      title: "Qua đêm",
      dataIndex: "allowOvernight",
      key: "allowOvernight",
      render: (val: boolean) => (val ? <Tag color="blue">Có</Tag> : <Tag color="default">Không</Tag>),
    },
    {
      title: "Tăng ca",
      dataIndex: "allowOvertime",
      key: "allowOvertime",
      render: (val: boolean) => (val ? <Tag color="green">Có</Tag> : <Tag color="default">Không</Tag>),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (val: string) => (
        <Badge status={val === "active" ? "success" : "default"} text={val === "active" ? "Đang áp dụng" : "Ngừng áp dụng"} className="text-slate-600" />
      ),
    },
    {
      title: "Thao tác",
      key: "action",
      width: 120,
      render: (_: any, record: ShiftResponse) => (
        <div className="flex gap-2">
          <BaseButton 
            type="text" 
            size="small"
            icon={<EditOutlined className="text-blue-500" />} 
            onClick={() => {
              setActiveShift(record);
              setIsShiftModalOpen(true);
            }}
            title="Sửa ca làm việc"
          />
          <BaseButton 
            type="text" 
            size="small"
            icon={<SettingOutlined className="text-purple-500" />} 
            onClick={() => {
              setActiveShift(record);
              setIsOtModalOpen(true);
            }}
            title="Cấu hình OT"
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-slate-500 m-0">Quản lý các ca làm việc tiêu chuẩn áp dụng tại công trình này.</p>
        <BaseButton 
          type="primary" 
          icon={<PlusOutlined />}
          onClick={() => {
            setActiveShift(null);
            setIsShiftModalOpen(true);
          }}
          className="!bg-blue-600 !text-white hover:!bg-blue-700 !border-0 shadow-md shadow-blue-500/20 h-9 px-4 rounded-lg font-semibold transition-all flex items-center gap-2"
        >
          Tạo ca làm việc
        </BaseButton>
      </div>
      <DataTable 
        data={shifts} 
        columns={shiftColumns as any} 
        loading={isShiftsLoading}
        totalElements={totalShifts}
        currentPage={shiftPage}
        pageSize={10}
        onPageChange={(p) => setShiftPage(p)}
        onChange={(pagination, filters, sorter: any) => {
          if (sorter && (sorter.columnKey || sorter.field)) {
            setShiftSort({
              sortBy: sorter.columnKey || sorter.field,
              sortDir: sorter.order === 'ascend' ? 'asc' : 'desc'
            });
          } else {
            setShiftSort({ sortBy: "name", sortDir: "asc" });
          }
        }}
      />

      <ShiftFormModal
        isOpen={isShiftModalOpen}
        onClose={() => setIsShiftModalOpen(false)}
        siteId={siteId}
        activeShift={activeShift}
      />

      <ShiftOtConfigModal
        isOpen={isOtModalOpen}
        onClose={() => setIsOtModalOpen(false)}
        siteId={siteId}
        activeShift={activeShift}
      />
    </div>
  );
}
