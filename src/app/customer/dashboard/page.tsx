"use client";

import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CalendarCheck,
  MapPin,
  Network,
  Settings,
  Users,
} from "lucide-react";
import StatCard from "@/components/charts/StatCard";
import EmptyState from "@/components/feedback/EmptyState";
import { CUSTOMER_ROUTES } from "@/constants/routes";
import { SystemRole } from "@/features/customer/auth/types/auth.type";
import { useEmployees } from "@/features/customer/employee/hooks/use-employee";
import { useAuthStore } from "@/stores/auth.store";
import { formatVietnameseName } from "@/utils/name.util";

const ROLE_LABELS: Record<SystemRole, string> = {
  [SystemRole.PLATFORM_ADMIN]: "Quản trị nền tảng",
  [SystemRole.PLATFORM_STAFF]: "Nhân viên nền tảng",
  [SystemRole.TENANT_ADMIN]: "Quản trị công ty",
  [SystemRole.HR_MANAGER]: "Quản lý nhân sự",
  [SystemRole.SITE_SUPERVISOR]: "Giám sát công trình",
  [SystemRole.EMPLOYEE]: "Nhân viên",
};

export default function CustomerDashboardPage() {
  const user = useAuthStore((state) => state.user);
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const role = user?.role;
  const canViewEmployees = Boolean(role && [
    SystemRole.TENANT_ADMIN,
    SystemRole.HR_MANAGER,
    SystemRole.SITE_SUPERVISOR,
  ].includes(role));

  const { data: employeesData, isLoading } = useEmployees(
    { page: 0, size: 6, sortBy: "createdAt", sortDir: "desc" },
    { enabled: Boolean(canViewEmployees && user?.tenantId) }
  );
  const employees = employeesData?.content || [];

  const quickActions = [
    canViewEmployees && {
      title: "Nhân viên",
      description: "Tra cứu hồ sơ và trạng thái nhân sự",
      href: CUSTOMER_ROUTES.EMPLOYEES,
      icon: Users,
    },
    role && [SystemRole.TENANT_ADMIN, SystemRole.HR_MANAGER].includes(role) && {
      title: "Cơ cấu tổ chức",
      description: "Quản lý phòng ban và đội nhóm",
      href: CUSTOMER_ROUTES.WORKSPACES,
      icon: Network,
    },
    role && [SystemRole.TENANT_ADMIN, SystemRole.HR_MANAGER, SystemRole.SITE_SUPERVISOR].includes(role) && {
      title: "Chấm công",
      description: "Xem lịch sử và bảng công tổng hợp",
      href: CUSTOMER_ROUTES.ATTENDANCE,
      icon: CalendarCheck,
    },
    (hasPermission("sites:list") || hasPermission("sites:read")) && {
      title: "Công trình",
      description: "Theo dõi địa điểm và vùng chấm công",
      href: CUSTOMER_ROUTES.SITES,
      icon: MapPin,
    },
    role === SystemRole.TENANT_ADMIN && {
      title: "Cấu hình công ty",
      description: "Cập nhật hồ sơ và chính sách truy cập",
      href: CUSTOMER_ROUTES.TENANT_SETTINGS,
      icon: Building2,
    },
    role === SystemRole.EMPLOYEE && {
      title: "Tài khoản của tôi",
      description: "Cập nhật thông tin và bảo mật tài khoản",
      href: CUSTOMER_ROUTES.SETTINGS,
      icon: Settings,
    },
  ].filter((item): item is Exclude<typeof item, false | undefined> => Boolean(item));

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6">
      <section>
        <p className="text-sm font-medium text-slate-500">
          {role ? ROLE_LABELS[role] : "Không gian làm việc"}
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Xin chào, {user?.displayName || "bạn"}
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Đây là các thông tin và lối tắt phù hợp với phạm vi công việc của bạn.
        </p>
      </section>

      {canViewEmployees && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Tổng nhân viên"
            value={employeesData?.totalElements ?? 0}
            description="Dữ liệu nhân sự hiện tại"
            icon={Users}
            href={CUSTOMER_ROUTES.EMPLOYEES}
            loading={isLoading}
          />
        </div>
      )}

      <section aria-labelledby="quick-actions-heading">
        <div className="mb-4">
          <h2 id="quick-actions-heading" className="text-lg font-semibold text-slate-900">Truy cập nhanh</h2>
          <p className="mt-1 text-sm text-slate-500">Các khu vực bạn thường sử dụng.</p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.href}
                href={action.href}
                className="group flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-blue-300 hover:bg-blue-50/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700 group-hover:bg-blue-100 group-hover:text-blue-700">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-slate-900">{action.title}</span>
                  <span className="mt-0.5 block text-sm text-slate-500">{action.description}</span>
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 text-slate-300 transition-transform group-hover:translate-x-1 group-hover:text-blue-600" aria-hidden="true" />
              </Link>
            );
          })}
        </div>
      </section>

      {canViewEmployees && (
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm" aria-labelledby="recent-employees-heading">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4 sm:px-5">
            <div>
              <h2 id="recent-employees-heading" className="font-semibold text-slate-900">Nhân viên mới cập nhật</h2>
              <p className="mt-0.5 text-xs text-slate-500">Danh sách hồ sơ gần nhất.</p>
            </div>
            <Link href={CUSTOMER_ROUTES.EMPLOYEES} className="text-sm font-semibold text-blue-700 hover:text-blue-800">
              Xem tất cả
            </Link>
          </div>

          {isLoading ? (
            <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-3" role="status" aria-label="Đang tải nhân viên">
              {[1, 2, 3].map((item) => <div key={item} className="h-20 animate-pulse rounded-lg bg-slate-100" />)}
            </div>
          ) : employees.length === 0 ? (
            <EmptyState compact title="Chưa có nhân viên" description="Hồ sơ nhân viên mới sẽ xuất hiện tại đây." />
          ) : (
            <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-3">
              {employees.map((employee) => (
                <Link
                  key={employee.id}
                  href={`${CUSTOMER_ROUTES.EMPLOYEES}/${employee.id}`}
                  className="flex min-w-0 items-center gap-3 rounded-lg border border-slate-100 p-3 transition-colors hover:border-blue-200 hover:bg-blue-50/30"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 font-semibold text-blue-700">
                    {(employee.lastName || employee.firstName || "N").charAt(0).toUpperCase()}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-slate-900">
                      {formatVietnameseName(employee.firstName, employee.lastName)}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-slate-500">
                      {employee.position || employee.department || employee.email || "Chưa cập nhật vị trí"}
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
