"use client";

import RoleGuard from "@/components/guards/RoleGuard";
import { SystemRole } from "@/features/customer/auth/types/auth.type";
import { Tabs } from "antd";
import { useAuthStore } from "@/stores/auth.store";
import { useSearchParams } from "next/navigation";
import CheckinListTab from "@/features/customer/checkin/components/CheckinListTab";
import AttendanceSummaryTab from "@/features/customer/attendance/components/AttendanceSummaryTab";
import AttendanceMonthlyTab from "@/features/customer/attendance/components/AttendanceMonthlyTab";
export default function AttendancePage() {
  const searchParams = useSearchParams();
  const user = useAuthStore((state) => state.user);
  const isPlatformAdmin = user?.role === SystemRole.PLATFORM_ADMIN;
  const permissions = new Set(user?.permissions ?? []);
  const canListCheckins = isPlatformAdmin || permissions.has("checkins:list");
  const canListAttendance = isPlatformAdmin || permissions.has("attendance:list");

  const items = [
    canListCheckins && {
      key: "1",
      label: "Lịch sử Check-in",
      children: <CheckinListTab />,
    },
    canListAttendance && {
      key: "2",
      label: "Bảng công theo ngày",
      children: <AttendanceSummaryTab />,
    },
    canListAttendance && {
      key: "3",
      label: "Tổng hợp tháng",
      children: <AttendanceMonthlyTab />,
    },
  ].filter(Boolean) as Array<{
    key: string;
    label: string;
    children: React.ReactNode;
  }>;

  return (
    <RoleGuard
      allowedRoles={[SystemRole.PLATFORM_ADMIN]}
      allowedPermissions={["checkins:list", "attendance:list"]}
    >
      <div className="mx-auto w-full max-w-[1600px] space-y-6 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Quản lý chấm công</h1>
          <p className="mt-1 text-sm text-slate-600">Theo dõi lượt check-in, bảng công theo ngày và tổng hợp theo tháng.</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
          <Tabs defaultActiveKey={searchParams.get("tab") === "checkins" && canListCheckins ? "1" : items[0]?.key} items={items} />
        </div>
      </div>
    </RoleGuard>
  );
}
