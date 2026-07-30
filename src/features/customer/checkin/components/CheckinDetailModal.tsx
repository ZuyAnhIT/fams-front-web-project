"use client";

import { useState } from "react";
import {
  Alert,
  App,
  Badge,
  Descriptions,
  Divider,
  Modal,
  Spin,
  Tag,
  Typography,
} from "antd";
import dayjs from "dayjs";
import { isAxiosError } from "axios";
import BaseButton from "@/components/ui/BaseButton";
import BaseModal from "@/components/ui/BaseModal";
import BaseSelect from "@/components/ui/BaseSelect";
import BaseTextArea from "@/components/ui/BaseTextArea";
import { useAuthStore } from "@/stores/auth.store";
import { formatVietnameseName } from "@/utils/name.util";
import { useCheckinDetail, useOverrideCheckin } from "../hooks/use-checkin";
import {
  CHECKIN_POLICY_META,
  type CheckinPolicy,
} from "../constants/checkin-policy";

const { Text } = Typography;

interface CheckinDetailModalProps {
  checkinId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

function statusTag(status: string) {
  if (status === "valid") return <Tag color="success">Hợp lệ</Tag>;
  if (status === "pending_review") {
    return <Tag color="warning">Cần xem xét</Tag>;
  }
  if (status === "rejected") return <Tag color="error">Bị từ chối</Tag>;
  return <Tag>{status}</Tag>;
}

function verificationBadge(
  face: boolean | null | undefined,
  liveness: boolean | null | undefined,
  score: number | null | undefined,
  policy: CheckinPolicy | null,
) {
  if (face == null) {
    if (policy === "gps_only") {
      return (
        <Badge status="default" text="Không áp dụng theo chính sách GPS" />
      );
    }
    if (policy) {
      return <Badge status="processing" text="Đang chờ xác thực" />;
    }
    return (
      <Badge status="default" text="Không xác định — bản ghi lịch sử" />
    );
  }
  return (
    <div className="space-y-1">
      <Badge
        status={face ? "success" : "error"}
        text={face ? "Face ID khớp" : "Face ID không khớp"}
      />
      {liveness != null && (
        <div>
          <Badge
            status={liveness ? "success" : "error"}
            text={liveness ? "Liveness đạt" : "Liveness thất bại"}
          />
        </div>
      )}
      {score != null && (
        <div className="text-xs text-slate-500">
          Điểm đối sánh nội bộ: {(score * 100).toFixed(1)}%
        </div>
      )}
    </div>
  );
}

function errorMessage(error: unknown, fallback: string): string {
  if (!isAxiosError(error)) return fallback;
  return (
    (error.response?.data as { message?: string } | undefined)?.message ||
    fallback
  );
}

export default function CheckinDetailModal({
  checkinId,
  isOpen,
  onClose,
}: CheckinDetailModalProps) {
  const { message } = App.useApp();
  const user = useAuthStore((state) => state.user);
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const tenantId = user?.tenantId ?? undefined;
  const canOverride = hasPermission("checkins:list");
  const { data: detail, isLoading, isError } = useCheckinDetail(
    tenantId,
    checkinId,
    isOpen,
  );
  const override = useOverrideCheckin();
  const [overrideOpen, setOverrideOpen] = useState(false);
  const [nextStatus, setNextStatus] = useState<"valid" | "rejected">("valid");
  const [reason, setReason] = useState("");
  const [submitError, setSubmitError] = useState("");

  const currentStatus = detail?.status;

  const openOverride = () => {
    setNextStatus(currentStatus === "valid" ? "rejected" : "valid");
    setReason("");
    setSubmitError("");
    setOverrideOpen(true);
  };

  const submitOverride = async () => {
    if (!tenantId || !checkinId) return;
    if (!reason.trim()) {
      setSubmitError("Vui lòng nhập lý do để lưu dấu vết kiểm toán.");
      return;
    }
    try {
      await override.mutateAsync({
        tenantId,
        checkinId,
        payload: { status: nextStatus, reason: reason.trim() },
      });
      setOverrideOpen(false);
      setReason("");
      setSubmitError("");
      message.success("Đã cập nhật trạng thái chấm công.");
    } catch (error: unknown) {
      setSubmitError(
        errorMessage(error, "Không thể cập nhật trạng thái chấm công."),
      );
    }
  };

  return (
    <>
      <Modal
        title="Chi tiết chấm công"
        open={isOpen}
        onCancel={() => {
          setOverrideOpen(false);
          setReason("");
          setSubmitError("");
          onClose();
        }}
        footer={
          detail && canOverride ? (
            <div className="flex justify-end gap-2">
              <BaseButton onClick={onClose}>Đóng</BaseButton>
              <BaseButton type="primary" onClick={openOverride}>
                Override trạng thái
              </BaseButton>
            </div>
          ) : null
        }
        width={820}
      >
        {isLoading ? (
          <div className="flex justify-center p-8">
            <Spin />
          </div>
        ) : isError ? (
          <Alert
            type="error"
            showIcon
            title="Không thể tải chi tiết chấm công"
          />
        ) : detail ? (
          <div className="flex flex-col gap-4">
            {detail.status === "pending_review" && (
              <Alert
                type="warning"
                showIcon
                title="Bản ghi cần HR xem xét"
                description="Nguyên nhân có thể là GPS ngoài vùng, Face ID/liveness thất bại hoặc đồng bộ offline không đủ bằng chứng. Hãy đối chiếu cả hai đầu phiên trước khi override."
              />
            )}

            {detail.source === "offline" && (
              <Alert
                type={
                  detail.effectiveCheckinPolicy === "gps_face_liveness"
                    ? "warning"
                    : "info"
                }
                showIcon
                title="Bản ghi được đồng bộ offline"
                description={
                  detail.effectiveCheckinPolicy === "gps_face_liveness"
                    ? "Active liveness không thể chứng minh lại cho thời điểm đã qua. Hãy kiểm tra ảnh dự phòng, GPS và lịch phân công trước khi đưa ra quyết định."
                    : "Thời điểm chấm công do thiết bị lưu cục bộ rồi đồng bộ khi có mạng trở lại."
                }
              />
            )}

            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="Trạng thái" span={2}>
                {statusTag(detail.status)}
                {detail.message && (
                  <Text type="secondary" className="ml-2">
                    {detail.message}
                  </Text>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Nguồn ghi nhận">
                <Tag color={detail.source === "offline" ? "blue" : "default"}>
                  {detail.source === "offline"
                    ? "Đồng bộ offline"
                    : "Trực tuyến"}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Chính sách tại check-in">
                {detail.effectiveCheckinPolicy ? (
                  <Tag
                    color={
                      CHECKIN_POLICY_META[detail.effectiveCheckinPolicy].color
                    }
                  >
                    {CHECKIN_POLICY_META[detail.effectiveCheckinPolicy].label}
                  </Tag>
                ) : (
                  <Tag>Bản ghi trước V78</Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Nhân viên">
                {detail.employee
                  ? formatVietnameseName(
                      detail.employee.firstName,
                      detail.employee.lastName,
                    )
                  : "Không có dữ liệu"}
                <br />
                <Text type="secondary" className="text-xs">
                  Mã NV: {detail.employee?.employeeCode || "—"}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Công trình">
                {detail.site?.name || "Không có dữ liệu"}
                <br />
                <Text type="secondary" className="text-xs">
                  {detail.site?.code || "—"}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Ca làm việc" span={2}>
                {detail.shift
                  ? `${detail.shift.name} (${detail.shift.startTime} – ${detail.shift.endTime})`
                  : "Không liên kết ca"}
              </Descriptions.Item>
              <Descriptions.Item label="Rủi ro GPS">
                <Text type={detail.gpsRiskScore > 0.5 ? "danger" : "success"}>
                  {(detail.gpsRiskScore * 100).toFixed(0)}%
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Thiết bị">
                <Text code>{detail.deviceId || "N/A"}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Thời gian làm việc" span={2}>
                {detail.workMinutes == null
                  ? "Chưa tính — phiên chưa check-out"
                  : `${detail.workMinutes} phút`}
              </Descriptions.Item>
              {detail.clientNonce && (
                <Descriptions.Item label="Mã đồng bộ client" span={2}>
                  <Text code copyable>
                    {detail.clientNonce}
                  </Text>
                </Descriptions.Item>
              )}
            </Descriptions>

            {(detail.overriddenAt || detail.overriddenBy || detail.note) && (
              <>
                <Divider titlePlacement="left" plain>
                  Dấu vết override gần nhất
                </Divider>
                <Descriptions bordered column={2} size="small">
                  <Descriptions.Item label="Người thực hiện">
                    {detail.overriddenBy ? (
                      <Text code copyable>
                        {detail.overriddenBy}
                      </Text>
                    ) : (
                      "—"
                    )}
                  </Descriptions.Item>
                  <Descriptions.Item label="Thời điểm">
                    {detail.overriddenAt
                      ? dayjs(detail.overriddenAt).format(
                          "DD/MM/YYYY HH:mm:ss",
                        )
                      : "—"}
                  </Descriptions.Item>
                  <Descriptions.Item label="Lý do" span={2}>
                    {detail.note || "Không có lý do"}
                  </Descriptions.Item>
                </Descriptions>
              </>
            )}

            <Divider titlePlacement="left" plain>
              Bằng chứng check-in
            </Divider>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="Thời gian">
                {dayjs(detail.checkInAt).format("DD/MM/YYYY HH:mm:ss")}
              </Descriptions.Item>
              <Descriptions.Item label="GPS/geofence">
                <Badge
                  status={
                    detail.checkInInsideGeofence ? "success" : "error"
                  }
                  text={
                    detail.checkInInsideGeofence
                      ? "Trong vùng"
                      : "Ngoài vùng"
                  }
                />
              </Descriptions.Item>
              <Descriptions.Item label="Face ID/liveness" span={2}>
                {verificationBadge(
                  detail.faceVerified,
                  detail.livenessVerified,
                  detail.faceVerifyScore,
                  detail.effectiveCheckinPolicy,
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Tọa độ GPS" span={2}>
                Lat: {detail.checkInLat}, Lng: {detail.checkInLon}
                <br />
                <Text type="secondary" className="text-xs">
                  Độ chính xác: {detail.checkInAccuracy ?? "—"}m
                </Text>
                <div className="mt-2">
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${detail.checkInLat},${detail.checkInLon}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-blue-500 underline"
                  >
                    Xem trên Google Maps
                  </a>
                </div>
              </Descriptions.Item>
            </Descriptions>

            {detail.checkOutAt && (
              <>
                <Divider titlePlacement="left" plain>
                  Bằng chứng check-out
                </Divider>
                <Descriptions bordered column={2} size="small">
                  <Descriptions.Item label="Thời gian">
                    {dayjs(detail.checkOutAt).format("DD/MM/YYYY HH:mm:ss")}
                  </Descriptions.Item>
                  <Descriptions.Item label="GPS/geofence">
                    <Badge
                      status={
                        detail.checkOutInsideGeofence ? "success" : "error"
                      }
                      text={
                        detail.checkOutInsideGeofence
                          ? "Trong vùng"
                          : "Ngoài vùng"
                      }
                    />
                  </Descriptions.Item>
                  <Descriptions.Item label="Face ID/liveness" span={2}>
                    {verificationBadge(
                      detail.checkoutFaceVerified,
                      detail.checkoutLivenessVerified,
                      detail.checkoutFaceVerifyScore,
                      detail.effectiveCheckinPolicy,
                    )}
                  </Descriptions.Item>
                  <Descriptions.Item label="Tọa độ GPS" span={2}>
                    Lat: {detail.checkOutLat ?? "—"}, Lng:{" "}
                    {detail.checkOutLon ?? "—"}
                    <br />
                    <Text type="secondary" className="text-xs">
                      Độ chính xác: {detail.checkOutAccuracy ?? "—"}m
                    </Text>
                    {detail.checkOutLat != null &&
                      detail.checkOutLon != null && (
                        <div className="mt-2">
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${detail.checkOutLat},${detail.checkOutLon}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm text-blue-500 underline"
                          >
                            Xem trên Google Maps
                          </a>
                        </div>
                      )}
                  </Descriptions.Item>
                </Descriptions>
              </>
            )}
          </div>
        ) : (
          <div className="p-8 text-center text-slate-500">
            Không tìm thấy dữ liệu.
          </div>
        )}
      </Modal>

      <BaseModal
        title="Override trạng thái chấm công"
        isOpen={overrideOpen}
        onClose={() => setOverrideOpen(false)}
        onConfirm={submitOverride}
        confirmText="Lưu quyết định"
        cancelText="Hủy"
        confirmLoading={override.isPending}
        confirmButtonProps={{ danger: nextStatus === "rejected" }}
      >
        <div className="space-y-4">
          <Alert
            type="warning"
            showIcon
            title="Thao tác có ảnh hưởng đến bảng công"
            description="Backend sẽ tính lại attendance summary cho ngày liên quan và lưu lý do để kiểm toán."
          />
          <div>
            <div className="mb-1 text-sm font-medium text-slate-700">
              Trạng thái mới
            </div>
            <BaseSelect
              aria-label="Trạng thái chấm công mới"
              className="w-full"
              value={nextStatus}
              onChange={(value) => {
                setNextStatus(value);
                setSubmitError("");
              }}
              options={[
                {
                  value: "valid",
                  label: "Hợp lệ — chấp nhận bản ghi",
                  disabled: currentStatus === "valid",
                },
                {
                  value: "rejected",
                  label: "Bị từ chối",
                  disabled: currentStatus === "rejected",
                },
              ]}
            />
          </div>
          <div>
            <div className="mb-1 text-sm font-medium text-slate-700">
              Lý do quyết định
            </div>
            <BaseTextArea
              aria-label="Lý do override trạng thái chấm công"
              rows={4}
              maxLength={500}
              showCount
              value={reason}
              onChange={(event) => {
                setReason(event.target.value);
                setSubmitError("");
              }}
              placeholder="Ví dụ: Đã đối chiếu camera công trình và xác nhận nhân viên có mặt..."
            />
          </div>
          {submitError && (
            <Alert type="error" showIcon title={submitError} />
          )}
        </div>
      </BaseModal>
    </>
  );
}
