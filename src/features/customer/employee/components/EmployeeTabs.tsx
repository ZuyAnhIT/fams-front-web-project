"use client";

import { Tabs } from "antd";
import type { TabsProps } from "antd";
import EmployeeListPage from "./EmployeeListPage";
import InvitationListPage from "./InvitationListPage";
import { Users, Mail } from "lucide-react";

export default function EmployeeTabs() {
  const items: TabsProps["items"] = [
    {
      key: "employees",
      label: (
        <span className="flex items-center gap-2 font-semibold text-base px-2">
          <Users className="w-5 h-5" />
          Danh sách nhân viên
        </span>
      ),
      children: <EmployeeListPage />,
    },
    {
      key: "invitations",
      label: (
        <span className="flex items-center gap-2 font-semibold text-base px-2">
          <Mail className="w-5 h-5" />
          Lời mời đã gửi
        </span>
      ),
      children: <InvitationListPage />,
    },
  ];

  return (
    <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
      <Tabs 
        defaultActiveKey="employees" 
        items={items} 
        size="large"
        tabBarStyle={{ marginBottom: 24, paddingLeft: 16, paddingRight: 16, paddingTop: 8 }}
      />
    </div>
  );
}
