import RoleGuard from "@/components/guards/RoleGuard";
import { SystemRole } from "@/features/customer/auth/types/auth.type";
import { Tabs } from "antd";
import CheckinListTab from "@/features/customer/checkin/components/CheckinListTab";
import AttendanceSummaryTab from "@/features/customer/attendance/components/AttendanceSummaryTab";
import AttendanceMonthlyTab from "@/features/customer/attendance/components/AttendanceMonthlyTab";
export default function AttendancePage() {
  const items = [
    {
      key: "1",
      label: "Lịch sử Check-in",
      children: <CheckinListTab />,
    },
    {
      key: "2",
      label: "Bảng công tổng hợp",
      children: <AttendanceSummaryTab />,
    },
    {
      key: "3",
      label: "Bảng công tháng",
      children: <AttendanceMonthlyTab />,
    },
  ];

  return (
    <RoleGuard allowedRoles={[SystemRole.TENANT_ADMIN, SystemRole.HR_MANAGER, SystemRole.SITE_SUPERVISOR, SystemRole.PLATFORM_ADMIN]}>
      <div className="mx-auto w-full max-w-[1600px] space-y-6 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Quản lý chấm công</h1>
          <p className="mt-1 text-sm text-slate-600">Theo dõi lượt check-in, bảng công theo ngày và tổng hợp theo tháng.</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
          <Tabs defaultActiveKey="1" items={items} />
        </div>
      </div>
    </RoleGuard>
  );
}
