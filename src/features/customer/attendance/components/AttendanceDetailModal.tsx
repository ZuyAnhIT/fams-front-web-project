"use client";

import { useEffect, useState } from "react";
import {
  Alert,
  App,
  Descriptions,
  Form,
  Input,
  InputNumber,
  Select,
  Spin,
  Switch,
} from "antd";
import dayjs from "dayjs";
import BaseButton from "@/components/ui/BaseButton";
import BaseModal from "@/components/ui/BaseModal";
import { useAuthStore } from "@/stores/auth.store";
import { SystemRole } from "@/features/customer/auth/types/auth.type";
import {
  useAdjustAttendanceSummary,
  useAttendanceSummaryDetail,
  useRecomputeAttendance,
  useUnlockAttendanceSummary,
} from "../hooks/use-attendance";
import type {
  AdjustAttendanceSummaryRequest,
  UnlockAttendanceSummaryRequest,
} from "../types/attendance.type";
import AttendanceIssueBadges from "./AttendanceIssueBadges";

interface AttendanceDetailModalProps {
  tenantId?: string;
  summaryId: string | null;
  onClose: () => void;
}

function minutesLabel(value: number) {
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  return `${hours > 0 ? `${hours}h ` : ""}${minutes}p`;
}

export default function AttendanceDetailModal({
  tenantId,
  summaryId,
  onClose,
}: AttendanceDetailModalProps) {
  const { message, modal } = App.useApp();
  const [form] = Form.useForm<AdjustAttendanceSummaryRequest>();
  const [unlockForm] = Form.useForm<UnlockAttendanceSummaryRequest>();
  const [unlockOpen, setUnlockOpen] = useState(false);
  const user = useAuthStore((state) => state.user);
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const canAdjust =
    user?.role === SystemRole.PLATFORM_ADMIN || hasPermission("attendance:list");
  const { data, isLoading, isError, error, refetch } = useAttendanceSummaryDetail(
    tenantId,
    summaryId,
  );
  const adjust = useAdjustAttendanceSummary();
  const unlock = useUnlockAttendanceSummary();
  const recompute = useRecomputeAttendance();

  useEffect(() => {
    if (!data) return;
    form.setFieldsValue({
      totalWorkMinutes: data.totalWorkMinutes,
      status: data.status,
      late: data.late,
      lateMinutes: data.lateMinutes,
      earlyLeave: data.earlyLeave,
      earlyLeaveMinutes: data.earlyLeaveMinutes,
      otMinutes: data.otMinutes,
      missingCheckout: data.missingCheckout,
      reason: "",
    });
  }, [data, form]);

  const submit = async (values: AdjustAttendanceSummaryRequest) => {
    if (!tenantId || !summaryId) return;
    try {
      await adjust.mutateAsync({
        tenantId,
        summaryId,
        payload: {
          ...values,
          lateMinutes: values.late ? values.lateMinutes : 0,
          earlyLeaveMinutes: values.earlyLeave ? values.earlyLeaveMinutes : 0,
          reason: values.reason.trim(),
        },
      });
      form.setFieldValue("reason", "");
    } catch {
      // Mutation state renders the normalized Backend error in the modal.
    }
  };

  const status = (error as { response?: { status?: number } } | undefined)?.response
    ?.status;

  const submitUnlock = async (values: UnlockAttendanceSummaryRequest) => {
    if (!tenantId || !summaryId) return;
    try {
      await unlock.mutateAsync({
        tenantId,
        summaryId,
        payload: { reason: values.reason.trim() },
      });
      setUnlockOpen(false);
      unlockForm.resetFields();
      message.success("Đã mở khóa và tính lại từ dữ liệu chấm công nguồn.");
    } catch {
      // The secondary modal renders the normalized Backend error.
    }
  };

  const confirmRecompute = () => {
    if (!tenantId || !data) return;
    modal.confirm({
      title: "Tính lại bảng công ngày?",
      content: (
        <div className="space-y-2 text-sm text-slate-600">
          <p>
            Hệ thống sẽ tính lại toàn bộ bảng công tại <strong>{data.siteName || data.siteId}</strong>{" "}
            trong ngày <strong>{dayjs(data.attendanceDate).format("DD/MM/YYYY")}</strong> từ các phiên chấm công nguồn.
          </p>
          <p>Các bản ghi đang khóa do điều chỉnh thủ công sẽ được giữ nguyên.</p>
        </div>
      ),
      okText: "Tính lại",
      cancelText: "Hủy",
      onOk: async () => {
        await recompute.mutateAsync({
          tenantId,
          params: { date: data.attendanceDate, siteId: data.siteId },
        });
        await refetch();
        message.success("Đã tính lại bảng công theo ngày và công trình.");
      },
    });
  };

  return (
    <>
      <BaseModal
        title="Chi tiết bảng công ngày"
        isOpen={Boolean(summaryId)}
        onClose={() => {
          adjust.reset();
          unlock.reset();
          recompute.reset();
          setUnlockOpen(false);
          onClose();
        }}
        onConfirm={canAdjust ? () => form.submit() : undefined}
        confirmText="Lưu điều chỉnh"
        confirmLoading={adjust.isPending}
        hideFooter={!canAdjust || isLoading || isError}
        width={820}
      >
      {isLoading ? (
        <div className="flex justify-center py-12"><Spin size="large" /></div>
      ) : isError ? (
        <Alert
          type="error"
          showIcon
          title={status === 404 ? "Bản ghi không còn tồn tại" : "Không thể tải bảng công"}
          description={
            status === 404
              ? "Danh sách có thể đã thay đổi. Hãy đóng cửa sổ và tải lại dữ liệu."
              : "Bạn không có quyền xem bản ghi này hoặc hệ thống đang gián đoạn."
          }
        />
      ) : data ? (
        <div className="space-y-5">
          <Descriptions bordered size="small" column={{ xs: 1, sm: 2 }}>
            <Descriptions.Item label="Nhân viên">{data.employeeName || data.employeeId}</Descriptions.Item>
            <Descriptions.Item label="Công trình">{data.siteName || data.siteId}</Descriptions.Item>
            <Descriptions.Item label="Ngày">{dayjs(data.attendanceDate).format("DD/MM/YYYY")}</Descriptions.Item>
            <Descriptions.Item label="Số phiên hợp lệ">{data.sessionCount}</Descriptions.Item>
            <Descriptions.Item label="Giờ vào">{data.firstCheckinAt ? dayjs(data.firstCheckinAt).format("HH:mm:ss") : "—"}</Descriptions.Item>
            <Descriptions.Item label="Giờ ra">{data.lastCheckoutAt ? dayjs(data.lastCheckoutAt).format("HH:mm:ss") : "—"}</Descriptions.Item>
            <Descriptions.Item label="Tổng giờ làm">{minutesLabel(data.totalWorkMinutes)}</Descriptions.Item>
            <Descriptions.Item label="OT (đã nằm trong tổng)">{minutesLabel(data.otMinutes)}</Descriptions.Item>
            <Descriptions.Item label="Trạng thái dữ liệu" span={2}>
              <AttendanceIssueBadges
                hasPendingReviewSession={data.hasPendingReviewSession}
                hasRejectedSession={data.hasRejectedSession}
                adjustmentReason={data.adjustmentReason}
                hasRandomCheckFailure={data.hasRandomCheckFailure}
              />
            </Descriptions.Item>
          </Descriptions>

          {data.adjustmentReason && (
            <Alert
              type="info"
              showIcon
              title="Bản ghi đã được điều chỉnh thủ công và khóa tự động tính lại"
              description={`Lý do: ${data.adjustmentReason}. Nếu phát sinh dữ liệu đồng bộ muộn, HR phải kiểm tra và điều chỉnh lại chủ động.`}
              action={canAdjust ? (
                <BaseButton size="small" onClick={() => setUnlockOpen(true)}>
                  Mở khóa và tính lại
                </BaseButton>
              ) : undefined}
            />
          )}

          {canAdjust && !data.adjustmentReason && (
            <Alert
              type="info"
              showIcon
              title="Tính lại từ dữ liệu chấm công nguồn"
              description="Áp dụng theo ngày và công trình; các summary đang khóa thủ công không bị ghi đè."
              action={(
                <BaseButton
                  size="small"
                  onClick={confirmRecompute}
                  loading={recompute.isPending}
                >
                  Tính lại
                </BaseButton>
              )}
            />
          )}

          {adjust.isSuccess && (
            <Alert
              type="success"
              showIcon
              title="Đã lưu và khóa bản ghi"
              description="Hệ thống sẽ không tự động ghi đè số liệu này. Hãy điều chỉnh lại nếu có dữ liệu chấm công mới phát sinh."
            />
          )}

          {adjust.isError && (
            <Alert
              type="error"
              showIcon
              title="Không thể lưu điều chỉnh"
              description={
                (adjust.error as { response?: { data?: { message?: string } } }).response
                  ?.data?.message || "Vui lòng kiểm tra dữ liệu và thử lại."
              }
            />
          )}

          {canAdjust && (
            <Form form={form} layout="vertical" onFinish={submit} className="grid gap-x-4 sm:grid-cols-2">
              <Form.Item label="Trạng thái" name="status">
                <Select options={[{ value: "present", label: "Hoàn thành" }, { value: "incomplete", label: "Chưa hoàn thành" }]} />
              </Form.Item>
              <Form.Item label="Tổng phút làm việc" name="totalWorkMinutes" rules={[{ required: true }]}>
                <InputNumber min={0} className="w-full" />
              </Form.Item>
              <Form.Item label="Đi muộn" name="late" valuePropName="checked">
                <Switch />
              </Form.Item>
              <Form.Item label="Số phút đi muộn" name="lateMinutes">
                <InputNumber min={0} className="w-full" />
              </Form.Item>
              <Form.Item label="Về sớm" name="earlyLeave" valuePropName="checked">
                <Switch />
              </Form.Item>
              <Form.Item label="Số phút về sớm" name="earlyLeaveMinutes">
                <InputNumber min={0} className="w-full" />
              </Form.Item>
              <Form.Item
                label="Số phút OT"
                name="otMinutes"
                extra="OT chỉ là phần breakdown, đã nằm trong tổng phút làm việc."
                dependencies={["totalWorkMinutes"]}
                rules={[
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (value == null || value <= (getFieldValue("totalWorkMinutes") ?? 0)) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error("Số phút OT không thể lớn hơn tổng phút làm việc."));
                    },
                  }),
                ]}
              >
                <InputNumber min={0} className="w-full" />
              </Form.Item>
              <Form.Item label="Thiếu check-out" name="missingCheckout" valuePropName="checked">
                <Switch />
              </Form.Item>
              <Form.Item
                className="sm:col-span-2"
                label="Lý do điều chỉnh"
                name="reason"
                rules={[
                  { required: true, whitespace: true, message: "Vui lòng nhập lý do điều chỉnh." },
                  { max: 500, message: "Lý do tối đa 500 ký tự." },
                ]}
              >
                <Input.TextArea rows={3} maxLength={500} showCount placeholder="Nêu căn cứ đối chiếu và lý do thay đổi số liệu..." />
              </Form.Item>
            </Form>
          )}
        </div>
      ) : null}
      </BaseModal>

      <BaseModal
        title="Mở khóa và tính lại bảng công"
        isOpen={unlockOpen}
        onClose={() => {
          setUnlockOpen(false);
          unlock.reset();
          unlockForm.resetFields();
        }}
        onConfirm={() => unlockForm.submit()}
        confirmText="Mở khóa và tính lại"
        confirmLoading={unlock.isPending}
        confirmButtonProps={{ danger: true }}
        width={560}
      >
        <Alert
          type="warning"
          showIcon
          title="Số liệu điều chỉnh thủ công sẽ được thay thế"
          description="Hệ thống lưu người thao tác, lý do và số liệu trước/sau để phục vụ audit."
          className="mb-4"
        />
        {unlock.isError && (
          <Alert
            type="error"
            showIcon
            title="Không thể mở khóa bảng công"
            description={
              (unlock.error as { response?: { data?: { message?: string } } }).response
                ?.data?.message || "Vui lòng kiểm tra dữ liệu và thử lại."
            }
            className="mb-4"
          />
        )}
        <Form form={unlockForm} layout="vertical" onFinish={submitUnlock}>
          <Form.Item
            label="Lý do mở khóa"
            name="reason"
            rules={[
              { required: true, whitespace: true, message: "Vui lòng nhập lý do mở khóa." },
              { max: 500, message: "Lý do tối đa 500 ký tự." },
            ]}
          >
            <Input.TextArea
              rows={4}
              maxLength={500}
              showCount
              placeholder="Ví dụ: Đã nhận thêm dữ liệu check-out offline và cần tính lại..."
            />
          </Form.Item>
        </Form>
      </BaseModal>
    </>
  );
}
