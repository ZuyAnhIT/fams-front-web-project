"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, Shield, Lock, MonitorSmartphone, ShieldCheck } from "lucide-react";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const tabs = [
    { name: "Thông tin cá nhân", href: "/customer/settings", icon: User },
    { name: "Đổi mật khẩu", href: "/customer/settings/password", icon: Lock },
    { name: "Bảo mật 2 Lớp", href: "/customer/settings/totp", icon: Shield },
    { name: "Thiết bị & Phiên", href: "/customer/settings/sessions", icon: MonitorSmartphone },
    { name: "Quyền của tôi", href: "/customer/settings/permissions", icon: ShieldCheck },
  ];

  return (
    <div className="mx-auto max-w-6xl py-1">
      <h1 className="mb-5 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Cài đặt tài khoản</h1>

      <div className="flex flex-col gap-5 md:min-h-[600px] md:flex-row md:gap-8">
        {/* Sidebar Tabs */}
        <aside className="h-fit w-full flex-shrink-0 rounded-xl border border-slate-200 bg-white p-2 shadow-sm md:w-60 md:p-3">
          <nav className="flex gap-2 overflow-x-auto pb-1 md:flex-col md:overflow-visible md:pb-0" aria-label="Cài đặt tài khoản">
            {tabs.map((tab) => {
              const isActive = pathname === tab.href;
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`flex min-h-11 shrink-0 items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors md:w-full md:gap-3 md:px-4 ${isActive
                    ? "bg-brand-50 text-brand-900 shadow-sm border border-brand-100"
                    : "text-brand-700 hover:bg-brand-50 hover:text-brand-900"
                    }`}
                >
                  <tab.icon className={`h-5 w-5 shrink-0 ${isActive ? "text-brand-700" : "text-brand-500"}`} aria-hidden="true" />
                  {tab.name}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 md:p-8 lg:p-10">
          {children}
        </main>
      </div>
    </div>
  );
}
