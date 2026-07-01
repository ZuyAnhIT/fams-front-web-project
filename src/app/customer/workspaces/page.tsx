import React from "react";
import WorkspacePage from "@/features/customer/workspace/components/WorkspacePage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quản lý Phòng ban - FAMS",
  description: "Quản lý phòng ban và đội nhóm trong công ty",
};

export default function WorkspacesRoute() {
  return <WorkspacePage />;
}
