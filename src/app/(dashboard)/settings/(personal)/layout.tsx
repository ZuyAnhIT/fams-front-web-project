"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, Shield, Lock, MonitorSmartphone } from "lucide-react";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const tabs = [
    { name: "Thông tin cá nhân", href: "/settings", icon: User },
    { name: "Đổi mật khẩu", href: "/settings/password", icon: Lock },
    { name: "Bảo mật 2 Lớp", href: "/settings/totp", icon: Shield },
    { name: "Thiết bị & Phiên", href: "/settings/sessions", icon: MonitorSmartphone },
  ];

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 md:px-0">
      <h2 className="text-2xl font-bold text-brand-950 mb-6">Cài đặt tài khoản</h2>

      <div className="flex flex-col md:flex-row gap-8 min-h-[600px]">
        {/* Sidebar Tabs */}
        <aside className="w-full md:w-60 flex-shrink-0 bg-white rounded-2xl shadow-sm border border-gray-300 p-4 h-fit">
          <nav className="flex flex-col gap-2">
            {tabs.map((tab) => {
              const isActive = pathname === tab.href;
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${isActive
                    ? "bg-brand-600 text-white shadow-md shadow-brand-500/20"
                    : "text-brand-700 hover:bg-brand-100 hover:text-brand-900"
                    }`}
                >
                  <tab.icon className={`w-5 h-5 ${isActive ? "text-white" : "text-brand-500"}`} />
                  {tab.name}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-300 p-8 md:p-12">
          {children}
        </main>
      </div>
    </div>
  );
}
