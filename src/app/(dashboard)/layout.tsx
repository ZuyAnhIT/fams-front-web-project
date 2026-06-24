import DashboardLayout from "@/layouts/DashboardLayout";

export const metadata = {
  title: "Dashboard | FAMS",
  description: "Bảng điều khiển quản lý hệ thống chấm công thực địa FAMS",
};

export default function AppDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
