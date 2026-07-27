import React, { useState } from "react";
import { Badge, Tag, message } from "antd";
import { EditOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { BaseButton, BaseSelect, BaseModal } from "@/components/ui";
import DataTable from "@/components/tables/DataTable";
import { useAssignments } from "../hooks/use-assignments";
import { useCancelAssignmentMutation } from "../hooks/use-assignment";
import { AssignmentResponse } from "../types/assignment.type";
import AssignmentFormModal from "./AssignmentFormModal";
import { ShiftResponse } from "@/features/customer/shift/types/shift.type";
import { useEmployees } from "@/features/customer/employee/hooks/use-employee";
import { formatVietnameseName } from "@/utils/name.util";
import { useAuthStore } from "@/stores/auth.store";

interface AssignmentManagementTabProps {
  tenantId?: string;
  siteId: string;
  shifts: ShiftResponse[];
}

export default function AssignmentManagementTab({ tenantId, siteId, shifts }: AssignmentManagementTabProps) {
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const canCreate = hasPermission("assignments:create");
  const canUpdate = hasPermission("assignments:update");
  const canDelete = hasPermission("assignments:delete");
  const canListEmployees = hasPermission("employees:list");
  const [assignmentPage, setAssignmentPage] = useState(0);
  const [assignmentSort, setAssignmentSort] = useState({
    sortBy: "startDate",
    sortDir: "desc" as "asc" | "desc" | undefined,
  });
  const [assignmentFilters, setAssignmentFilters] = useState({
    status: undefined as string | undefined,
    role: undefined as string | undefined,
    shiftId: undefined as string | undefined,
    employeeId: undefined as string | undefined,
  });

  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [activeAssignment, setActiveAssignment] = useState<AssignmentResponse | null>(null);

  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [assignmentToCancel, setAssignmentToCancel] = useState<AssignmentResponse | null>(null);

  const cancelAssignmentMutation = useCancelAssignmentMutation();

  const { data: assignmentsRes, isLoading: isAssignmentsLoading } = useAssignments(
    tenantId || "",
    siteId,
    { page: assignmentPage, size: 10, ...assignmentFilters, sortBy: assignmentSort.sortBy, sortDir: assignmentSort.sortDir }
  );
  
  const assignments = assignmentsRes?.data?.content || [];
  const totalAssignments = assignmentsRes?.data?.totalElements || 0;

  const { data: employeesRes } = useEmployees(
    { size: 100 },
    { enabled: canListEmployees },
  );
  const employees = employeesRes?.content || [];

  const getEmployeeName = (id: string) => {
    const emp = employees.find((e: any) => e.id === id);
    return emp ? formatVietnameseName(emp.firstName, emp.lastName) : id;
  };

  const getShiftName = (id: string | null) => {
    if (!id) return "Không cố định";
    const shift = shifts.find((s) => s.id === id);
    return shift ? shift.name : id;
  };

  const handleCancelAssignment = (record: AssignmentResponse) => {
    if (!tenantId) return;
    cancelAssignmentMutation.mutate(
      { tenantId, siteId, assignmentId: record.id },
      {
        onSuccess: () => {
          message.success("Hủy phân công thành công!");
          setIsCancelModalOpen(false);
          setAssignmentToCancel(null);
        },
        onError: (err: any) => message.error(err.response?.data?.message || "Có lỗi xảy ra khi hủy phân công."),
      }
    );
  };

  const assignmentColumns = [
    {
      title: "Nhân viên",
      dataIndex: "employeeId",
      key: "employeeId",
      sorter: true,
      render: (val: string) => <span className="font-medium text-slate-700">{getEmployeeName(val)}</span>,
    },
    {
      title: "Vai trò",
      dataIndex: "role",
      key: "role",
      sorter: true,
      render: (val: string) => (
        <Tag color={val === "supervisor" ? "purple" : "cyan"}>
          {val === "supervisor" ? "Giám sát" : "Nhân viên"}
        </Tag>
      ),
    },
    {
      title: "Ca làm việc",
      dataIndex: "shiftId",
      key: "shiftId",
      render: (val: string | null) => <span className="text-slate-600">{getShiftName(val)}</span>,
    },
    {
      title: "Ngày bắt đầu",
      dataIndex: "startDate",
      key: "startDate",
      sorter: true,
      className: "text-slate-600",
    },
    {
      title: "Ngày kết thúc",
      dataIndex: "endDate",
      key: "endDate",
      sorter: true,
      render: (val: string | null) => <span className="text-slate-600">{val || "Vô thời hạn"}</span>,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      sorter: true,
      render: (val: string) => (
        <Badge
          status={val === "active" ? "success" : "default"}
          text={val === "active" ? "Đang làm việc" : "Đã hủy"}
          className="text-slate-600"
        />
      ),
    },
    ...((canUpdate || canDelete) ? [{
      title: "Thao tác",
      key: "action",
      width: 120,
      render: (_: any, record: AssignmentResponse) => (
        <div className="flex gap-2">
          {canUpdate && (
            <BaseButton
              type="text"
              size="small"
              icon={<EditOutlined className="text-blue-500" />}
              onClick={() => {
                setActiveAssignment(record);
                setIsAssignmentModalOpen(true);
              }}
              title="Sửa phân công"
            />
          )}
          {canDelete && record.status === "active" && (
            <BaseButton
              type="text"
              size="small"
              icon={<DeleteOutlined className="text-red-500" />}
              title="Hủy phân công"
              onClick={() => {
                setAssignmentToCancel(record);
                setIsCancelModalOpen(true);
              }}
            />
          )}
        </div>
      ),
    }] : []),
  ];

  return (
    <div className="space-y-4">
      {canCreate && <div className="flex justify-end">
        <BaseButton 
          type="primary" 
          icon={<PlusOutlined />}
          onClick={() => {
            setActiveAssignment(null);
            setIsAssignmentModalOpen(true);
          }}
          className="!bg-blue-600 !text-white hover:!bg-blue-700 !border-0 shadow-md shadow-blue-500/20 h-9 px-4 rounded-lg font-semibold transition-all flex items-center gap-2"
        >
          Tạo phân công
        </BaseButton>
      </div>}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {/* Filters */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Nhân viên</label>
          <BaseSelect
            showSearch
            placeholder="Lọc theo nhân viên..."
            allowClear
            className="w-full"
            value={assignmentFilters.employeeId}
            onChange={(val) => {
              setAssignmentFilters(prev => ({ ...prev, employeeId: val || undefined }));
              setAssignmentPage(0);
            }}
            filterOption={(input, option) =>
              (option?.label as string ?? "").toLowerCase().includes(input.toLowerCase())
            }
            options={employees.map((emp: any) => ({
              label: `${formatVietnameseName(emp.firstName, emp.lastName)} ${emp.employeeCode ? `(${emp.employeeCode})` : ''}`,
              value: emp.id
            }))}
          />
        </div>
        
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Trạng thái</label>
          <BaseSelect
            placeholder="Tất cả trạng thái"
            allowClear
            className="w-full"
            value={assignmentFilters.status}
            onChange={(val) => {
              setAssignmentFilters(prev => ({ ...prev, status: val || undefined }));
              setAssignmentPage(0);
            }}
            options={[
              { label: "Đang làm việc", value: "active" },
              { label: "Đã hủy", value: "cancelled" }
            ]}
          />
        </div>
        
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Vai trò</label>
          <BaseSelect
            placeholder="Tất cả vai trò"
            allowClear
            className="w-full"
            value={assignmentFilters.role}
            onChange={(val) => {
              setAssignmentFilters(prev => ({ ...prev, role: val || undefined }));
              setAssignmentPage(0);
            }}
            options={[
              { label: "Nhân viên", value: "worker" },
              { label: "Giám sát", value: "supervisor" }
            ]}
          />
        </div>
        
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Ca làm việc</label>
          <BaseSelect
            placeholder="Tất cả ca làm việc"
            allowClear
            className="w-full"
            value={assignmentFilters.shiftId}
            onChange={(val) => {
              setAssignmentFilters(prev => ({ ...prev, shiftId: val || undefined }));
              setAssignmentPage(0);
            }}
            options={[
              ...shifts.map(shift => ({
                label: shift.name,
                value: shift.id
              }))
            ]}
          />
        </div>
      </div>
      
      <DataTable 
        data={assignments} 
        columns={assignmentColumns as any} 
        loading={isAssignmentsLoading}
        totalElements={totalAssignments}
        currentPage={assignmentPage}
        pageSize={10}
        onPageChange={(p) => setAssignmentPage(p)}
        onChange={(pagination, filters, sorter: any) => {
          if (sorter && sorter.columnKey) {
            setAssignmentSort({
              sortBy: sorter.columnKey,
              sortDir: sorter.order === 'ascend' ? 'asc' : 'desc'
            });
          } else {
            setAssignmentSort({ sortBy: "startDate", sortDir: "desc" });
          }
        }}
      />

      <AssignmentFormModal
        isOpen={isAssignmentModalOpen}
        onClose={() => setIsAssignmentModalOpen(false)}
        siteId={siteId}
        activeAssignment={activeAssignment}
      />

      <BaseModal
        title={
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight leading-tight">
              Xác nhận hủy
            </h2>
          </div>
        }
        isOpen={isCancelModalOpen}
        onClose={() => {
          setIsCancelModalOpen(false);
          setAssignmentToCancel(null);
        }}
        width={400}
        centered
        confirmText="Xác nhận hủy"
        cancelText="Không"
        confirmLoading={cancelAssignmentMutation.isPending}
        onConfirm={() => {
          if (assignmentToCancel) {
            handleCancelAssignment(assignmentToCancel);
          }
        }}
        confirmButtonProps={{
          danger: true,
          className: "!bg-red-500 hover:!bg-red-600 !border-0 text-white font-bold transition-all h-10 px-6 rounded-lg shadow-md shadow-red-500/20"
        }}
        cancelButtonProps={{
          disabled: cancelAssignmentMutation.isPending,
          className: "!bg-white !text-slate-700 !border-slate-300 hover:!bg-slate-50 hover:!text-slate-900 h-10 px-6 rounded-lg font-semibold transition-all"
        }}
      >
        <div className="py-2 text-slate-600">
          Nhân viên <span className="font-bold text-slate-800">{assignmentToCancel ? getEmployeeName(assignmentToCancel.employeeId) : ""}</span> sẽ không thể chấm công tại công trình này nữa. Bạn có chắc chắn muốn hủy phân công này?
        </div>
      </BaseModal>
    </div>
  );
}
