'use client';

import { useState } from 'react';
import { Progress, Tag } from 'antd';
import dayjs from 'dayjs';
import { Building2, RefreshCw, UserMinus, Users } from 'lucide-react';
import BaseButton from '@/components/ui/BaseButton';
import BaseSelect from '@/components/ui/BaseSelect';
import StatCard from '@/components/charts/StatCard';
import { useAuthStore } from '@/stores/auth.store';
import { useSitesQuery } from '@/features/customer/site/hooks/use-site';
import { useSitePresenceReport } from '../hooks/use-report-search';
import { ReportError } from './report-utils';

export default function SitePresenceReportTab() {
  const tenantId = useAuthStore((state) => state.user?.tenantId ?? undefined);
  const [siteId, setSiteId] = useState<string>();
  const [page, setPage] = useState(0);
  const query = useSitePresenceReport(tenantId, { siteId, page, size: 20 });
  const report = query.data;
  const { data: sitePage } = useSitesQuery({ tenantId, status: 'active', sortBy: 'name', sortDir: 'asc', page: 0, size: 100 });

  return <div className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <BaseSelect className="min-w-64" aria-label="Lọc hiện diện theo công trình" allowClear placeholder="Toàn bộ công trình được phép xem" value={siteId} onChange={(value) => { setSiteId(value); setPage(0); }} options={(sitePage?.data?.content ?? []).map((site) => ({ value: site.id, label: site.name }))} />
      <div className="flex items-center gap-3"><span className="text-xs text-slate-500">{report?.reportedAt ? `Chụp lúc ${dayjs(report.reportedAt).format('HH:mm:ss DD/MM/YYYY')}` : 'Đang lấy snapshot...'}</span><BaseButton icon={<RefreshCw className="h-4 w-4" />} loading={query.isRefetching} onClick={() => void query.refetch()}>Làm mới</BaseButton></div>
    </div>
    {query.isError && <ReportError error={query.error} title="Không thể tải báo cáo hiện diện" />}
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard title="Công trình" value={report?.totalSites ?? 0} icon={Building2} loading={query.isLoading} />
      <StatCard title="Được phân công" value={report?.totalAssigned ?? 0} icon={Users} loading={query.isLoading} />
      <StatCard title="Đang có mặt" value={report?.totalPresent ?? 0} icon={Users} tone="emerald" loading={query.isLoading} />
      <StatCard title="Chưa có mặt" value={report?.totalAbsent ?? 0} icon={UserMinus} tone="amber" loading={query.isLoading} />
    </div>
    <div className="grid gap-4 xl:grid-cols-2">{(report?.sites.content ?? []).map((site) => {
      const percent = site.assignedCount ? Math.min(100, Math.round(site.presentCount * 100 / site.assignedCount)) : 0;
      return <section key={site.siteId} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold text-slate-900">{site.siteName}</h3><p className="mt-1 text-xs text-slate-500">{site.timezone}</p></div><Tag color={site.absentCount ? 'warning' : 'success'}>{site.presentCount}/{site.assignedCount} có mặt</Tag></div>
        <Progress className="mt-3" percent={percent} strokeColor="#16a34a" />
        <div className="mt-4"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Chưa có mặt ({site.absentCount})</p>{site.absentEmployees.length ? <div className="mt-2 flex flex-wrap gap-2">{site.absentEmployees.map((employee) => <Tag key={employee.employeeId} color="warning">{employee.employeeName}{employee.employeeCode ? ` · ${employee.employeeCode}` : ''}</Tag>)}</div> : <p className="mt-2 text-sm text-emerald-700">Tất cả nhân viên được phân công đã có mặt.</p>}</div>
      </section>;
    })}</div>
    {report && report.sites.totalPages > 1 && <div className="flex items-center justify-center gap-3"><BaseButton disabled={page <= 0} onClick={() => setPage((value) => value - 1)}>Trang trước</BaseButton><span className="text-sm text-slate-600">Trang {page + 1}/{report.sites.totalPages}</span><BaseButton disabled={page + 1 >= report.sites.totalPages} onClick={() => setPage((value) => value + 1)}>Trang sau</BaseButton></div>}
    {!query.isLoading && !query.isError && !report?.sites.content.length && <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">Không có công trình trong phạm vi được phép xem.</div>}
  </div>;
}
