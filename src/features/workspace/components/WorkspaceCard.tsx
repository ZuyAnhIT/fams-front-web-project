import React from "react";
import { Users, Building2, CalendarDays, MoreVertical } from "lucide-react";
import { Dropdown, MenuProps } from "antd";
import { WorkspaceResponse } from "../types";
import { cn } from "@/utils/cn";
import dayjs from "dayjs";

interface WorkspaceCardProps {
  workspace: WorkspaceResponse;
  parentName?: string | null;
  onClick: (workspace: WorkspaceResponse) => void;
  onEdit?: (workspace: WorkspaceResponse) => void;
  onDelete?: (workspace: WorkspaceResponse) => void;
}

export default function WorkspaceCard({ workspace, parentName, onClick, onEdit, onDelete }: WorkspaceCardProps) {
  const isTeam = workspace.type === "team";
  const Icon = isTeam ? Users : Building2;
  const statusColor = workspace.status === "active" ? "bg-emerald-500" : "bg-slate-400";

  const items: MenuProps["items"] = [
    {
      key: "edit",
      label: "Chỉnh sửa",
      onClick: (e) => {
        e.domEvent.stopPropagation();
        onEdit?.(workspace);
      },
    },
    {
      key: "delete",
      danger: true,
      label: "Xóa",
      onClick: (e) => {
        e.domEvent.stopPropagation();
        onDelete?.(workspace);
      },
    },
  ];

  return (
    <div
      onClick={() => onClick(workspace)}
      className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/40 bg-white/60 p-5 shadow-sm backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:bg-white/80 cursor-pointer h-full min-h-[160px]"
    >
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-xl shadow-sm",
              isTeam ? "bg-purple-100 text-purple-600" : "bg-blue-100 text-blue-600"
            )}
          >
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800 line-clamp-1 group-hover:text-brand-600 transition-colors">
              {workspace.name}
            </h3>
            {parentName && (
              <p className="text-[11px] font-medium text-slate-500 line-clamp-1 mt-0.5">
                ↳ Trực thuộc: <span className="text-slate-700">{parentName}</span>
              </p>
            )}
            <div className="flex items-center gap-2 mt-1">
              <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                <span className={cn("h-1.5 w-1.5 rounded-full", statusColor)} />
                {workspace.status === "active" ? "Hoạt động" : "Tạm dừng"}
              </span>
            </div>
          </div>
        </div>

        <Dropdown menu={{ items }} trigger={["click"]} placement="bottomRight">
          <button
            onClick={(e) => e.stopPropagation()}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <MoreVertical className="h-5 w-5" />
          </button>
        </Dropdown>
      </div>

      <div className="mt-4">
        <p className="text-sm text-slate-500 line-clamp-2 min-h-[40px]">
          {workspace.description || "Chưa có mô tả"}
        </p>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <CalendarDays className="h-3.5 w-3.5" />
          {dayjs(workspace.createdAt).format("DD/MM/YYYY")}
        </span>
        <span className="font-medium bg-slate-100 px-2 py-0.5 rounded-md">
          {isTeam ? "Đội nhóm" : "Phòng ban"}
        </span>
      </div>
    </div>
  );
}
