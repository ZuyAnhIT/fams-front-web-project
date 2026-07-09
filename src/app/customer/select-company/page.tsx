"use client";

import { useAuthStore } from "@/stores/auth.store";
import { CUSTOMER_ROUTES } from "@/constants/routes";
import { useRouter } from "next/navigation";
import { Building2, ArrowRight, ShieldCheck, Clock, Users } from "lucide-react";

export default function SelectCompanyPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  // Mock data 2 công ty
  const mockCompanies = [
    {
      id: "mock-tenant-1",
      name: "Công ty TNHH Vận tải & Logistics Sao Mai",
      role: "Quản trị viên (TENANT_ADMIN)",
      logoUrl: "https://ui-avatars.com/api/?name=Sao+Mai&background=0D8ABC&color=fff&size=128",
      employees: 120,
      sites: 15,
    },
    {
      id: "mock-tenant-2",
      name: "Cổ phần Xây dựng Hòa Bình",
      role: "Quản trị viên (TENANT_ADMIN)",
      logoUrl: "https://ui-avatars.com/api/?name=Hoa+Binh&background=F59E0B&color=fff&size=128",
      employees: 85,
      sites: 8,
    },
  ];

  const handleSelectCompany = (companyId: string) => {
    // Trong thực tế sẽ set lại tenantId vào store.
    // Ở đây mock thì chuyển thẳng đến Dashboard.
    localStorage.setItem("mock_company_selected", "true");
    router.push(CUSTOMER_ROUTES.DASHBOARD);
  };

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] p-8 bg-slate-50/50">
      <div className="max-w-5xl mx-auto">
        {/* Header Section */}
        <div className="mb-10 text-center sm:text-left">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Xin chào, {user?.displayName || "bạn"}!
          </h1>
          <p className="mt-4 text-lg text-slate-500 max-w-2xl">
            Tài khoản của bạn đang thuộc nhiều không gian làm việc. Vui lòng chọn một công ty để tiếp tục truy cập vào hệ thống.
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2">
          {mockCompanies.map((company) => (
            <div
              key={company.id}
              onClick={() => handleSelectCompany(company.id)}
              className="group relative flex flex-col bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden"
            >
              {/* Background gradient effect on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-brand-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <div className="relative flex items-start gap-4">
                {/* Logo */}
                <div className="flex-shrink-0">
                  <img
                    src={company.logoUrl}
                    alt={company.name}
                    className="w-16 h-16 rounded-xl border border-slate-100 shadow-sm object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold text-slate-900 truncate group-hover:text-brand-600 transition-colors">
                    {company.name}
                  </h3>
                  
                  <div className="mt-2 flex items-center gap-1.5 text-sm font-medium text-emerald-600 bg-emerald-50 w-fit px-2.5 py-1 rounded-full border border-emerald-100">
                    <ShieldCheck className="w-4 h-4" />
                    {company.role}
                  </div>
                </div>
              </div>

              {/* Stats/Details */}
              <div className="relative mt-6 pt-6 border-t border-slate-100 grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-slate-500 text-sm">
                  <div className="p-1.5 rounded-lg bg-slate-50 text-slate-400 group-hover:bg-brand-50 group-hover:text-brand-500 transition-colors">
                    <Users className="w-4 h-4" />
                  </div>
                  <span className="font-semibold text-slate-700">{company.employees}</span> nhân sự
                </div>
                <div className="flex items-center gap-2 text-slate-500 text-sm">
                  <div className="p-1.5 rounded-lg bg-slate-50 text-slate-400 group-hover:bg-brand-50 group-hover:text-brand-500 transition-colors">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <span className="font-semibold text-slate-700">{company.sites}</span> chi nhánh
                </div>
              </div>

              {/* Action Button */}
              <div className="relative mt-6 flex items-center justify-between">
                <span className="text-sm font-semibold text-brand-600 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                  Truy cập ngay
                </span>
                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-brand-600 group-hover:text-white transition-colors duration-300">
                  <ArrowRight className="w-5 h-5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
