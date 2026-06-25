"use client";

import { use } from "react";
import { Tabs, Tag } from "antd";
import { User, ShieldCheck, ArrowLeft } from "lucide-react";
import EmployeeForm from "@/features/employee/components/EmployeeForm";
import EmployeeRolesTab from "@/features/employee/components/EmployeeRolesTab";
import { useEmployeeDetail } from "@/features/employee/hooks/use-employee";
import { useRouter } from "next/navigation";

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
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/employees")}
            className="p-2 rounded-lg hover:bg-brand-50 text-brand-500 transition-colors cursor-pointer border border-transparent hover:border-brand-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-4">
              {data.avatarUrl ? (
                <img 
                  src={data.avatarUrl} 
                  alt={data.firstName} 
                  className="w-12 h-12 rounded-lg border border-brand-200 object-cover bg-white shadow-sm"
                />
              ) : (
                <div className="w-12 h-12 rounded-lg border border-brand-200 bg-brand-50 flex items-center justify-center text-brand-600 font-bold text-xl shadow-sm uppercase">
                  {data.firstName?.charAt(0)}
                </div>
              )}
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-brand-950">{data.firstName} {data.lastName}</h1>
                <Tag color={data.status === "active" ? "success" : data.status === "inactive" ? "warning" : "error"}>
                  {data.status === "active" ? "Hoạt động" : data.status === "inactive" ? "Tạm nghỉ" : "Đã nghỉ"}
                </Tag>
              </div>
            </div>
            <p className="text-sm text-brand-500 mt-1">
              {data.position || "Chưa cập nhật vị trí"} • {data.department || "Chưa cập nhật phòng ban"}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Wrapper */}
      <div className="bg-white rounded-xl shadow-sm border border-brand-100 p-6 min-h-[500px]">
        <Tabs
          defaultActiveKey="info"
          items={items}
          className="[&_.ant-tabs-nav]:mb-6 [&_.ant-tabs-tab]:px-4 [&_.ant-tabs-tab]:py-3 [&_.ant-tabs-tab-active_.ant-tabs-tab-btn]:text-brand-600 [&_.ant-tabs-ink-bar]:bg-brand-600"
        />
      </div>
    </div>
  );
}
