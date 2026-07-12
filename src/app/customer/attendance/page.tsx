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
      <div className="space-y-6 px-2 sm:px-4 pb-4">
        <h1 className="text-2xl font-bold text-slate-800">Quản lý chấm công</h1>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <Tabs defaultActiveKey="1" items={items} />
        </div>
      </div>
    </RoleGuard>
  );
}
