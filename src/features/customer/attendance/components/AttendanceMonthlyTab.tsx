"use client";

import { useMemo, useState } from "react";
import { Alert, App, Tag, Tooltip } from "antd";
import type { ColumnsType } from "antd/es/table";
import { DownloadOutlined } from "@ant-design/icons";
import dayjs, { type Dayjs } from "dayjs";
import BaseDatePicker from "@/components/ui/BaseDatePicker";
import BaseButton from "@/components/ui/BaseButton";
import BaseSelect from "@/components/ui/BaseSelect";
import DataTable from "@/components/tables/DataTable";
import { useAuthStore } from "@/stores/auth.store";
import { SystemRole } from "@/features/customer/auth/types/auth.type";
import { useSitesQuery } from "@/features/customer/site/hooks/use-site";
import { useEmployees } from "@/features/customer/employee/hooks/use-employee";
import { formatVietnameseName } from "@/utils/name.util";
import type {
  AttendanceHrMonthlyResponse,
  AttendanceMonthlyParams,
} from "../types/attendance.type";
import { useExportMonthlyAttendance, useMonthlyAttendance } from "../hooks/use-attendance";

function formatMinutes(value?: number) {
  if (!value) return "0p";
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  return `${hours > 0 ? `${hours}h ` : ""}${minutes > 0 ? `${minutes}p` : ""}`.trim();
}

export default function AttendanceMonthlyTab() {
  const { message, modal } = App.useApp();
  const user = useAuthStore((state) => state.user);
  const tenantId = user?.tenantId ?? undefined;
  const supervisorMustChooseSite = user?.role === SystemRole.SITE_SUPERVISOR;
  const canExport =
    user?.role === SystemRole.PLATFORM_ADMIN ||
    Boolean(user?.permissions?.includes("attendance:export"));
  const [selectedMonth, setSelectedMonth] = useState<Dayjs>(dayjs());
  const [employeeId, setEmployeeId] = useState<string>();
  const [siteId, setSiteId] = useState<string>();
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [checkingReadiness, setCheckingReadiness] = useState(false);

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
    siteId || (supervisorMustChooseSite && sites.length === 1 ? sites[0].id : undefined);
  const { data: employeePage } = useEmployees(
    { page: 0, size: 100, sortBy: "firstName", sortDir: "asc" },
    { enabled: Boolean(tenantId) },
  );
  const employees = useMemo(() => employeePage?.content ?? [], [employeePage?.content]);

  const monthlyParams: AttendanceMonthlyParams = {
    year: selectedMonth.year(),
    month: selectedMonth.month() + 1,
    employeeId,
    siteId: effectiveSiteId,
    page,
    size,
  };
  const canLoad =
    Boolean(tenantId) && (!supervisorMustChooseSite || Boolean(effectiveSiteId));
  const { data: pageData, isLoading, isError, error } = useMonthlyAttendance(
    tenantId,
    monthlyParams,
    canLoad,
  );
  const exportAttendance = useExportMonthlyAttendance();

  const pendingRowsOnPage = (pageData?.content ?? []).filter(
    (row) => row.daysWithPendingReview > 0,
  );

  const confirmExport = (backendMessage: string) => {
    return new Promise<boolean>((resolve) => {
      modal.confirm({
        title: "Bảng công chưa sẵn sàng để chốt lương",
        content: (
          <div className="space-y-2 text-sm text-slate-600">
            <p>{backendMessage}</p>
            <p>
              Phiên chờ duyệt có thể làm tổng giờ tăng sau khi duyệt; phiên bị từ chối
              đã bị loại khỏi số liệu hiện tại.
            </p>
            <p>Hãy ưu tiên xử lý các dòng cảnh báo trước khi xuất dữ liệu cho payroll.</p>
          </div>
        ),
        okText: "Tôi hiểu, vẫn xuất",
        cancelText: "Quay lại kiểm tra",
        okButtonProps: { danger: true },
        onOk: () => resolve(true),
        onCancel: () => resolve(false),
      });
    });
  };

  const handleExport = async () => {
    if (!tenantId || !canExport) return;
    setCheckingReadiness(true);
    try {
      const params = {
        year: selectedMonth.year(),
        month: selectedMonth.month() + 1,
        siteId: effectiveSiteId,
      };
      let blob: Blob;
      try {
        blob = await exportAttendance.mutateAsync({
          tenantId,
          params: { ...params, confirmDespiteWarnings: false },
        });
      } catch (readinessError: unknown) {
        const response = (readinessError as {
          response?: {
            status?: number;
            data?: { errorCode?: string; userMessage?: string; message?: string };
          };
        }).response;
        if (
          response?.status !== 409 ||
          response.data?.errorCode !== "ATTENDANCE_NOT_READY"
        ) {
          throw readinessError;
        }
        const approved = await confirmExport(
          response.data.userMessage ||
            response.data.message ||
            "Bảng công còn phiên chờ duyệt hoặc bị từ chối.",
        );
        if (!approved) return;
        blob = await exportAttendance.mutateAsync({
          tenantId,
          params: { ...params, confirmDespiteWarnings: true },
        });
      }
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `BangCong_${selectedMonth.format("MM_YYYY")}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      message.success("Đã xuất bảng công tháng.");
    } catch (exportError: unknown) {
      message.error(
        (exportError as { response?: { data?: { message?: string } } }).response?.data
          ?.message || "Không thể xuất báo cáo. Vui lòng thử lại.",
      );
    } finally {
      setCheckingReadiness(false);
    }
  };

  const columns: ColumnsType<AttendanceHrMonthlyResponse> = [
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
    { title: "Ngày công", dataIndex: "presentDays", key: "presentDays", width: 100 },
    {
      title: "Tổng giờ làm",
      dataIndex: "totalWorkMinutes",
      key: "totalWorkMinutes",
      width: 140,
      render: (value, record) => (
        <Tooltip title="Tổng giờ đã bao gồm OT; không cộng OT thêm lần nữa.">
          <div>
            <span className="font-semibold">{formatMinutes(value)}</span>
            {record.totalOtMinutes > 0 && <div className="text-xs text-blue-600">gồm {formatMinutes(record.totalOtMinutes)} OT</div>}
          </div>
        </Tooltip>
      ),
    },
    {
      title: "Đi muộn",
      key: "late",
      width: 150,
      render: (_, record) => record.lateDays > 0
        ? <span className="text-orange-600">{record.lateDays} ngày ({formatMinutes(record.totalLateMinutes)})</span>
        : "—",
    },
    {
      title: "Về sớm",
      key: "earlyLeave",
      width: 150,
      render: (_, record) => record.earlyLeaveDays > 0
        ? <span className="text-orange-600">{record.earlyLeaveDays} ngày ({formatMinutes(record.totalEarlyLeaveMinutes)})</span>
        : "—",
    },
    {
      title: "Thiếu check-out",
      dataIndex: "missingCheckoutDays",
      key: "missingCheckoutDays",
      width: 140,
      render: (value) => value > 0 ? <Tag color="error">{value} ngày</Tag> : "—",
    },
    {
      title: "Chưa chốt",
      key: "reviewIssues",
      width: 190,
      render: (_, record) => (
        <div className="flex flex-wrap gap-1">
          {record.daysWithPendingReview > 0 && (
            <Tooltip title="Số liệu có thể tăng sau khi HR duyệt các phiên này.">
              <Tag color="warning">Chờ duyệt {record.daysWithPendingReview} ngày</Tag>
            </Tooltip>
          )}
          {record.daysWithRejectedSession > 0 && (
            <Tooltip title="Các phiên bị từ chối đã được loại khỏi tổng giờ.">
              <Tag color="error">Từ chối {record.daysWithRejectedSession} ngày</Tag>
            </Tooltip>
          )}
          {record.daysWithPendingReview === 0 && record.daysWithRejectedSession === 0 && "—"}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <Alert
        type="info"
        showIcon
        title="Một nhân viên có thể xuất hiện ở nhiều dòng"
        description="Bảng được gộp theo nhân viên + công trình. Tổng giờ đã bao gồm OT; cột OT chỉ là phần phân tích."
      />
      <div className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 sm:grid-cols-2 xl:grid-cols-4 sm:p-4">
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
        <BaseSelect
          aria-label="Lọc bảng công tháng theo công trình"
          allowClear={!supervisorMustChooseSite}
          placeholder={supervisorMustChooseSite ? "Chọn công trình bắt buộc" : "Tất cả công trình"}
          value={effectiveSiteId}
          onChange={(value) => { setSiteId(value); setPage(0); }}
          options={sites.map((site) => ({ value: site.id, label: site.name }))}
        />
        <BaseSelect
          aria-label="Lọc bảng công tháng theo nhân viên"
          showSearch
          optionFilterProp="label"
          allowClear
          placeholder="Tất cả nhân viên"
          value={employeeId}
          onChange={(value) => { setEmployeeId(value); setPage(0); }}
          options={employees.map((employee) => ({
            value: employee.id,
            label: `${formatVietnameseName(employee.firstName, employee.lastName)}${employee.employeeCode ? ` (${employee.employeeCode})` : ""}`,
          }))}
        />
        {canExport && (
          <BaseButton
            type="primary"
            icon={<DownloadOutlined />}
            onClick={handleExport}
            loading={checkingReadiness || exportAttendance.isPending}
            disabled={!canLoad}
            className="bg-green-600 hover:bg-green-700"
          >
            Xuất toàn bộ tháng
          </BaseButton>
        )}
      </div>

      {supervisorMustChooseSite && !effectiveSiteId && (
        <Alert
          type="warning"
          showIcon
          title="Hãy chọn một công trình"
          description="Supervisor phụ trách nhiều công trình phải chọn từng công trình trước khi tải bảng tổng hợp."
        />
      )}
      {pendingRowsOnPage.length > 0 && (
        <Alert
          type="warning"
          showIcon
          title={`${pendingRowsOnPage.length} dòng trên trang này chưa thể coi là số liệu cuối cùng`}
          description="Còn phiên chấm công chờ duyệt. Backend sẽ kiểm tra lại toàn bộ tháng/công trình ngay tại thời điểm xuất, không chỉ trang hiện tại."
        />
      )}
      {isError && (
        <Alert
          type="error"
          showIcon
          title="Không thể tải bảng công tháng"
          description={(error as { response?: { data?: { message?: string } } }).response?.data?.message || "Vui lòng thử lại."}
        />
      )}

      <DataTable
        ariaLabel="Bảng công tổng hợp theo tháng"
        emptyTitle="Chưa có bảng công tháng"
        emptyDescription="Chọn tháng, nhân viên hoặc công trình khác để kiểm tra dữ liệu."
        columns={columns}
        data={pageData?.content || []}
        rowKey={(record) => `${record.employeeId}-${record.siteId}-${record.month}-${record.year}`}
        loading={isLoading}
        currentPage={page}
        pageSize={size}
        totalElements={pageData?.totalElements || 0}
        onPageChange={(nextPage, nextSize) => { setPage(nextPage); setSize(nextSize); }}
        scroll={{ x: 1300 }}
      />
    </div>
  );
}
