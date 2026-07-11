"use client";

import { use } from "react";
import { Tabs, Tag } from "antd";
import { User, ShieldCheck, ArrowLeft, ScanFace } from "lucide-react";
import EmployeeForm from "@/features/customer/employee/components/EmployeeForm";
import EmployeeRolesTab from "@/features/customer/employee/components/EmployeeRolesTab";
import EmployeeFaceIdTab from "@/features/customer/employee/components/EmployeeFaceIdTab";
import { useEmployeeDetail } from "@/features/customer/employee/hooks/use-employee";
import { useRouter } from "next/navigation";
import DetailHeader from "@/components/shared/layout/DetailHeader";
import ContentCard from "@/components/shared/layout/ContentCard";

export default function EditEmployeePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const { data, isLoading } = useEmployeeDetail(resolvedParams.id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-brand-500">
        Không tìm thấy thông tin nhân viên
      </div>
    );
  }

  const items = [
    {
      key: "info",
      label: (
        <span className="flex items-center gap-2">
          <User className="h-4 w-4" />
          Thông tin cá nhân
        </span>
      ),
      children: <EmployeeForm isEditMode={true} initialData={data} />,
    },
    {
      key: "roles",
      label: (
        <span className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4" />
          Vai trò & Phân quyền
        </span>
      ),
      children: <EmployeeRolesTab employee={data} />,
    },
    {
      key: "faceid",
      label: (
        <span className="flex items-center gap-2">
          <ScanFace className="h-4 w-4" />
          Sinh trắc học
        </span>
      ),
      children: <EmployeeFaceIdTab employee={data} />,
    },
  ];

  return (
    <div className="space-y-6">
      <DetailHeader
        onBack={() => router.push("/customer/employees")}
        title={`${data.firstName} ${data.lastName}`}
        subtitle={`${data.position || "Chưa cập nhật vị trí"} • ${data.department || "Chưa cập nhật phòng ban"}`}
        avatarUrl={data.avatarUrl}
        avatarFallback={data.firstName?.charAt(0)}
        tags={
          <Tag color={data.status === "active" ? "success" : data.status === "inactive" ? "warning" : "error"}>
            {data.status === "active" ? "Hoạt động" : data.status === "inactive" ? "Tạm nghỉ" : "Đã nghỉ"}
          </Tag>
        }
      />

      <ContentCard className="p-6">
        <Tabs
          defaultActiveKey="info"
          items={items}
          className="[&_.ant-tabs-nav]:mb-6 [&_.ant-tabs-tab]:px-4 [&_.ant-tabs-tab]:py-3 [&_.ant-tabs-tab-active_.ant-tabs-tab-btn]:text-brand-600 [&_.ant-tabs-ink-bar]:bg-brand-600"
        />
      </ContentCard>
    </div>
  );
}
