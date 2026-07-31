"use client";

import { useMemo, useState } from "react";
import { Alert, DatePicker, Tag, Tooltip } from "antd";
import type { ColumnsType } from "antd/es/table";
import { EyeOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import BaseButton from "@/components/ui/BaseButton";
import BaseSelect from "@/components/ui/BaseSelect";
import DataTable from "@/components/tables/DataTable";
import { useAuthStore } from "@/stores/auth.store";
import { SystemRole } from "@/features/customer/auth/types/auth.type";
import { useSitesQuery } from "@/features/customer/site/hooks/use-site";
import { useEmployees } from "@/features/customer/employee/hooks/use-employee";
import { formatVietnameseName } from "@/utils/name.util";
import type {
  AttendanceListParams,
  AttendanceSummaryResponse,
} from "../types/attendance.type";
import { useAttendanceSummaries } from "../hooks/use-attendance";
import AttendanceIssueBadges from "./AttendanceIssueBadges";
import AttendanceDetailModal from "./AttendanceDetailModal";

const { RangePicker } = DatePicker;

function formatMinutes(value?: number) {
  if (!value) return "0p";
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  return `${hours > 0 ? `${hours}h ` : ""}${minutes > 0 ? `${minutes}p` : ""}`.trim();
}

export default function AttendanceSummaryTab() {
  const user = useAuthStore((state) => state.user);
  const tenantId = user?.tenantId ?? undefined;
  const supervisorMustChooseSite = user?.role === SystemRole.SITE_SUPERVISOR;
  const [selectedSummaryId, setSelectedSummaryId] = useState<string | null>(null);
  const [params, setParams] = useState<AttendanceListParams>({
    page: 0,
    size: 20,
    from: dayjs().startOf("month").format("YYYY-MM-DD"),
    to: dayjs().endOf("month").format("YYYY-MM-DD"),
  });

  const { data: sitePage } = useSitesQuery({
    tenantId,
    status: "active",
    sortBy: "name",
    sortDir: "asc",
    page: 0,
    size: 100,
  });
  const sites = useMemo(() => sitePage?.data?.content ?? [], [sitePage?.data?.content]);
  const effectiveSiteId =
    params.siteId ||
    (supervisorMustChooseSite && sites.length === 1 ? sites[0].id : undefined);

  const { data: employeePage } = useEmployees(
    { page: 0, size: 100, sortBy: "firstName", sortDir: "asc" },
    { enabled: Boolean(tenantId) },
  );
  const employees = useMemo(() => employeePage?.content ?? [], [employeePage?.content]);
  const requestParams = useMemo(
    () => ({ ...params, siteId: effectiveSiteId }),
    [effectiveSiteId, params],
  );
  const canLoad =
    Boolean(tenantId) && (!supervisorMustChooseSite || Boolean(effectiveSiteId));
  const { data: pageData, isLoading, isError, error } = useAttendanceSummaries(
    tenantId,
    requestParams,
    canLoad,
  );

  const pendingOnPage = (pageData?.content ?? []).filter(
    (row) => row.hasPendingReviewSession,
  ).length;

  const columns: ColumnsType<AttendanceSummaryResponse> = [
    {
      title: "Ngày",
      dataIndex: "attendanceDate",
      key: "attendanceDate",
      width: 110,
      render: (value) => dayjs(value).format("DD/MM/YYYY"),
    },
    {
      title: "Nhân viên",
      key: "employee",
      width: 190,
      render: (_, record) => record.employeeName || record.employeeId,
    },
    {
      title: "Công trình",
      key: "site",
      width: 170,
      render: (_, record) => record.siteName || record.siteId,
    },
    {
      title: "Giờ vào / ra",
      key: "time",
      width: 145,
      render: (_, record) => (
        <div className="whitespace-nowrap text-sm">
          <div>Vào: {record.firstCheckinAt ? dayjs(record.firstCheckinAt).format("HH:mm") : "—"}</div>
          <div>Ra: {record.lastCheckoutAt ? dayjs(record.lastCheckoutAt).format("HH:mm") : "—"}</div>
        </div>
      ),
    },
    {
      title: "Tổng giờ làm",
      dataIndex: "totalWorkMinutes",
      key: "totalWorkMinutes",
      width: 135,
      render: (value, record) => (
        <Tooltip title="Tổng giờ đã bao gồm phần OT; không cộng OT thêm lần nữa.">
          <div>
            <span className="font-semibold text-slate-800">{formatMinutes(value)}</span>
            {record.otMinutes > 0 && <div className="text-xs text-blue-600">gồm {formatMinutes(record.otMinutes)} OT</div>}
          </div>
        </Tooltip>
      ),
    },
    {
      title: "Muộn / Về sớm",
      key: "lateEarly",
      width: 150,
      render: (_, record) => (
        <div className="flex flex-col items-start gap-1">
          {record.late && <Tag color="warning">Muộn {formatMinutes(record.lateMinutes)}</Tag>}
          {record.earlyLeave && <Tag color="warning">Sớm {formatMinutes(record.earlyLeaveMinutes)}</Tag>}
          {!record.late && !record.earlyLeave && <span className="text-slate-400">—</span>}
        </div>
      ),
    },
    {
      title: "Trạng thái công",
      key: "status",
      width: 150,
      render: (_, record) => (
        <div className="flex flex-col items-start gap-1">
          {record.missingCheckout ? (
            <Tag color="error">Thiếu check-out</Tag>
          ) : record.status === "present" ? (
            <Tag color="success">Hoàn thành</Tag>
          ) : (
            <Tag>Chưa hoàn thành</Tag>
          )}
          <span className="text-xs text-slate-500">{record.sessionCount} phiên hợp lệ</span>
        </div>
      ),
    },
    {
      title: "Dữ liệu cần lưu ý",
      key: "issues",
      width: 210,
      render: (_, record) => (
        <AttendanceIssueBadges
          hasPendingReviewSession={record.hasPendingReviewSession}
          hasRejectedSession={record.hasRejectedSession}
          adjustmentReason={record.adjustmentReason}
        />
      ),
    },
    {
      title: "Thao tác",
      key: "action",
      fixed: "right",
      width: 110,
      render: (_, record) => (
        <BaseButton type="link" icon={<EyeOutlined />} onClick={() => setSelectedSummaryId(record.id)}>
          Chi tiết
        </BaseButton>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <Alert
        type="info"
        showIcon
        title="Chỉ phiên hợp lệ được tính vào bảng công"
        description="Phiên chờ duyệt hoặc bị từ chối không nằm trong tổng giờ. OT là phần breakdown đã nằm trong tổng giờ làm."
      />

      <div className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 sm:grid-cols-2 xl:grid-cols-4 sm:p-4">
        <BaseSelect
          aria-label="Lọc bảng công theo công trình"
          allowClear={!supervisorMustChooseSite}
          placeholder={supervisorMustChooseSite ? "Chọn công trình bắt buộc" : "Tất cả công trình"}
          value={effectiveSiteId}
          onChange={(siteId) => setParams((current) => ({ ...current, siteId, page: 0 }))}
          options={sites.map((site) => ({ value: site.id, label: site.name }))}
        />
        <BaseSelect
          aria-label="Lọc bảng công theo nhân viên"
          showSearch
          optionFilterProp="label"
          allowClear
          placeholder="Tất cả nhân viên"
          value={params.employeeId}
          onChange={(employeeId) => setParams((current) => ({ ...current, employeeId, page: 0 }))}
          options={employees.map((employee) => ({
            value: employee.id,
            label: `${formatVietnameseName(employee.firstName, employee.lastName)}${employee.employeeCode ? ` (${employee.employeeCode})` : ""}`,
          }))}
        />
        <BaseSelect
          aria-label="Lọc bảng công theo trạng thái"
          allowClear
          placeholder="Tất cả trạng thái"
          value={params.status}
          onChange={(status) => setParams((current) => ({ ...current, status, page: 0 }))}
          options={[
            { label: "Hoàn thành", value: "present" },
            { label: "Chưa hoàn thành", value: "incomplete" },
          ]}
        />
        <RangePicker
          aria-label="Lọc bảng công theo khoảng ngày"
          className="w-full"
          value={[params.from ? dayjs(params.from) : null, params.to ? dayjs(params.to) : null]}
          onChange={(_, dateStrings) => setParams((current) => ({
            ...current,
            from: dateStrings[0] || undefined,
            to: dateStrings[1] || undefined,
            page: 0,
          }))}
        />
      </div>

      {supervisorMustChooseSite && !effectiveSiteId && (
        <Alert
          type="warning"
          showIcon
          title="Hãy chọn một công trình"
          description="Supervisor phụ trách nhiều công trình phải chọn từng công trình trước khi tải bảng công."
        />
      )}
      {pendingOnPage > 0 && (
        <Alert
          type="warning"
          showIcon
          title={`${pendingOnPage} dòng trên trang này có chấm công đang chờ duyệt`}
          description="Số giờ của các dòng này có thể còn thiếu và chưa nên dùng để chốt lương."
        />
      )}
      {isError && (
        <Alert
          type="error"
          showIcon
          title="Không thể tải bảng công theo ngày"
          description={(error as { response?: { data?: { message?: string } } }).response?.data?.message || "Vui lòng thử lại."}
        />
      )}

      <DataTable
        ariaLabel="Bảng công tổng hợp theo ngày"
        emptyTitle="Không có dữ liệu bảng công"
        emptyDescription="Thử chọn khoảng ngày, nhân viên hoặc công trình khác."
        columns={columns}
        data={pageData?.content || []}
        rowKey="id"
        loading={isLoading}
        currentPage={params.page || 0}
        pageSize={params.size || 20}
        totalElements={pageData?.totalElements || 0}
        onPageChange={(page, size) => setParams((current) => ({ ...current, page, size }))}
        scroll={{ x: 1350 }}
      />

      <AttendanceDetailModal
        tenantId={tenantId}
        summaryId={selectedSummaryId}
        onClose={() => setSelectedSummaryId(null)}
      />
    </div>
  );
}
