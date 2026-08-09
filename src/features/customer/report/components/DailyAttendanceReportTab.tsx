'use client';

import { useState } from 'react';
import { Collapse, Tag, type TableColumnsType } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { CalendarCheck, Clock3, LogOut, TimerOff, UserMinus, Users } from 'lucide-react';
import BaseDatePicker from '@/components/ui/BaseDatePicker';
import BaseSelect from '@/components/ui/BaseSelect';
import DataTable from '@/components/tables/DataTable';
import StatCard from '@/components/charts/StatCard';
import { useAuthStore } from '@/stores/auth.store';
import { useSitesQuery } from '@/features/customer/site/hooks/use-site';
import type { AttendanceSummaryResponse } from '@/features/customer/attendance/types/attendance.type';
import { useDailyAttendanceReport } from '../hooks/use-report-search';
import type { DailyAttendanceReportParams } from '../types/report-search.type';
import { formatMinutes, ReportError } from './report-utils';

export default function DailyAttendanceReportTab() {
  const tenantId = useAuthStore((state) => state.user?.tenantId ?? undefined);
  const [date, setDate] = useState<Dayjs>(dayjs());
  const [siteId, setSiteId] = useState<string>();
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const params: DailyAttendanceReportParams = { date: date.format('YYYY-MM-DD'), siteId, page, size };
  const query = useDailyAttendanceReport(tenantId, params);
  const report = query.data;
  const { data: sitePage } = useSitesQuery({ tenantId, status: 'active', sortBy: 'name', sortDir: 'asc', page: 0, size: 100 });

  const columns: TableColumnsType<AttendanceSummaryResponse> = [
    { title: 'Nhân viên', key: 'employee', render: (_, row) => row.employeeName || row.employeeId },
    { title: 'Công trình', key: 'site', render: (_, row) => row.siteName || row.siteId },
    { title: 'Vào', dataIndex: 'firstCheckinAt', width: 95, render: (value) => value ? dayjs(value).format('HH:mm') : '—' },
    { title: 'Ra', dataIndex: 'lastCheckoutAt', width: 95, render: (value) => value ? dayjs(value).format('HH:mm') : '—' },
    { title: 'Giờ làm / OT', key: 'work', width: 170, render: (_, row) => <div><span>{formatMinutes(row.totalWorkMinutes)}</span>{row.otMinutes > 0 && <div className="text-xs text-blue-600">gồm {formatMinutes(row.otMinutes)} OT</div>}{row.otDailyLimitExceeded && <Tag color="warning">Vượt OT ngày</Tag>}{row.otWeeklyLimitExceeded && <Tag color="warning">Vượt OT tuần</Tag>}</div> },
    { title: 'Đi muộn', dataIndex: 'lateMinutes', width: 110, render: (value) => value > 0 ? <Tag color="warning">{value} phút</Tag> : '—' },
    { title: 'Về sớm', dataIndex: 'earlyLeaveMinutes', width: 110, render: (value) => value > 0 ? <Tag color="warning">{value} phút</Tag> : '—' },
    { title: 'Trạng thái', key: 'status', width: 150, render: (_, row) => row.missingCheckout ? <Tag color="error">Thiếu check-out</Tag> : <Tag color="success">Có mặt</Tag> },
  ];

  return <div className="space-y-5">
    <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-2">
      <BaseDatePicker aria-label="Chọn ngày báo cáo" value={date} allowClear={false} onChange={(value) => { if (value && !Array.isArray(value)) { setDate(value); setPage(0); } }} />
      <BaseSelect aria-label="Lọc báo cáo ngày theo công trình" allowClear placeholder="Toàn bộ công trình được phép xem" value={siteId} onChange={(value) => { setSiteId(value); setPage(0); }} options={(sitePage?.data?.content ?? []).map((site) => ({ value: site.id, label: site.name }))} />
    </div>
    {query.isError && <ReportError error={query.error} title="Không thể tải báo cáo công ngày" />}
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
      <StatCard title="Có mặt" value={report?.totalPresent ?? 0} icon={Users} tone="emerald" loading={query.isLoading} />
      <StatCard title="Vắng mặt" value={report?.totalAbsent ?? 0} icon={UserMinus} tone="amber" loading={query.isLoading} />
      <StatCard title="Đi muộn" value={report?.totalLate ?? 0} icon={Clock3} tone="amber" loading={query.isLoading} />
      <StatCard title="Về sớm" value={report?.totalEarlyLeave ?? 0} icon={LogOut} tone="amber" loading={query.isLoading} />
      <StatCard title="Thiếu check-out" value={report?.totalMissingCheckout ?? 0} icon={TimerOff} tone="violet" loading={query.isLoading} />
      <StatCard title="Tổng giờ" value={formatMinutes(report?.totalWorkMinutes ?? 0)} description={`Đã gồm ${formatMinutes(report?.totalOtMinutes ?? 0)} OT`} icon={CalendarCheck} loading={query.isLoading} />
    </div>
    {!!report?.absentEmployees.length && <Collapse items={[{ key: 'absent', label: `${report.totalAbsent} nhân viên chưa có bản ghi chấm công`, children: <div className="flex flex-wrap gap-2">{report.absentEmployees.map((employee) => <Tag key={employee.employeeId} color="warning">{employee.employeeName}{employee.employeeCode ? ` · ${employee.employeeCode}` : ''}</Tag>)}</div> }]} />}
    <DataTable ariaLabel="Báo cáo công theo ngày" columns={columns} data={report?.records.content ?? []} rowKey="id" loading={query.isLoading} currentPage={page} pageSize={size} totalElements={report?.records.totalElements ?? 0} onPageChange={(nextPage, nextSize) => { setPage(nextPage); setSize(nextSize); }} scroll={{ x: 1000 }} emptyTitle="Chưa có dữ liệu công" emptyDescription="Không có bản ghi chấm công phù hợp ngày và công trình đã chọn." />
  </div>;
}
