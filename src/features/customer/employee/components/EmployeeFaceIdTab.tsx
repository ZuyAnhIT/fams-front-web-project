"use client";

import { useState } from "react";
import { App, Tag, Modal, Alert } from "antd";
import { format } from "date-fns";
import { UserX, CheckCircle2, XCircle, Clock, ShieldCheck } from "lucide-react";
import { isAxiosError } from "axios";
import BaseButton from "@/components/ui/BaseButton";
import BaseModal from "@/components/ui/BaseModal";
import BaseTextArea from "@/components/ui/BaseTextArea";
import type { EmployeeDetailResponse } from "../types/employee.type";
import { useRevokeFaceId } from "../hooks/use-employee";
import { useAuthStore } from "@/stores/auth.store";
import {
  useApproveFaceIdEnrollment,
  usePendingFaceIdReviewPhoto,
  useRejectFaceIdEnrollment,
} from "@/features/customer/report/hooks/use-face-id-report";
import { PendingReviewPhoto } from "@/features/customer/report/components/FaceIdPendingReviewTab";

interface EmployeeFaceIdTabProps {
  employee: EmployeeDetailResponse;
}

export default function EmployeeFaceIdTab({ employee }: EmployeeFaceIdTabProps) {
  const { message } = App.useApp();
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const { mutateAsync: revokeFaceId, isPending } = useRevokeFaceId();
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const currentUserId = useAuthStore((state) => state.user?.id);
  const approve = useApproveFaceIdEnrollment();
  const reject = useRejectFaceIdEnrollment();
  
  const faceId = employee.faceId;
  const isEnrolled = faceId?.status === "enrolled";
  const isRevoked = faceId?.status === "revoked";
  
  const canManageFaceId = hasPermission("face_id:manage");
  const isOwnProfile = Boolean(employee.userId && employee.userId === currentUserId);
  const isPendingReview = faceId?.reviewStatus === "pending";
  const canReview = canManageFaceId && isPendingReview && !isOwnProfile;
  const { data: reviewPhoto, isLoading: isReviewPhotoLoading } =
    usePendingFaceIdReviewPhoto(employee.id, canReview);

  const errorMessage = (error: unknown, fallback: string) => {
    if (!isAxiosError(error)) return fallback;
    return (
      (error.response?.data as { message?: string } | undefined)?.message ||
      fallback
    );
  };

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
        } catch (error: unknown) {
          message.error(errorMessage(error, "Lỗi khi thu hồi Face ID"));
        }
      },
    });
  };

  const handleApprove = () => {
    Modal.confirm({
      title: "Duyệt hồ sơ Face ID",
      content:
        "Mẫu đang chờ sẽ trở thành Face ID dùng khi chấm công. Chỉ duyệt sau khi đã đối chiếu đúng nhân viên.",
      okText: "Duyệt hồ sơ",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          await approve.mutateAsync(employee.id);
          message.success("Đã duyệt hồ sơ Face ID.");
        } catch (error: unknown) {
          message.error(errorMessage(error, "Không thể duyệt hồ sơ Face ID"));
          throw error;
        }
      },
    });
  };

  const handleReject = async () => {
    const reason = rejectReason.trim();
    if (!reason) {
      message.warning("Vui lòng nhập lý do từ chối");
      return;
    }
    try {
      await reject.mutateAsync({ employeeId: employee.id, reason });
      message.success("Đã từ chối hồ sơ Face ID.");
      setRejectModalOpen(false);
      setRejectReason("");
    } catch (error: unknown) {
      message.error(errorMessage(error, "Không thể từ chối hồ sơ Face ID"));
    }
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

            <div className="flex items-center gap-3">
              <div className="text-sm font-semibold text-slate-500 w-32">
                Xét duyệt:
              </div>
              {faceId?.reviewStatus === "pending" ? (
                <Tag color="processing">Đang chờ HR duyệt</Tag>
              ) : faceId?.reviewStatus === "rejected" ? (
                <Tag color="error">Đã bị từ chối</Tag>
              ) : (
                <span className="text-sm text-slate-400">Không có yêu cầu</span>
              )}
            </div>

            {faceId?.submittedAt && (
              <div className="flex items-center gap-3">
                <div className="text-sm font-semibold text-slate-500 w-32">
                  Gửi xét duyệt:
                </div>
                <div className="text-sm font-medium text-slate-800">
                  {format(new Date(faceId.submittedAt), "dd/MM/yyyy HH:mm")}
                  {faceId.pendingPhotoCount != null &&
                    ` • ${faceId.pendingPhotoCount} khung hình`}
                </div>
              </div>
            )}

            {faceId?.rejectionReason && (
              <Alert
                type="error"
                showIcon
                title="Lý do từ chối"
                description={faceId.rejectionReason}
              />
            )}
          </div>

          <div className="flex-shrink-0 flex items-center justify-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm h-32 w-32 relative overflow-hidden">
             <div className="absolute inset-0 flex items-center justify-center opacity-10">
               <UserX className="w-20 h-20 text-slate-900" />
             </div>
             <ShieldCheck className="z-10 h-14 w-14 text-brand-600" aria-label="Trạng thái Face ID" />
          </div>
        </div>

        {isPendingReview && canManageFaceId && (
          <div className="mt-8 border-t border-slate-200 pt-6">
            {isOwnProfile ? (
              <Alert
                type="warning"
                showIcon
                title="Không thể tự duyệt Face ID của chính mình"
                description="Một HR/Admin khác có quyền face_id:manage phải thực hiện xét duyệt."
              />
            ) : (
              <>
                <div className="mb-4 flex items-center gap-4 rounded-xl border border-blue-100 bg-blue-50 p-4">
                  <PendingReviewPhoto
                    employeeId={employee.id}
                    employeeName={employee.fullName}
                  />
                  <div>
                    <div className="font-semibold text-slate-800">
                      Ảnh đối chiếu đang chờ duyệt
                    </div>
                    <div className="mt-1 text-sm text-slate-600">
                      Bấm vào ảnh để xem lớn và xác minh đúng nhân viên trước khi
                      quyết định.
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <BaseButton
                    type="primary"
                    icon={<ShieldCheck className="h-4 w-4" />}
                    loading={approve.isPending}
                    disabled={
                      !canReview || isReviewPhotoLoading || !reviewPhoto
                    }
                    onClick={handleApprove}
                  >
                    Duyệt hồ sơ
                  </BaseButton>
                  <BaseButton
                    danger
                    icon={<XCircle className="h-4 w-4" />}
                    onClick={() => setRejectModalOpen(true)}
                  >
                    Từ chối
                  </BaseButton>
                </div>
              </>
            )}
          </div>
        )}

        {(isEnrolled || isPendingReview) && canManageFaceId && (
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

      <BaseModal
        title="Từ chối hồ sơ Face ID"
        isOpen={rejectModalOpen}
        onClose={() => {
          setRejectModalOpen(false);
          setRejectReason("");
        }}
        onConfirm={handleReject}
        confirmText="Xác nhận từ chối"
        cancelText="Hủy"
        confirmLoading={reject.isPending}
        confirmButtonProps={{ danger: true }}
      >
        <BaseTextArea
          aria-label="Lý do từ chối Face ID"
          rows={4}
          maxLength={500}
          showCount
          value={rejectReason}
          onChange={(event) => setRejectReason(event.target.value)}
          placeholder="Nêu rõ vấn đề để nhân viên có thể đăng ký lại..."
        />
      </BaseModal>
    </div>
  );
}
