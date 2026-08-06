'use client';

import { useState } from 'react';
import { Alert, App, Tag, type TableColumnsType } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { CalendarDays, Clock3, Download, TimerOff, Users } from 'lucide-react';
import BaseButton from '@/components/ui/BaseButton';
import BaseDatePicker from '@/components/ui/BaseDatePicker';
import BaseSelect from '@/components/ui/BaseSelect';
import DataTable from '@/components/tables/DataTable';
import StatCard from '@/components/charts/StatCard';
import { useAuthStore } from '@/stores/auth.store';
import { useSitesQuery } from '@/features/customer/site/hooks/use-site';
import type { AttendanceHrMonthlyResponse } from '@/features/customer/attendance/types/attendance.type';
import { useExportAttendanceReport, useMonthlyAttendanceReport } from '../hooks/use-report-search';
import type { AttendanceExportParams, MonthlyAttendanceReportParams } from '../types/report-search.type';
import { downloadBlob, formatMinutes, ReportError, reportErrorMessage } from './report-utils';

export default function MonthlyAttendanceReportTab() {
  const { message, modal } = App.useApp();
  const user = useAuthStore((state) => state.user);
  const tenantId = user?.tenantId ?? undefined;
  const canExport = user?.role === 'PLATFORM_ADMIN' || Boolean(user?.permissions?.includes('attendance:export'));
  const [month, setMonth] = useState<Dayjs>(dayjs());
  const [siteId, setSiteId] = useState<string>();
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const params: MonthlyAttendanceReportParams = { year: month.year(), month: month.month() + 1, siteId, page, size };
  const query = useMonthlyAttendanceReport(tenantId, params);
  const exportMutation = useExportAttendanceReport();
  const report = query.data;
  const { data: sitePage } = useSitesQuery({ tenantId, status: 'active', sortBy: 'name', sortDir: 'asc', page: 0, size: 100 });
  const warningRows = (report?.totalRowsWithPendingReview ?? 0) + (report?.totalRowsWithRejectedSession ?? 0) + (report?.totalRowsWithRandomCheckFailure ?? 0);

  const exportFile = async (confirmDespiteWarnings: boolean) => {
    if (!tenantId) return;
    const exportParams: AttendanceExportParams = { year: params.year, month: params.month, siteId, confirmDespiteWarnings };
    const blob = await exportMutation.mutateAsync({ tenantId, params: exportParams });
    downloadBlob(blob, `BangCong_${month.format('MM_YYYY')}.xlsx`);
    message.success('Đã xuất báo cáo công tháng.');
  };

  const handleExport = async () => {
    try {
      await exportFile(false);
    } catch (error) {
      const response = (error as { response?: { status?: number; data?: { errorCode?: string; userMessage?: string; message?: string } } }).response;
      if (response?.status !== 409 || response.data?.errorCode !== 'ATTENDANCE_NOT_READY') {
        message.error(reportErrorMessage(error));
        return;
      }
      modal.confirm({
        title: 'Bảng công chưa sẵn sàng để tính lương',
        content: <div className="space-y-2 text-sm text-slate-600"><p>{response.data.userMessage || response.data.message}</p><p>Phiên chờ duyệt, bị từ chối hoặc random check thất bại cần được đối soát. Xuất bất chấp cảnh báo là quyết định nghiệp vụ của HR và không tự sửa dữ liệu.</p></div>,
        okText: 'Vẫn xuất Excel',
        cancelText: 'Quay lại xử lý',
        okButtonProps: { danger: true },
        onOk: async () => {
          try { await exportFile(true); } catch (retryError) { message.error(reportErrorMessage(retryError)); }
        },
      });
    }
  };

  const columns: TableColumnsType<AttendanceHrMonthlyResponse> = [
    { title: 'Nhân viên', key: 'employee', width: 190, render: (_, row) => row.employeeName || row.employeeId },
    { title: 'Công trình', key: 'site', width: 170, render: (_, row) => row.siteName || row.siteId },
    { title: 'Ngày công', dataIndex: 'presentDays', width: 100 },
    { title: 'Tổng giờ', dataIndex: 'totalWorkMinutes', width: 135, render: (value, row) => <div><strong>{formatMinutes(value)}</strong>{row.totalOtMinutes > 0 && <div className="text-xs text-blue-600">gồm {formatMinutes(row.totalOtMinutes)} OT</div>}</div> },
    { title: 'Đi muộn', key: 'late', width: 140, render: (_, row) => row.lateDays ? `${row.lateDays} ngày · ${row.totalLateMinutes} phút` : '—' },
    { title: 'Về sớm', key: 'early', width: 140, render: (_, row) => row.earlyLeaveDays ? `${row.earlyLeaveDays} ngày · ${row.totalEarlyLeaveMinutes} phút` : '—' },
    { title: 'Thiếu check-out', dataIndex: 'missingCheckoutDays', width: 135, render: (value) => value ? <Tag color="error">{value} ngày</Tag> : '—' },
    { title: 'Cảnh báo trước payroll', key: 'warnings', width: 230, render: (_, row) => <div className="flex flex-wrap gap-1">{row.daysWithPendingReview > 0 && <Tag color="warning">Chờ duyệt {row.daysWithPendingReview}</Tag>}{row.daysWithRejectedSession > 0 && <Tag color="error">Từ chối {row.daysWithRejectedSession}</Tag>}{row.daysWithRandomCheckFailure > 0 && <Tag color="orange">Random check {row.daysWithRandomCheckFailure}</Tag>}{!row.daysWithPendingReview && !row.daysWithRejectedSession && !row.daysWithRandomCheckFailure && <Tag color="success">Sẵn sàng</Tag>}</div> },
  ];

  return <div className="space-y-5">
    <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-3">
      <BaseDatePicker aria-label="Chọn tháng báo cáo" picker="month" value={month} allowClear={false} onChange={(value) => { if (value && !Array.isArray(value)) { setMonth(value); setPage(0); } }} />
      <BaseSelect aria-label="Lọc báo cáo tháng theo công trình" allowClear placeholder="Toàn bộ công trình được phép xem" value={siteId} onChange={(value) => { setSiteId(value); setPage(0); }} options={(sitePage?.data?.content ?? []).map((site) => ({ value: site.id, label: site.name }))} />
      {canExport && <BaseButton type="primary" icon={<Download className="h-4 w-4" />} loading={exportMutation.isPending} onClick={() => void handleExport()}>Xuất Excel</BaseButton>}
    </div>
    {query.isError && <ReportError error={query.error} title="Không thể tải báo cáo công tháng" />}
    {warningRows > 0 && <Alert type="warning" showIcon title={`${warningRows} nhóm cảnh báo cần đối soát trước payroll`} description="Backend sẽ kiểm tra lại toàn bộ phạm vi khi xuất Excel; số liệu tổng giờ đã bao gồm OT." />}
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <StatCard title="Nhân viên" value={report?.totalEmployees ?? 0} icon={Users} loading={query.isLoading} />
      <StatCard title="Ngày công" value={report?.totalPresentDays ?? 0} icon={CalendarDays} tone="emerald" loading={query.isLoading} />
      <StatCard title="Tổng giờ" value={formatMinutes(report?.totalWorkMinutes ?? 0)} icon={Clock3} loading={query.isLoading} />
      <StatCard title="OT" value={formatMinutes(report?.totalOtMinutes ?? 0)} description="Đã nằm trong tổng giờ" icon={Clock3} tone="violet" loading={query.isLoading} />
      <StatCard title="Thiếu check-out" value={report?.totalMissingCheckoutDays ?? 0} icon={TimerOff} tone="amber" loading={query.isLoading} />
    </div>
    <DataTable ariaLabel="Báo cáo công theo tháng" columns={columns} data={report?.records.content ?? []} rowKey={(row) => `${row.employeeId}-${row.siteId}`} loading={query.isLoading} currentPage={page} pageSize={size} totalElements={report?.records.totalElements ?? 0} onPageChange={(nextPage, nextSize) => { setPage(nextPage); setSize(nextSize); }} scroll={{ x: 1300 }} emptyTitle="Chưa có dữ liệu công tháng" emptyDescription="Chọn tháng hoặc công trình khác để kiểm tra." />
  </div>;
}
