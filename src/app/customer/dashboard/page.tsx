"use client";

import { useAuthStore } from "@/stores/auth.store";
import { Users, MapPin, Clock, CalendarDays, Loader2, FileText } from "lucide-react";
import { useEmployees } from "@/features/customer/employee/hooks/use-employee";
import { SystemRole } from "@/features/customer/auth/types/auth.type";
import { formatVietnameseName } from "@/utils/name.util";

export default function DashboardPage() {
  const { user } = useAuthStore();
  const canViewEmployees = user?.role && [
    SystemRole.TENANT_ADMIN,
    SystemRole.HR_MANAGER,
    SystemRole.SITE_SUPERVISOR,
    SystemRole.PLATFORM_ADMIN,
  ].includes(user.role as SystemRole);

  const { data: employeesData, isLoading: isLoadingEmployees } = useEmployees({
    page: 0,
    size: 10,
    sortBy: "createdAt",
    sortDir: "desc",
  }, { enabled: !!canViewEmployees });
  
  const employees = employeesData?.content || [];

  const stats = [
    {
      title: "Tổng nhân viên",
      value: isLoadingEmployees ? "..." : (employeesData?.totalElements?.toString() || "0"),
      change: "Tổng số trên hệ thống",
      icon: Users,
      color: "from-blue-500 to-cyan-500",
      show: canViewEmployees
    },
    {
      title: "Công trình thực địa",
      value: "14",
      change: "Hoạt động ổn định",
      icon: MapPin,
      color: "from-emerald-500 to-teal-500",
      show: true
    },
    {
      title: "Ca làm việc đang chạy",
      value: "6",
      change: "Bình thường",
      icon: Clock,
      color: "from-amber-500 to-orange-500",
      show: true
    },
    {
      title: "Tỷ lệ chấm công đúng giờ",
      value: "97.6%",
      change: "+1.2% so với hôm qua",
      icon: CalendarDays,
      color: "from-rose-500 to-pink-500",
      show: true
    },
  ];

  // Chỉ lấy các stat được show
  const visibleStats = stats.filter(s => s.show);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Lời chào mừng */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-brand-950">
          Xin chào, {user?.displayName || "Người dùng"}! 👋
        </h1>
        <p className="text-brand-500 mt-1 text-sm md:text-base">
          Chào mừng quay trở lại hệ thống quản lý FAMS. Đây là tổng quan hoạt động ngày hôm nay.
        </p>
      </div>

      {/* Grid thẻ thống kê */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {visibleStats.map((stat, idx) => {
          const IconComponent = stat.icon;
          return (
            <div
              key={idx}
              className="p-6 rounded-2xl border border-brand-200/60 bg-white relative overflow-hidden group hover:border-brand-400 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 shadow-[0_4px_20px_rgba(0,0,0,0.02)]"
            >
              {/* Bóng sáng nền trang trí */}
              <div className={`absolute -right-8 -bottom-8 h-24 w-24 rounded-full bg-gradient-to-br ${stat.color} opacity-5 group-hover:scale-125 transition-transform duration-500 blur-xl`} />

              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-brand-500">{stat.title}</span>
                <div className={`p-2.5 rounded-xl bg-gradient-to-br ${stat.color} text-white shadow-lg`}>
                  <IconComponent className="h-5 w-5" />
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-extrabold text-brand-950 tracking-tight">{stat.value}</h3>
                <p className="text-xs text-brand-500 mt-1.5 font-medium flex items-center gap-1">
                  {stat.change}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bố cục nội dung chi tiết */}
      <div className="w-full">
        {/* Card danh sách nhân viên hoặc card mặc định cho USER */}
        {canViewEmployees ? (
        <div className="p-6 rounded-2xl border border-brand-200/60 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.02)] w-full space-y-4 flex flex-col h-[380px]">
          <div>
            <h2 className="text-lg font-semibold text-brand-950">Danh sách nhân viên mới nhất</h2>
            <p className="text-xs text-brand-500 mt-0.5">
              Những nhân viên vừa được thêm vào hệ thống trong thời gian gần đây.
            </p>
          </div>

          <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 scrollbar-thin scrollbar-thumb-brand-200">
            {isLoadingEmployees ? (
              <div className="h-full flex items-center justify-center text-brand-400">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : employees.length === 0 ? (
              <div className="h-full flex items-center justify-center text-brand-400 text-sm">
                Chưa có nhân viên nào trong hệ thống
              </div>
            ) : (
              employees.map((emp: any) => (
                <div
                  key={emp.id}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-brand-50/50 border border-brand-100 hover:border-brand-300 hover:bg-brand-50 transition-all duration-200"
                >
                  <div className="flex items-center gap-3">
                    {emp.avatarUrl ? (
                      <img src={emp.avatarUrl} alt="Avatar" className="h-9 w-9 rounded-full object-cover border border-brand-200" />
                    ) : (
                      <div className="h-9 w-9 rounded-full bg-blue-600/10 border border-blue-500/20 flex items-center justify-center font-bold text-blue-600 text-sm uppercase">
                        {emp.firstName ? emp.firstName.charAt(0) : "E"}
                      </div>
                    )}
                    <div>
                      <h4 className="font-semibold text-brand-950 text-sm leading-tight">{formatVietnameseName(emp.firstName, emp.lastName)}</h4>
                      <p className="text-xs text-brand-500 mt-0.5">{emp.email || emp.phone || emp.employeeCode || "Chưa cập nhật liên hệ"}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-semibold bg-brand-200 text-brand-800">
                      {emp.position || "Nhân viên"}
                    </span>
                    <p className="text-[10px] text-brand-400 font-medium mt-1">Phòng ban: {emp.department || "Chưa xếp"}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        ) : (
          <div className="p-6 rounded-2xl border border-brand-200/60 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.02)] w-full flex flex-col items-center justify-center text-center h-[380px]">
            <div className="h-20 w-20 rounded-full bg-brand-50 flex items-center justify-center mb-4">
              <FileText className="h-10 w-10 text-brand-300" />
            </div>
            <h2 className="text-xl font-semibold text-brand-950 mb-2">Chưa có thông báo mới</h2>
            <p className="text-sm text-brand-500 max-w-[300px]">
              Chào mừng bạn đến với FAMS. Hiện tại bạn chưa có lịch làm việc hoặc công việc cần xử lý.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
