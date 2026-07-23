"use client";

import Link from "next/link";
import { ArrowRight, Building2, CreditCard, ShieldCheck } from "lucide-react";
import RoleGuard from "@/components/guards/RoleGuard";
import { ADMIN_ROUTES } from "@/constants/routes";
import { SystemRole } from "@/features/customer/auth/types/auth.type";
import { useAuthStore } from "@/stores/auth.store";

const MANAGEMENT_AREAS = [
  {
    title: "Quản lý công ty",
    description: "Theo dõi hồ sơ, trạng thái hoạt động, bảo mật và gói dịch vụ của từng công ty.",
    href: ADMIN_ROUTES.TENANTS,
    icon: Building2,
  },
  {
    title: "Gói dịch vụ",
    description: "Thiết lập gói, giới hạn sử dụng và chính sách áp dụng trên toàn nền tảng.",
    href: ADMIN_ROUTES.PLANS,
    icon: CreditCard,
  },
  {
    title: "Vai trò và quyền",
    description: "Kiểm soát quyền truy cập hệ thống theo vai trò và phạm vi quản trị.",
    href: ADMIN_ROUTES.ROLES,
    icon: ShieldCheck,
  },
];

export default function AdminDashboardPage() {
  const user = useAuthStore((state) => state.user);

  return (
    <RoleGuard allowedRoles={[SystemRole.PLATFORM_ADMIN]}>
      <div className="mx-auto w-full max-w-[1600px] space-y-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <p className="text-sm font-semibold text-blue-700">Quản trị nền tảng</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Xin chào, {user?.displayName || "Quản trị viên"}
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
            Quản lý công ty, gói dịch vụ và quyền truy cập từ một không gian tập trung. Các chỉ số tổng hợp sẽ chỉ hiển thị khi có API thống kê nền tảng chính thức.
          </p>
        </section>

        <section aria-labelledby="management-heading">
          <div className="mb-4">
            <h2 id="management-heading" className="text-lg font-semibold text-slate-900">
              Khu vực quản trị
            </h2>
            <p className="mt-1 text-sm text-slate-500">Chọn một khu vực để tiếp tục công việc.</p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {MANAGEMENT_AREAS.map((area) => {
              const Icon = area.icon;
              return (
                <Link
                  key={area.href}
                  href={area.href}
                  className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-blue-300 hover:bg-blue-50/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 ring-1 ring-blue-100">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <ArrowRight className="h-5 w-5 text-slate-300 transition-transform group-hover:translate-x-1 group-hover:text-blue-600" aria-hidden="true" />
                  </div>
                  <h3 className="mt-5 text-base font-semibold text-slate-900">{area.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{area.description}</p>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </RoleGuard>
  );
}
