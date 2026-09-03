'use client';

import { useMemo, useState } from 'react';
import { Alert, Progress, Spin, Tag } from 'antd';
import dayjs from 'dayjs';
import { AlertTriangle, Bell, Building2, CalendarCheck, Clock3, MapPin, ShieldAlert, Users } from 'lucide-react';
import Link from 'next/link';
import StatCard from '@/components/charts/StatCard';
import EmptyState from '@/components/feedback/EmptyState';
import { BaseSelect } from '@/components/ui';
import { CUSTOMER_ROUTES } from '@/constants/routes';
import { SystemRole } from '@/features/customer/auth/types/auth.type';
import { useSitesQuery } from '@/features/customer/site/hooks/use-site';
import { useAuthStore } from '@/stores/auth.store';
import { useEmployeeDashboard, useHrDashboard, useSupervisorDashboard } from '../hooks/use-dashboard';
import SupervisorCheckinMap from './SupervisorCheckinMap';

const CUSTOM_ROLE_SHORTCUTS = [
  { permissions: ['employees:list', 'employees:read'], title: 'Nhân viên', description: 'Xem hồ sơ nhân sự trong phạm vi được cấp.', href: CUSTOMER_ROUTES.EMPLOYEES, icon: Users, tone: 'blue' as const },
  { permissions: ['attendance:list', 'checkins:list'], title: 'Chấm công', description: 'Theo dõi dữ liệu chấm công được phép truy cập.', href: CUSTOMER_ROUTES.ATTENDANCE, icon: CalendarCheck, tone: 'emerald' as const },
  { permissions: ['sites:list', 'sites:read'], title: 'Công trình', description: 'Mở danh sách công trình trong phạm vi vai trò.', href: CUSTOMER_ROUTES.SITES, icon: MapPin, tone: 'violet' as const },
  { permissions: ['violations:list', 'violations:read'], title: 'Vi phạm', description: 'Xem và xử lý vi phạm theo quyền được giao.', href: CUSTOMER_ROUTES.VIOLATIONS, icon: AlertTriangle, tone: 'amber' as const },
  { permissions: ['reports:list'], title: 'Báo cáo', description: 'Mở trung tâm báo cáo nghiệp vụ.', href: CUSTOMER_ROUTES.REPORTS, icon: Building2, tone: 'blue' as const },
  { permissions: ['randomchecks:list', 'randomchecks:configure'], title: 'Kiểm tra ngẫu nhiên', description: 'Theo dõi lịch và cấu hình kiểm tra.', href: CUSTOMER_ROUTES.RANDOM_CHECKS, icon: ShieldAlert, tone: 'amber' as const },
] as const;

const VIOLATION_LABELS = {
  no_response: 'Không phản hồi',
  location_fail: 'Sai vị trí',
  face_fail: 'Face ID',
  liveness_fail: 'Liveness',
  face_verify_timeout: 'AI quá hạn',
} as const;

const CHECKIN_STATUS_LABELS = {
  valid: 'Hợp lệ',
  pending_review: 'Chờ HR duyệt',
  rejected: 'Không hợp lệ',
} as const;

function errorStatus(error: unknown) {
  return (error as { response?: { status?: number } }).response?.status;
}

function LoadingDashboard() {
  return <div className="flex min-h-[320px] items-center justify-center" role="status"><Spin size="large" /></div>;
}

/**
 * Surfaces the *actual* reason a dashboard query failed instead of always blaming a missing
 * permission. The most common real cause on a configured tenant is an IP allow-list the
 * caller's current network isn't in — which blocks every tenant-scoped endpoint, not just
 * this one — and the old copy ("chưa có quyền employees:list") pointed people the wrong way.
 */
function DashboardLoadError({ error, fallbackTitle }: { error: unknown; fallbackTitle: string }) {
  const response = (error as {
    response?: { status?: number; data?: { errorCode?: string; message?: string; userMessage?: string } };
  }).response;
  const code = response?.data?.errorCode;
  const status = response?.status;

  if (code === 'IP_NOT_WHITELISTED') {
    return (
      <Alert
        type="error"
        showIcon
        title="Địa chỉ IP hiện tại không được phép truy cập công ty này"
        description="Công ty này giới hạn truy cập theo địa chỉ IP. IP bạn đang dùng không nằm trong danh sách cho phép — hãy truy cập từ mạng nội bộ / VPN đã được duyệt, hoặc nhờ quản trị công ty thêm IP của bạn vào danh sách. Mọi trang nghiệp vụ của công ty này sẽ bị chặn cho tới khi đó."
      />
    );
  }
  if (code === 'TENANT_SUSPENDED' || response?.data?.message === 'Tenant account is suspended') {
    return (
      <Alert type="error" showIcon title="Công ty đang bị tạm ngưng"
        description="Truy cập dữ liệu nghiệp vụ của công ty này đang bị tạm ngưng. Liên hệ quản trị nền tảng để biết thêm chi tiết." />
    );
  }
  if (status === 403) {
    return (
      <Alert type="error" showIcon title="Không đủ quyền xem tổng quan"
        description="Vai trò của bạn tại công ty này không có quyền xem dashboard tổng quan (cần quyền employees:list). Nếu bạn vừa đổi công ty, hãy tải lại trang." />
    );
  }
  return (
    <Alert type="error" showIcon title={fallbackTitle}
      description={response?.data?.userMessage || response?.data?.message || 'Dữ liệu hiện không khả dụng. Vui lòng thử lại sau.'} />
  );
}

function HrDashboardView({ tenantId }: { tenantId: string }) {
  const [siteId, setSiteId] = useState<string>();
  const { data: sitePage } = useSitesQuery({ tenantId, page: 0, size: 100, sortBy: 'name', sortDir: 'asc' });
  const sites = useMemo(() => sitePage?.data?.content ?? [], [sitePage?.data?.content]);
  const query = useHrDashboard(tenantId, siteId);
  const data = query.data;
  if (query.isLoading) return <LoadingDashboard />;
  if (query.isError || !data) return <DashboardLoadError error={query.error} fallbackTitle="Không thể tải Dashboard HR" />;

  const types = Object.keys(VIOLATION_LABELS) as Array<keyof typeof VIOLATION_LABELS>;
  const maxViolation = Math.max(1, ...types.map((type) => data.violations.unresolvedByType[type] ?? 0));
  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <BaseSelect
          aria-label="Lọc theo công trình"
          placeholder="Toàn bộ công ty"
          allowClear
          showSearch
          optionFilterProp="label"
          className="w-full sm:w-64"
          value={siteId}
          onChange={setSiteId}
          options={sites.map((site) => ({ value: site.id, label: site.name }))}
        />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Tổng nhân viên" value={data.personnel.totalEmployees} description={`+${data.personnel.newThisMonth} trong tháng này`} icon={Users} href={CUSTOMER_ROUTES.EMPLOYEES} />
        <StatCard title="Có mặt hôm nay" value={data.attendance.presentToday} description={`${data.attendance.onSiteNow} người đang tại công trình · ${data.attendance.lateToday} đi muộn`} icon={CalendarCheck} tone="emerald" href={CUSTOMER_ROUTES.ATTENDANCE} />
        <StatCard title="Vi phạm chưa xử lý" value={data.violations.unresolved} description={`${data.violations.resolvedThisMonth} đã xử lý trong tháng`} icon={AlertTriangle} tone="amber" href={`${CUSTOMER_ROUTES.VIOLATIONS}?resolved=false`} />
        <StatCard title="Công trình" value={data.sites.totalSites} description={`${data.sites.employeesOnSiteNow} nhân viên đang có mặt`} icon={Building2} tone="violet" href={CUSTOMER_ROUTES.SITES} />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard title="Chờ HR duyệt" value={data.attendance.pendingReview} description="Check-in bị đánh dấu lỗi, chờ xử lý" icon={AlertTriangle} tone="amber" href={CUSTOMER_ROUTES.ATTENDANCE} />
        <StatCard title="Quên check-out hôm nay" value={data.attendance.missingCheckoutToday} description="Chưa kết thúc ca dù đã hết giờ" icon={Clock3} tone="amber" href={CUSTOMER_ROUTES.ATTENDANCE} />
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm" aria-labelledby="violation-overview-title">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><h2 id="violation-overview-title" className="text-lg font-semibold text-slate-900">Vi phạm đang chờ theo loại</h2><p className="mt-1 text-sm text-slate-500">Key không có trong response được hiển thị là 0.</p></div>
          <Link href={`${CUSTOMER_ROUTES.VIOLATIONS}?resolved=false`} className="text-sm font-semibold text-blue-700">Mở danh sách vi phạm</Link>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {types.map((type) => {
            const count = data.violations.unresolvedByType[type] ?? 0;
            return <div key={type} className="rounded-lg bg-slate-50 p-4"><div className="mb-2 flex items-center justify-between text-sm"><span className="font-medium text-slate-700">{VIOLATION_LABELS[type]}</span><strong>{count}</strong></div><Progress percent={Math.round((count / maxViolation) * 100)} showInfo={false} strokeColor={count ? '#f59e0b' : '#cbd5e1'} /></div>;
          })}
        </div>
      </section>
    </div>
  );
}

function SupervisorDashboardView({ tenantId }: { tenantId: string }) {
  const query = useSupervisorDashboard(tenantId);
  if (query.isLoading) return <LoadingDashboard />;
  if (query.isError) {
    if (errorStatus(query.error) === 404) {
      return <Alert type="error" showIcon title="Tài khoản chưa có hồ sơ nhân viên" description="Liên hệ HR để liên kết tài khoản với hồ sơ nhân viên trong công ty này." />;
    }
    return <DashboardLoadError error={query.error} fallbackTitle="Không thể tải hiện trường" />;
  }
  const sites = query.data?.supervisedSites ?? [];
  if (!sites.length) return <EmptyState title="Chưa có công trình cần giám sát hôm nay" description="Khi assignment supervisor có hiệu lực, công trình và danh sách người đang có mặt sẽ xuất hiện tại đây." />;

  return <div className="grid gap-5 xl:grid-cols-2">{sites.map((site) => {
    const attendanceRate = site.expectedToday > 0 ? Math.min(100, Math.round(site.onSiteNow * 100 / site.expectedToday)) : 0;
    return <section key={site.siteId} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 p-5"><div className="flex items-start justify-between gap-4"><div><h2 className="flex items-center gap-2 font-semibold text-slate-900"><MapPin className="h-4 w-4 text-blue-600" />{site.siteName}</h2><p className="mt-1 text-sm text-slate-500">{site.onSiteNow}/{site.expectedToday} nhân viên đang có mặt</p></div><Tag color="processing">Số liệu làm mới mỗi phút</Tag></div><Progress className="mt-3" percent={attendanceRate} strokeColor="#2563eb" /><div className="mt-3 flex flex-wrap gap-2">{site.randomCheckPending > 0 && <Tag icon={<AlertTriangle className="h-3 w-3" />} color="orange">{site.randomCheckPending} random check chờ phản hồi</Tag>}{site.unresolvedViolations > 0 && <Tag icon={<ShieldAlert className="h-3 w-3" />} color="error">{site.unresolvedViolations} vi phạm chưa xử lý</Tag>}</div></div>
      <SupervisorCheckinMap site={site} />
      <div className="p-5"><h3 className="mb-3 text-sm font-semibold text-slate-700">Đang có mặt</h3>{site.onSiteEmployees.length ? <div className="space-y-2">{site.onSiteEmployees.map((employee) => <div key={employee.employeeId} className="flex items-center gap-3 rounded-lg bg-slate-50 p-3"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-700">{(employee.lastName || employee.firstName || 'N').charAt(0)}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-800">{employee.lastName} {employee.firstName}</p><p className="text-xs text-slate-500">{employee.employeeCode || 'Chưa có mã'} · vào {dayjs(employee.checkInAt).format('HH:mm')}</p>{employee.checkInLat != null && employee.checkInLon != null && <p className="mt-1 text-xs text-amber-700">Vị trí lúc check-in {dayjs(employee.checkInAt).format('HH:mm DD/MM/YYYY')} · {employee.checkInLat.toFixed(5)}, {employee.checkInLon.toFixed(5)}</p>}</div></div>)}</div> : <p className="text-sm text-slate-500">Chưa có nhân viên check-in hôm nay.</p>}</div>
    </section>;
  })}</div>;
}

function EmployeeDashboardView({ tenantId }: { tenantId: string }) {
  const query = useEmployeeDashboard(tenantId);
  if (query.isLoading) return <LoadingDashboard />;
  if (query.isError || !query.data) {
    if (errorStatus(query.error) === 404) {
      return <Alert type="error" showIcon title="Không thể tải Dashboard nhân viên" description="Tài khoản có thể chưa được liên kết với hồ sơ nhân viên trong công ty này." />;
    }
    return <DashboardLoadError error={query.error} fallbackTitle="Không thể tải Dashboard nhân viên" />;
  }
  const data = query.data;
  return <div className="space-y-6">
    {(data.alerts.pendingExplanations > 0 || data.alerts.unreadNotifications > 0) && <div className="grid gap-3 sm:grid-cols-2"><Link href={CUSTOMER_ROUTES.EXCEPTIONS} className="rounded-xl border border-amber-200 bg-amber-50 p-4"><strong className="text-amber-900">{data.alerts.pendingExplanations} mục cần giải thích</strong><p className="mt-1 text-sm text-amber-700">Bổ sung thông tin cho HR</p></Link><Link href={CUSTOMER_ROUTES.NOTIFICATIONS} className="rounded-xl border border-blue-200 bg-blue-50 p-4"><strong className="text-blue-900">{data.alerts.unreadNotifications} thông báo chưa đọc</strong><p className="mt-1 text-sm text-blue-700">Mở hộp thư thông báo</p></Link></div>}
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"><StatCard title="Ca hôm nay" value={data.todayShifts.length} description={data.todayShifts[0]?.siteName || 'Chưa có phân công'} icon={Clock3} /><StatCard title="Trạng thái chấm công" value={data.checkin ? `${data.checkin.open ? 'Đang trong ca' : 'Đã kết thúc'} · ${CHECKIN_STATUS_LABELS[data.checkin.status]}` : 'Chưa check-in'} icon={CalendarCheck} tone="emerald" href={CUSTOMER_ROUTES.ATTENDANCE} /><StatCard title="Ngày công tháng" value={data.monthlyAttendance.presentDays} description={`${data.monthlyAttendance.totalWorkMinutes} phút · OT ${data.monthlyAttendance.totalOtMinutes} phút`} icon={CalendarCheck} tone="violet" href={CUSTOMER_ROUTES.ATTENDANCE} /><StatCard title="Cần xử lý" value={data.alerts.pendingExplanations} description={`${data.alerts.unreadNotifications} thông báo chưa đọc`} icon={Bell} tone="amber" href={CUSTOMER_ROUTES.EXCEPTIONS} /></div>
  </div>;
}

function CustomRoleDashboardView({ permissions }: { permissions: string[] }) {
  const shortcuts = CUSTOM_ROLE_SHORTCUTS.filter((shortcut) =>
    shortcut.permissions.some((permission) => permissions.includes(permission)),
  );

  if (!shortcuts.length) {
    return (
      <EmptyState
        title="Vai trò chưa có module nghiệp vụ"
        description="Bạn vẫn có thể quản lý hồ sơ, bảo mật tài khoản và xem thông báo. Liên hệ quản trị công ty nếu cần thêm quyền."
        action={<Link className="font-semibold text-blue-700" href={CUSTOMER_ROUTES.NOTIFICATIONS}>Mở thông báo</Link>}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {shortcuts.map((shortcut) => (
        <StatCard
          key={shortcut.href}
          title={shortcut.title}
          value="Mở"
          description={shortcut.description}
          href={shortcut.href}
          icon={shortcut.icon}
          tone={shortcut.tone}
        />
      ))}
    </div>
  );
}

export default function CustomerDashboard() {
  const user = useAuthStore((state) => state.user);
  const tenantId = user?.tenantId || '';
  const role = user?.role;
  const permissions = user?.permissions ?? [];
  const isHr = role === SystemRole.TENANT_ADMIN || role === SystemRole.HR_MANAGER;
  const isSupervisor = role === SystemRole.SITE_SUPERVISOR;
  const isEmployee = role === SystemRole.EMPLOYEE;

  return <div className="mx-auto w-full max-w-[1600px] space-y-6"><header><p className="text-sm font-medium text-blue-700">Tổng quan theo vai trò</p><h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">Xin chào, {user?.displayName || 'bạn'}</h1><p className="mt-2 text-sm text-slate-600">Số liệu hôm nay được backend tính theo múi giờ công ty/công trình.</p></header>{!tenantId ? <Alert type="warning" showIcon title="Chưa chọn công ty làm việc" description={<span>Chọn một công ty trước khi mở dữ liệu nghiệp vụ. <Link className="font-semibold text-blue-700" href={CUSTOMER_ROUTES.SELECT_COMPANY}>Đi đến màn chọn công ty</Link>.</span>} /> : isSupervisor ? <SupervisorDashboardView tenantId={tenantId} /> : isHr ? <HrDashboardView tenantId={tenantId} /> : isEmployee ? <EmployeeDashboardView tenantId={tenantId} /> : <CustomRoleDashboardView permissions={permissions} />}</div>;
}
