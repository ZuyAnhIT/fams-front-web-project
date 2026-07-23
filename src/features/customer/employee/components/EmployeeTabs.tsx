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
          <Users className="w-5 h-5" aria-hidden="true" />
          Danh sách nhân viên
        </span>
      ),
      children: <EmployeeListPage />,
    },
    {
      key: "invitations",
      label: (
        <span className="flex items-center gap-2 font-semibold text-base px-2">
          <Mail className="w-5 h-5" aria-hidden="true" />
          Lời mời đã gửi
        </span>
      ),
      children: <InvitationListPage />,
    },
  ];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-1 shadow-sm sm:p-2">
      <Tabs 
        defaultActiveKey="employees" 
        items={items} 
        size="middle"
        tabBarStyle={{ marginBottom: 20, paddingLeft: 8, paddingRight: 8, paddingTop: 8 }}
      />
    </div>
  );
}
