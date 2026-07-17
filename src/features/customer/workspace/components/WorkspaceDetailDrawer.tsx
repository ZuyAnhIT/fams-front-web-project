import React, { useEffect } from "react";
import { Drawer, Descriptions, Tag, App } from "antd";
import BaseButton from "@/components/ui/BaseButton";
import { WorkspaceResponse } from "../types";
import dayjs from "dayjs";
import { Building2, Users, Edit3, Trash2 } from "lucide-react";
import { useWorkspaceByIdQuery } from "../hooks/use-workspace";

interface WorkspaceDetailDrawerProps {
  workspace: WorkspaceResponse | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (workspace: WorkspaceResponse) => void;
}

export default function WorkspaceDetailDrawer({ workspace, isOpen, onClose, onEdit }: WorkspaceDetailDrawerProps) {
  const { message } = App.useApp();
  const { data: detailResponse, isLoading } = useWorkspaceByIdQuery(
    workspace?.tenantId,
    isOpen ? workspace?.id : undefined
  );

  const detail = detailResponse?.data || workspace;

  if (!detail) return null;

  const isTeam = detail.type === "team";

  return (
    <Drawer
      title={
        <div className="flex items-center gap-2 text-slate-800">
          {isTeam ? <Users className="h-5 w-5 text-purple-600" /> : <Building2 className="h-5 w-5 text-blue-600" />}
          <span className="font-bold">{detail.name}</span>
        </div>
      }
      placement="right"
      width={450}
      onClose={onClose}
      open={isOpen}
      extra={
        <BaseButton
          type="text"
          icon={<Edit3 className="h-4 w-4" />}
          onClick={() => onEdit(detail)}
          className="text-brand-600 hover:bg-brand-50"
        >
          Sửa
        </BaseButton>
      }
    >
      <div className="space-y-6">
        <div>
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Thông tin chung</h4>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-4">
            <div>
              <p className="text-xs text-slate-500 mb-1">Loại tổ chức</p>
              <p className="font-medium text-slate-800">{isTeam ? "Đội nhóm" : "Phòng ban"}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Trạng thái</p>
              <Tag color={detail.status === "active" ? "success" : "default"} className="m-0 font-medium">
                {detail.status === "active" ? "Đang hoạt động" : "Tạm dừng"}
              </Tag>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Mô tả</p>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">
                {detail.description || "Chưa có mô tả"}
              </p>
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Hệ thống</h4>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-4">
            <div>
              <p className="text-xs text-slate-500 mb-1">Ngày tạo</p>
              <p className="text-sm text-slate-800 font-medium">
                {dayjs(detail.createdAt).format("HH:mm - DD/MM/YYYY")}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Cập nhật lần cuối</p>
              <p className="text-sm text-slate-800 font-medium">
                {dayjs(detail.updatedAt).format("HH:mm - DD/MM/YYYY")}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">ID</p>
              <p className="text-xs text-slate-400 font-mono bg-white p-1.5 rounded border border-slate-200 break-all">
                {detail.id}
              </p>
            </div>
          </div>
        </div>

        {/* Placeholder for future features like Employees list */}
        <div className="mt-8 pt-6 border-t border-slate-200">
          <div className="flex items-center justify-center p-8 bg-blue-50/50 border border-blue-100 border-dashed rounded-xl">
            <div className="text-center">
              <Users className="h-8 w-8 text-blue-300 mx-auto mb-2" />
              <p className="text-sm text-blue-600 font-medium">Chức năng quản lý nhân sự thuộc phòng ban sẽ được cập nhật sau.</p>
            </div>
          </div>
        </div>
      </div>
    </Drawer>
  );
}
