"use client";

import { Empty, Tag } from "antd";
import { BriefcaseBusiness, Building2, CalendarDays } from "lucide-react";
import { format } from "date-fns";
import type { EmployeeDetailResponse } from "../types/employee.type";

const DAY_LABELS: Record<string, string> = {
  MONDAY: "T2",
  TUESDAY: "T3",
  WEDNESDAY: "T4",
  THURSDAY: "T5",
  FRIDAY: "T6",
  SATURDAY: "T7",
  SUNDAY: "CN",
};

export default function EmployeeWorkTab({ employee }: { employee: EmployeeDetailResponse }) {
  const workspaces = employee.workspaces ?? [];
  const assignments = employee.assignments ?? [];

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <section className="rounded-xl border border-slate-200 p-5" aria-labelledby="employee-workspaces">
        <h3 id="employee-workspaces" className="mb-4 flex items-center gap-2 font-bold text-slate-800">
          <Building2 className="h-5 w-5 text-blue-600" />
          Workspace ({workspaces.length})
        </h3>
        {workspaces.length === 0 ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa tham gia workspace nào" />
        ) : (
          <div className="space-y-3">
            {workspaces.map((workspace) => (
              <div key={workspace.id} className="rounded-lg bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold text-slate-800 flex items-center gap-2">
                      {workspace.workspaceName}
                      {workspace.isPrimary && <Tag color="gold" className="m-0">Chính</Tag>}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      Tham gia {format(new Date(workspace.assignedAt), "dd/MM/yyyy")}
                    </div>
                  </div>
                  <Tag color="blue">{workspace.role}</Tag>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 p-5" aria-labelledby="employee-assignments">
        <h3 id="employee-assignments" className="mb-4 flex items-center gap-2 font-bold text-slate-800">
          <BriefcaseBusiness className="h-5 w-5 text-emerald-600" />
          Phân công công trường ({assignments.length})
        </h3>
        {assignments.length === 0 ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có phân công nào" />
        ) : (
          <div className="space-y-3">
            {assignments.map((assignment) => (
              <div key={assignment.id} className="rounded-lg border border-slate-100 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="font-semibold text-slate-800">
                      Site <span className="font-mono text-xs">{assignment.siteId}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {format(new Date(assignment.startDate), "dd/MM/yyyy")} –{" "}
                      {assignment.endDate
                        ? format(new Date(assignment.endDate), "dd/MM/yyyy")
                        : "Không thời hạn"}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Tag color={assignment.status === "active" ? "success" : "default"}>
                      {assignment.status === "active" ? "Đang hiệu lực" : "Đã hủy"}
                    </Tag>
                    <Tag color="purple">{assignment.role}</Tag>
                  </div>
                </div>
                {assignment.daysOfWeek?.length ? (
                  <div className="mt-3 text-xs text-slate-600">
                    Lịch: {assignment.daysOfWeek.map((day) => DAY_LABELS[day] ?? day).join(", ")}
                  </div>
                ) : null}
                {assignment.notes ? (
                  <p className="mt-2 text-sm text-slate-600">{assignment.notes}</p>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
