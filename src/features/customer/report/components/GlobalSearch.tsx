'use client';

import { useState } from 'react';
import { Empty, Input, Popover, Spin } from 'antd';
import { Building2, Clock3, Search, UserRound } from 'lucide-react';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import { useDebounce } from '@/hooks/useDebounce';
import { useAuthStore } from '@/stores/auth.store';
import { formatVietnameseName } from '@/utils/name.util';
import { useGlobalSearch } from '../hooks/use-report-search';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function ResultButton({ icon, title, detail, onClick }: { icon: React.ReactNode; title: string; detail: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="flex w-full items-start gap-3 rounded-lg px-3 py-2 text-left hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"><span className="mt-0.5 text-slate-400">{icon}</span><span className="min-w-0"><span className="block truncate text-sm font-medium text-slate-800">{title}</span><span className="block truncate text-xs text-slate-500">{detail}</span></span></button>;
}

export default function GlobalSearch() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [value, setValue] = useState('');
  const [focused, setFocused] = useState(false);
  const queryText = useDebounce(value.trim(), 300);
  const canSearch = user?.role === 'PLATFORM_ADMIN' || user?.permissions?.includes('employees:list');
  const query = useGlobalSearch(user?.tenantId || undefined, canSearch ? queryText : '', 5);
  if (!user?.tenantId || !canSearch) return null;
  const data = query.data;
  const isCheckinIdSearch = UUID_PATTERN.test(queryText);
  const total = (data?.employees.length ?? 0) + (data?.sites.length ?? 0) + (data?.checkins.length ?? 0);
  const navigate = (path: string) => { setFocused(false); setValue(''); router.push(path); };
  const content = <div className="max-h-[65vh] w-[min(420px,calc(100vw-32px))] overflow-y-auto p-1">
    {value.trim().length < 2 ? <p className="p-4 text-center text-sm text-slate-500">Nhập ít nhất 2 ký tự để tìm kiếm.</p> : query.isLoading ? <div className="flex justify-center p-6"><Spin /></div> : query.isError ? <p className="p-4 text-center text-sm text-red-600">Không thể tìm kiếm trong phạm vi hiện tại.</p> : total === 0 ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Không có kết quả" /> : <div className="space-y-3">
      {Boolean(data?.employees.length) && <section><h3 className="px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Nhân viên</h3>{data?.employees.map((employee) => <ResultButton key={employee.id} icon={<UserRound className="h-4 w-4" />} title={formatVietnameseName(employee.firstName, employee.lastName)} detail={[employee.employeeCode, employee.email, employee.department].filter(Boolean).join(' · ')} onClick={() => navigate(`/customer/employees/${employee.id}`)} />)}</section>}
      {Boolean(data?.sites.length) && <section><h3 className="px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Công trình</h3>{data?.sites.map((site) => <ResultButton key={site.id} icon={<Building2 className="h-4 w-4" />} title={site.name} detail={[site.code, site.address].filter(Boolean).join(' · ')} onClick={() => navigate(`/customer/sites/${site.id}`)} />)}</section>}
      {Boolean(data?.checkins.length) && <section><h3 className="px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-400">{isCheckinIdSearch ? 'Check-in theo mã' : 'Check-in gần đây'}</h3>{data?.checkins.map((checkin) => <ResultButton key={checkin.id} icon={<Clock3 className="h-4 w-4" />} title={checkin.employeeName || checkin.employeeCode || 'Lượt chấm công'} detail={`${checkin.siteName || 'Công trình'} · ${checkin.checkInAt ? dayjs(checkin.checkInAt).format('DD/MM HH:mm') : 'Chưa có giờ vào'} · ${checkin.id}`} onClick={() => navigate(`/customer/attendance?tab=checkins&checkinId=${checkin.id}`)} />)}</section>}
    </div>}
  </div>;
  return <Popover open={focused} onOpenChange={setFocused} trigger="click" placement="bottom" content={content}><Input value={value} onChange={(event) => setValue(event.target.value)} onFocus={() => setFocused(true)} allowClear prefix={<Search className="h-4 w-4 text-slate-400" />} placeholder="Tên, site hoặc mã check-in UUID..." aria-label="Tìm kiếm nhanh toàn hệ thống" className="hidden w-64 lg:flex xl:w-80" /></Popover>;
}
