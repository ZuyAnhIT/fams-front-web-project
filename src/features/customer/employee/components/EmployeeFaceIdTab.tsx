"use client";

import { App, Tag, Modal } from "antd";
import { format } from "date-fns";
import { UserX, CheckCircle2, XCircle, Clock } from "lucide-react";
import BaseButton from "@/components/ui/BaseButton";
import type { EmployeeDetailResponse } from "../types/employee.type";
import { useRevokeFaceId } from "../hooks/use-employee";
import { useAuthStore } from "@/stores/auth.store";

interface EmployeeFaceIdTabProps {
  employee: EmployeeDetailResponse;
}

export default function EmployeeFaceIdTab({ employee }: EmployeeFaceIdTabProps) {
  const { message } = App.useApp();
  const { mutateAsync: revokeFaceId, isPending } = useRevokeFaceId();
  const hasPermission = useAuthStore((state) => state.hasPermission);
  
  const faceId = employee.faceId;
  const isEnrolled = faceId?.status === "enrolled";
  const isRevoked = faceId?.status === "revoked";
  
  const canManageFaceId = hasPermission("face_id:manage");

  const handleRevoke = () => {
    Modal.confirm({
      title: "Xác nhận thu hồi Face ID",
      content: "Bạn có chắc chắn muốn thu hồi hồ sơ khuôn mặt của nhân viên này không? Dữ liệu khuôn mặt sẽ bị xóa và không thể khôi phục.",
      okText: "Thu hồi",
      okType: "danger",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          await revokeFaceId(employee.id);
          message.success("Đã thu hồi hồ sơ Face ID thành công.");
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || "Lỗi khi thu hồi Face ID";
          message.error(errorMessage);
        }
      },
    });
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
        <h3 className="text-lg font-bold text-slate-800">Thông tin Face ID & Sinh trắc học</h3>
      </div>

      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="text-sm font-semibold text-slate-500 w-32">Trạng thái:</div>
              {isEnrolled ? (
                <Tag color="success" className="flex items-center gap-1.5 px-3 py-1 text-sm font-semibold rounded-lg m-0">
                  <CheckCircle2 className="w-4 h-4" /> Đã đăng ký
                </Tag>
              ) : isRevoked ? (
                <Tag color="error" className="flex items-center gap-1.5 px-3 py-1 text-sm font-semibold rounded-lg m-0">
                  <XCircle className="w-4 h-4" /> Đã thu hồi
                </Tag>
              ) : (
                <Tag color="default" className="flex items-center gap-1.5 px-3 py-1 text-sm font-semibold rounded-lg m-0 text-slate-500">
                  <Clock className="w-4 h-4" /> Chưa đăng ký
                </Tag>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="text-sm font-semibold text-slate-500 w-32">Cấp quyền thu thập:</div>
              <div className="text-sm font-medium text-slate-800">
                {faceId?.consentGiven ? (
                  <span className="text-emerald-600 font-semibold">Đã đồng ý</span>
                ) : (
                  <span className="text-slate-400">Chưa xác nhận</span>
                )}
              </div>
            </div>

            {faceId?.enrolledAt && (
              <div className="flex items-center gap-3">
                <div className="text-sm font-semibold text-slate-500 w-32">Ngày đăng ký:</div>
                <div className="text-sm font-medium text-slate-800">
                  {format(new Date(faceId.enrolledAt), "dd/MM/yyyy HH:mm")}
                </div>
              </div>
            )}
            
            {faceId?.revokedAt && (
              <div className="flex items-center gap-3">
                <div className="text-sm font-semibold text-slate-500 w-32">Ngày thu hồi:</div>
                <div className="text-sm font-medium text-slate-800">
                  {format(new Date(faceId.revokedAt), "dd/MM/yyyy HH:mm")}
                </div>
              </div>
            )}
          </div>

          <div className="flex-shrink-0 flex items-center justify-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm h-32 w-32 relative overflow-hidden">
             <div className="absolute inset-0 flex items-center justify-center opacity-10">
               <UserX className="w-20 h-20 text-slate-900" />
             </div>
             <img src="/images/face-scan-placeholder.png" alt="Face Scan" className="w-20 h-20 object-contain z-10" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          </div>
        </div>

        {isEnrolled && canManageFaceId && (
          <div className="mt-8 pt-6 border-t border-slate-200">
            <h4 className="text-sm font-bold text-red-600 mb-2">Khu vực nguy hiểm</h4>
            <p className="text-sm text-slate-500 mb-4">
              Hành động này sẽ xóa hoàn toàn hồ sơ sinh trắc học của nhân viên khỏi hệ thống AI. 
              Bạn chỉ nên thực hiện khi nhân viên nghỉ việc hoặc yêu cầu rút lại sự đồng ý (consent).
            </p>
            <BaseButton
              type="primary"
              danger
              icon={<UserX className="w-4 h-4" />}
              onClick={handleRevoke}
              loading={isPending}
              className="font-bold shadow-sm"
            >
              Thu hồi Face ID
            </BaseButton>
          </div>
        )}
      </div>
    </div>
  );
}
