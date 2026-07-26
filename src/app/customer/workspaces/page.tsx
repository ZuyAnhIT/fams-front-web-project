import React from "react";
import WorkspacePage from "@/features/customer/workspace/components/WorkspacePage";
import { Metadata } from "next";
import RoleGuard from "@/components/guards/RoleGuard";

export const metadata: Metadata = {
  title: "Quản lý Phòng ban - FAMS",
  description: "Quản lý phòng ban và đội nhóm trong công ty",
};

export default function WorkspacesRoute() {
  return (
    <RoleGuard allowedPermissions={["workspaces:list", "workspaces:read"]}>
      <WorkspacePage />
    </RoleGuard>
  );
}
