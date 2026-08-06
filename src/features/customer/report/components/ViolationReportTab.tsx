'use client';

import { useMemo, useState } from 'react';
import { App, DatePicker, Progress, Tag, type TableColumnsType } from 'antd';
import dayjs from 'dayjs';
import Link from 'next/link';
import { AlertTriangle, CheckCircle2, Download, ShieldAlert, XCircle } from 'lucide-react';
import BaseButton from '@/components/ui/BaseButton';
import BaseSelect from '@/components/ui/BaseSelect';
import DataTable from '@/components/tables/DataTable';
import StatCard from '@/components/charts/StatCard';
import { CUSTOMER_ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/stores/auth.store';
import { useEmployees } from '@/features/customer/employee/hooks/use-employee';
import { useSitesQuery } from '@/features/customer/site/hooks/use-site';
import type { ViolationListItem, ViolationType } from '@/features/customer/violation/types/violation.type';
import { useExportViolationReport, useViolationReport } from '../hooks/use-report-search';
import type { ViolationReportParams } from '../types/report-search.type';
import { downloadBlob, ReportError, reportErrorMessage, SEVERITY_LABELS, VIOLATION_LABELS } from './report-utils';

const { RangePicker } = DatePicker;

function Breakdown({ title, rows }: { title: string; rows: { key: string; label: string; count: number }[] }) {
  const max = Math.max(1, ...rows.map((row) => row.count));
  return <section className="rounded-xl border border-slate-200 bg-white p-5"><h3 className="font-semibold text-slate-900">{title}</h3><div className="mt-4 space-y-3">{rows.map((row) => <div key={row.key}><div className="mb-1 flex justify-between gap-3 text-sm"><span className="truncate text-slate-600">{row.label}</span><strong>{row.count}</strong></div><Progress percent={Math.round(row.count * 100 / max)} showInfo={false} strokeColor={row.count ? '#f59e0b' : '#cbd5e1'} /></div>)}</div></section>;
}

export default function ViolationReportTab() {
  const { message } = App.useApp();
  const user = useAuthStore((state) => state.user);
  const tenantId = user?.tenantId ?? undefined;
  const canExport = user?.role === 'PLATFORM_ADMIN' || Boolean(user?.permissions?.includes('reports:export'));
  const [params, setParams] = useState<ViolationReportParams>({ from: dayjs().startOf('month').format('YYYY-MM-DD'), to: dayjs().endOf('month').format('YYYY-MM-DD'), page: 0, size: 20 });
  const query = useViolationReport(tenantId, params);
  const exportMutation = useExportViolationReport();
  const report = query.data;
  const { data: sitePage } = useSitesQuery({ tenantId, sortBy: 'name', sortDir: 'asc', page: 0, size: 100 });
  const { data: employeePage } = useEmployees({ page: 0, size: 100, sortBy: 'firstName', sortDir: 'asc' }, { enabled: Boolean(tenantId) });
  const sites = useMemo(() => sitePage?.data?.content ?? [], [sitePage?.data?.content]);
  const employees = useMemo(() => employeePage?.content ?? [], [employeePage?.content]);
  const siteNames = useMemo(() => new Map(sites.map((site) => [site.id, site.name])), [sites]);
  const employeeNames = useMemo(() => new Map(employees.map((employee) => [employee.id, employee.fullName || `${employee.lastName} ${employee.firstName}`])), [employees]);

  const typeRows = (Object.keys(VIOLATION_LABELS) as ViolationType[]).map((type) => ({ key: type, label: VIOLATION_LABELS[type], count: report?.byViolationType[type] ?? 0 }));
  const severityRows = (Object.keys(SEVERITY_LABELS) as (keyof typeof SEVERITY_LABELS)[]).map((severity) => ({ key: severity, label: SEVERITY_LABELS[severity], count: report?.bySeverity[severity] ?? 0 }));
  const siteRows = Object.entries(report?.bySite ?? {}).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id, count]) => ({ key: id, label: siteNames.get(id) || `Site ${id.slice(0, 8)}`, count }));
  const employeeRows = Object.entries(report?.byEmployee ?? {}).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id, count]) => ({ key: id, label: employeeNames.get(id) || `NV ${id.slice(0, 8)}`, count }));

  const handleExport = async () => {
    if (!tenantId) return;
    try {
      const blob = await exportMutation.mutateAsync({ tenantId, params });
      downloadBlob(blob, `ViPham_${params.from || 'all'}_${params.to || 'all'}.xlsx`);
      message.success('Đã xuất báo cáo vi phạm.');
    } catch (error) { message.error(reportErrorMessage(error)); }
  };

  const columns: TableColumnsType<ViolationListItem> = [
    { title: 'Ngày', dataIndex: 'checkDate', width: 110, render: (value) => dayjs(value).format('DD/MM/YYYY') },
    { title: 'Nhân viên', dataIndex: 'employeeId', render: (id) => employeeNames.get(id) || `NV ${String(id).slice(0, 8)}` },
    { title: 'Công trình', dataIndex: 'siteId', render: (id) => siteNames.get(id) || `Site ${String(id).slice(0, 8)}` },
    { title: 'Loại', dataIndex: 'violationType', width: 155, render: (value: ViolationType) => VIOLATION_LABELS[value] },
    { title: 'Xử lý', dataIndex: 'resolved', width: 115, render: (value) => value ? <Tag color="success">Đã xử lý</Tag> : <Tag color="warning">Chưa xử lý</Tag> },
    { title: 'Ảnh hưởng công', dataIndex: 'affectsAttendance', width: 135, render: (value) => value ? <Tag color="error">Có đánh dấu</Tag> : 'Không' },
    { title: 'Mô tả', dataIndex: 'description', ellipsis: true },
  ];

  return <div className="space-y-5">
    <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-2 xl:grid-cols-5">
      <RangePicker aria-label="Chọn kỳ báo cáo vi phạm" value={[params.from ? dayjs(params.from) : null, params.to ? dayjs(params.to) : null]} onChange={(_, values) => setParams((current) => ({ ...current, from: values[0] || undefined, to: values[1] || undefined, page: 0 }))} />
      <BaseSelect aria-label="Lọc vi phạm theo công trình" allowClear placeholder="Tất cả công trình" value={params.siteId} onChange={(siteId) => setParams((current) => ({ ...current, siteId, page: 0 }))} options={sites.map((site) => ({ value: site.id, label: site.name }))} />
      <BaseSelect aria-label="Lọc vi phạm theo nhân viên" showSearch optionFilterProp="label" allowClear placeholder="Tất cả nhân viên" value={params.employeeId} onChange={(employeeId) => setParams((current) => ({ ...current, employeeId, page: 0 }))} options={employees.map((employee) => ({ value: employee.id, label: employeeNames.get(employee.id) }))} />
      <BaseSelect aria-label="Lọc theo loại vi phạm" allowClear placeholder="Tất cả loại" value={params.violationType} onChange={(violationType) => setParams((current) => ({ ...current, violationType, page: 0 }))} options={Object.entries(VIOLATION_LABELS).map(([value, label]) => ({ value, label }))} />
      {canExport && <BaseButton type="primary" icon={<Download className="h-4 w-4" />} loading={exportMutation.isPending} onClick={() => void handleExport()}>Xuất Excel</BaseButton>}
    </div>
    {query.isError && <ReportError error={query.error} title="Không thể tải báo cáo vi phạm" />}
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard title="Tổng vi phạm" value={report?.totalViolations ?? 0} icon={AlertTriangle} tone="amber" loading={query.isLoading} />
      <StatCard title="Đã xử lý" value={report?.resolvedCount ?? 0} icon={CheckCircle2} tone="emerald" loading={query.isLoading} />
      <StatCard title="Chưa xử lý" value={report?.unresolvedCount ?? 0} icon={XCircle} tone="amber" loading={query.isLoading} href={`${CUSTOMER_ROUTES.VIOLATIONS}?resolved=false`} />
      <StatCard title="Ảnh hưởng bảng công" value={report?.affectsAttendanceCount ?? 0} icon={ShieldAlert} tone="violet" loading={query.isLoading} />
    </div>
    <div className="grid gap-4 lg:grid-cols-2"><Breakdown title="Theo loại vi phạm" rows={typeRows} /><Breakdown title="Theo mức độ nghiêm trọng" rows={severityRows} /><Breakdown title="Top công trình" rows={siteRows.length ? siteRows : [{ key: 'none', label: 'Chưa có dữ liệu', count: 0 }]} /><Breakdown title="Top nhân viên" rows={employeeRows.length ? employeeRows : [{ key: 'none', label: 'Chưa có dữ liệu', count: 0 }]} /></div>
    <div className="flex justify-end"><Link className="text-sm font-semibold text-blue-700" href={CUSTOMER_ROUTES.VIOLATIONS}>Mở màn xử lý vi phạm →</Link></div>
    <DataTable ariaLabel="Báo cáo vi phạm theo kỳ" columns={columns} data={report?.records.content ?? []} rowKey="id" loading={query.isLoading} currentPage={params.page ?? 0} pageSize={params.size ?? 20} totalElements={report?.records.totalElements ?? 0} onPageChange={(page, size) => setParams((current) => ({ ...current, page, size }))} scroll={{ x: 1050 }} emptyTitle="Không có vi phạm" emptyDescription="Không có dữ liệu phù hợp với kỳ và bộ lọc đã chọn." />
  </div>;
}
