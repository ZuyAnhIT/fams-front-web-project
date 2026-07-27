import React, { useState } from "react";
import { App, Badge, Tag, type TableColumnsType, type TableProps } from "antd";
import { isAxiosError } from "axios";
import { EditOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { BaseButton, BaseSelect, BaseModal } from "@/components/ui";
import DataTable from "@/components/tables/DataTable";
import { useAssignments } from "../hooks/use-assignments";
import { useCancelAssignmentMutation } from "../hooks/use-assignment";
import {
  type AssignmentListParams,
  type AssignmentResponse,
} from "../types/assignment.type";
import AssignmentFormModal from "./AssignmentFormModal";
import { ShiftResponse } from "@/features/customer/shift/types/shift.type";
import { useEmployees } from "@/features/customer/employee/hooks/use-employee";
import { formatVietnameseName } from "@/utils/name.util";
import { useAuthStore } from "@/stores/auth.store";
import type { AssignmentDayOfWeek } from "../types/assignment.type";

interface AssignmentManagementTabProps {
  tenantId?: string;
  siteId: string;
  shifts: ShiftResponse[];
}

const DAY_LABELS: Record<AssignmentDayOfWeek, string> = {
  MONDAY: "T2",
  TUESDAY: "T3",
  WEDNESDAY: "T4",
  THURSDAY: "T5",
  FRIDAY: "T6",
  SATURDAY: "T7",
  SUNDAY: "CN",
};

export default function AssignmentManagementTab({ tenantId, siteId, shifts }: AssignmentManagementTabProps) {
  const { message } = App.useApp();
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const canCreate = hasPermission("assignments:create");
  const canUpdate = hasPermission("assignments:update");
  const canDelete = hasPermission("assignments:delete");
  const canListEmployees = hasPermission("employees:list");
  const [assignmentPage, setAssignmentPage] = useState(0);
  const [assignmentPageSize, setAssignmentPageSize] = useState(10);
  const [assignmentSort, setAssignmentSort] = useState<{
    sortBy: NonNullable<AssignmentListParams["sortBy"]>;
    sortDir: "asc" | "desc" | undefined;
  }>({
    sortBy: "startDate",
    sortDir: "desc" as "asc" | "desc" | undefined,
  });
  const [assignmentFilters, setAssignmentFilters] = useState({
    status: undefined as "active" | "cancelled" | undefined,
    role: undefined as "worker" | "supervisor" | undefined,
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
    { page: assignmentPage, size: assignmentPageSize, ...assignmentFilters, sortBy: assignmentSort.sortBy, sortDir: assignmentSort.sortDir }
  );
  
  const assignments = assignmentsRes?.data?.content || [];
  const totalAssignments = assignmentsRes?.data?.totalElements || 0;

  const { data: employeesRes } = useEmployees(
    { size: 100 },
    { enabled: canListEmployees },
  );
  const employees = employeesRes?.content || [];
  const employeeFilterOptions = Array.from(
    new Map<string, string>([
      ...employees.map(
        (employee) =>
          [
            employee.id,
            `${formatVietnameseName(employee.firstName, employee.lastName)} ${
              employee.employeeCode ? `(${employee.employeeCode})` : ""
            }`,
          ] as const,
      ),
      ...assignments.flatMap((record) =>
        record.employeeSummary
          ? [
              [
                record.employeeSummary.id,
                `${record.employeeSummary.fullName}${
                  record.employeeSummary.employeeCode
                    ? ` (${record.employeeSummary.employeeCode})`
                    : ""
                }`,
              ] as const,
            ]
          : [],
      ),
    ]),
  ).map(([value, label]) => ({ value, label }));

  const getEmployeeName = (record: AssignmentResponse) => {
    if (record.employeeSummary?.fullName) {
      return record.employeeSummary.fullName;
    }
    const employee = employees.find(
      (candidate) => candidate.id === record.employeeId,
    );
    return employee
      ? formatVietnameseName(employee.firstName, employee.lastName)
      : "Nhân viên không còn tồn tại";
  };

  const getShiftLabel = (record: AssignmentResponse) => {
    if (!record.shiftId) return "Không cố định";
    if (record.shiftSummary) {
      return `${record.shiftSummary.name} (${record.shiftSummary.startTime}–${record.shiftSummary.endTime})`;
    }
    const shift = shifts.find((candidate) => candidate.id === record.shiftId);
    return shift
      ? `${shift.name} (${shift.startTime}–${shift.endTime})`
      : "Ca không còn tồn tại";
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
        onError: (error: unknown) => {
          const backendMessage = isAxiosError(error)
            ? (error.response?.data as { message?: string } | undefined)?.message
            : undefined;
          message.error(backendMessage || "Có lỗi xảy ra khi hủy phân công.");
        },
      }
    );
  };

  const assignmentColumns: TableColumnsType<AssignmentResponse> = [
    {
      title: "Nhân viên",
      key: "employeeId",
      render: (_, record) => (
        <div>
          <div className="font-medium text-slate-700">
            {getEmployeeName(record)}
          </div>
          {record.employeeSummary?.employeeCode && (
            <div className="text-xs text-slate-500">
              {record.employeeSummary.employeeCode}
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Lịch tuần",
      dataIndex: "daysOfWeek",
      key: "daysOfWeek",
      render: (days: AssignmentDayOfWeek[] | null) => (
        <span className="text-slate-600">
          {days?.length
            ? days.map((day) => DAY_LABELS[day]).join(", ")
            : "Mọi ngày"}
        </span>
      ),
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
      key: "shiftId",
      render: (_, record) => (
        <div>
          <span className="text-slate-600">{getShiftLabel(record)}</span>
          {record.shiftSummary?.status === "inactive" && (
            <Tag className="ml-2">Đã ngừng dùng</Tag>
          )}
        </div>
      ),
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
      render: (_: unknown, record: AssignmentResponse) => (
        <div className="flex gap-2">
          {canUpdate && (
            <BaseButton
              aria-label={`Sửa phân công của ${getEmployeeName(record)}`}
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
              aria-label={`Hủy phân công của ${getEmployeeName(record)}`}
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

  const handleTableChange: NonNullable<
    TableProps<AssignmentResponse>["onChange"]
  > = (_, __, sorter) => {
    if (
      !Array.isArray(sorter) &&
      sorter.columnKey &&
      ["startDate", "endDate", "role", "status", "createdAt"].includes(
        String(sorter.columnKey),
      )
    ) {
      setAssignmentSort({
        sortBy: sorter.columnKey as typeof assignmentSort.sortBy,
        sortDir: sorter.order === "ascend" ? "asc" : "desc",
      });
    } else {
      setAssignmentSort({ sortBy: "startDate", sortDir: "desc" });
    }
  };

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
          <label htmlFor="assignment-employee-filter" className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Nhân viên</label>
          <BaseSelect
            id="assignment-employee-filter"
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
            options={employeeFilterOptions}
          />
        </div>
        
        <div className="flex flex-col gap-1">
          <label htmlFor="assignment-status-filter" className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Trạng thái</label>
          <BaseSelect
            id="assignment-status-filter"
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
          <label htmlFor="assignment-role-filter" className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Vai trò</label>
          <BaseSelect
            id="assignment-role-filter"
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
          <label htmlFor="assignment-shift-filter" className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Ca làm việc</label>
          <BaseSelect
            id="assignment-shift-filter"
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
        columns={assignmentColumns}
        loading={isAssignmentsLoading}
        totalElements={totalAssignments}
        currentPage={assignmentPage}
        pageSize={assignmentPageSize}
        onPageChange={(page, size) => {
          setAssignmentPage(page);
          setAssignmentPageSize(size);
        }}
        ariaLabel="Danh sách phân công nhân viên tại công trình"
        emptyTitle="Không tìm thấy phân công"
        emptyDescription="Thử thay đổi nhân viên, trạng thái, vai trò hoặc ca làm việc."
        onChange={handleTableChange}
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
          Nhân viên <span className="font-bold text-slate-800">{assignmentToCancel ? getEmployeeName(assignmentToCancel) : ""}</span> sẽ không thể chấm công tại công trình này nữa. Bạn có chắc chắn muốn hủy phân công này?
        </div>
      </BaseModal>
    </div>
  );
}
