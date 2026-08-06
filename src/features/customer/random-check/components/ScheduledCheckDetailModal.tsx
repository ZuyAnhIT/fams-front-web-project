"use client";

import { useState } from "react";
import { Alert, Descriptions, Spin, Tag } from "antd";
import dayjs from "dayjs";
import { Camera } from "lucide-react";
import Link from "next/link";
import BaseButton from "@/components/ui/BaseButton";
import BaseModal from "@/components/ui/BaseModal";
import { useScheduledCheckDetail } from "../hooks/use-scheduled-check";
import type { RandomCheckMode, ScheduledCheckResponse } from "../types";
import RandomCheckEvidencePhotoModal from "./RandomCheckEvidencePhotoModal";

interface Props {
  tenantId: string;
  check: ScheduledCheckResponse | null;
  checkId?: string | null;
  employeeName?: string;
  siteName?: string;
  onClose: () => void;
}

const outcomeMeta = {
  pass: { label: "Đạt", color: "success" },
  fail: { label: "Không đạt", color: "error" },
};

const failureLabels: Record<string, string> = {
  location_mismatch: "Ngoài geofence",
  face_fail: "Face ID không đạt/chưa đăng ký",
  liveness_fail: "Liveness không đạt",
  no_response: "Không phản hồi",
};

interface ConfigSnapshot {
  checkMode?: RandomCheckMode;
  checksPerShift?: number;
  minIntervalMinutes?: number;
  allowedStartTime?: string;
  allowedEndTime?: string;
  applicableRoles?: string[];
  responseWindowSeconds?: number;
}

function readSnapshot(snapshot?: string): ConfigSnapshot {
  if (!snapshot) return {};
  try {
    return JSON.parse(snapshot) as ConfigSnapshot;
  } catch {
    const modes: RandomCheckMode[] = [
      "location_face_liveness",
      "location_face",
      "location_only",
    ];
    return { checkMode: modes.find((mode) => snapshot.includes(mode)) };
  }
}

export default function ScheduledCheckDetailModal({
  tenantId,
  check,
  checkId,
  employeeName,
  siteName,
  onClose,
}: Props) {
  const [photoOpen, setPhotoOpen] = useState(false);
  const effectiveCheckId = check?.id || checkId || null;
  const detail = useScheduledCheckDetail(tenantId, effectiveCheckId);
  const data = detail.data?.data;
  const response = data?.response;
  const manualReason = data?.manualReason;
  const triggeredBy = data?.triggeredBy;
  const snapshot = readSnapshot(data?.configSnapshot || check?.configSnapshot);
  const mode = snapshot.checkMode;

  return (
    <BaseModal
      title="Chi tiết lượt kiểm tra ngẫu nhiên"
      isOpen={Boolean(effectiveCheckId)}
      onClose={onClose}
      hideFooter
      width={760}
    >
      {detail.isLoading ? (
        <div className="flex justify-center py-12"><Spin size="large" /></div>
      ) : detail.isError ? (
        <Alert type="error" showIcon title="Không thể tải chi tiết" description="Lượt kiểm tra không tồn tại hoặc nằm ngoài site-scope được cấp." />
      ) : data ? (
        <div className="space-y-4">
          {manualReason && (
            <Alert
              type="warning"
              showIcon
              title="Kiểm tra thủ công có chủ đích"
              description={`Lý do: ${manualReason}${triggeredBy ? ` · Người kích hoạt: ${triggeredBy}` : ""}`}
            />
          )}
          <Descriptions bordered size="small" column={{ xs: 1, sm: 2 }}>
            <Descriptions.Item label="Nhân viên">{employeeName || data.employeeId}</Descriptions.Item>
            <Descriptions.Item label="Công trình">{siteName || data.siteId}</Descriptions.Item>
            <Descriptions.Item label="Ngày">{dayjs(data.checkDate).format("DD/MM/YYYY")}</Descriptions.Item>
            <Descriptions.Item label="Giờ dự kiến">{dayjs(data.scheduledAt).format("DD/MM/YYYY HH:mm:ss")}</Descriptions.Item>
            <Descriptions.Item label="Hạn phản hồi">{data.expiresAt ? dayjs(data.expiresAt).format("DD/MM/YYYY HH:mm:ss") : "—"}</Descriptions.Item>
            <Descriptions.Item label="Trạng thái"><Tag>{data.status}</Tag></Descriptions.Item>
            <Descriptions.Item label="Mode theo snapshot" span={2}>{mode || "Không đọc được snapshot"}</Descriptions.Item>
            <Descriptions.Item label="Khung giờ policy">
              {snapshot.allowedStartTime && snapshot.allowedEndTime
                ? `${snapshot.allowedStartTime} – ${snapshot.allowedEndTime}`
                : "—"}
            </Descriptions.Item>
            <Descriptions.Item label="Thời gian phản hồi">
              {snapshot.responseWindowSeconds != null
                ? `${snapshot.responseWindowSeconds} giây`
                : "—"}
            </Descriptions.Item>
            <Descriptions.Item label="Số lượt/khoảng cách">
              {snapshot.checksPerShift != null
                ? `${snapshot.checksPerShift} lượt${snapshot.minIntervalMinutes != null ? ` · tối thiểu ${snapshot.minIntervalMinutes} phút` : ""}`
                : "—"}
            </Descriptions.Item>
            <Descriptions.Item label="Vai trò áp dụng">
              {snapshot.applicableRoles
                ? snapshot.applicableRoles.length > 0
                  ? snapshot.applicableRoles.join(", ")
                  : "Tất cả vai trò"
                : "—"}
            </Descriptions.Item>
          </Descriptions>

          {response ? (
            <Descriptions title="Bằng chứng phản hồi" bordered size="small" column={{ xs: 1, sm: 2 }}>
              <Descriptions.Item label="Kết quả">
                <Tag color={outcomeMeta[response.outcome]?.color}>{outcomeMeta[response.outcome]?.label || response.outcome}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Thời điểm phản hồi">{dayjs(response.respondedAt).format("DD/MM/YYYY HH:mm:ss")}</Descriptions.Item>
              <Descriptions.Item label="GPS">
                <a href={`https://www.google.com/maps?q=${response.latitude},${response.longitude}`} target="_blank" rel="noreferrer">
                  {response.latitude}, {response.longitude}
                </a>
              </Descriptions.Item>
              <Descriptions.Item label="Độ chính xác">{response.accuracyMeters != null ? `${response.accuracyMeters} m` : "—"}</Descriptions.Item>
              <Descriptions.Item label="Trong geofence">{response.locationVerified ? <Tag color="success">Đạt</Tag> : <Tag color="error">Không đạt</Tag>}</Descriptions.Item>
              <Descriptions.Item label="Face ID">{response.faceVerified == null ? "Không áp dụng/đang xử lý" : response.faceVerified ? <Tag color="success">Đạt</Tag> : <Tag color="error">Không đạt</Tag>}</Descriptions.Item>
              <Descriptions.Item label="Độ tin cậy Face ID">
                {response.faceVerifyScore == null
                  ? "—"
                  : `${(response.faceVerifyScore * 100).toFixed(1)}% (${response.faceVerifyScore.toFixed(3)})`}
              </Descriptions.Item>
              <Descriptions.Item label="Liveness">{response.livenessVerified == null ? "Không áp dụng/đang xử lý" : response.livenessVerified ? <Tag color="success">Đạt</Tag> : <Tag color="error">Không đạt</Tag>}</Descriptions.Item>
              <Descriptions.Item label="Lý do không đạt">
                {response.failureReason
                  ? response.failureReason.split(",").map((reason) => <Tag color="error" key={reason}>{failureLabels[reason.trim()] || reason.trim()}</Tag>)
                  : "—"}
              </Descriptions.Item>
              <Descriptions.Item label="Ảnh selfie bằng chứng" span={2}>
                {response.hasPhotoEvidence ? (
                  <BaseButton
                    size="small"
                    icon={<Camera className="h-4 w-4" />}
                    onClick={() => setPhotoOpen(true)}
                  >
                    Xem ảnh bằng chứng
                  </BaseButton>
                ) : "Không có ảnh được gửi/lưu cho lượt kiểm tra này"}
              </Descriptions.Item>
            </Descriptions>
          ) : (
            <Alert
              type={data.status === "no_response" ? "error" : "info"}
              showIcon
              title={data.status === "no_response" ? "Nhân viên không phản hồi" : "Chưa có bằng chứng phản hồi"}
              description="Bằng chứng GPS/Face ID chỉ xuất hiện sau khi nhân viên gửi phản hồi."
            />
          )}

          {(data.violations?.length ?? 0) > 0 && (
            <Descriptions title="Vi phạm phát sinh" bordered size="small" column={1}>
              {data.violations!.map((violation) => (
                <Descriptions.Item key={violation.id} label={violation.violationType}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <Tag color={violation.resolved ? "success" : "warning"}>{violation.resolved ? "Đã xử lý" : "Chưa xử lý"}</Tag>
                      <span className="text-sm text-slate-600">{violation.description || "Không có mô tả"}</span>
                    </div>
                    <Link className="text-sm font-semibold text-blue-600 hover:text-blue-700" href={`/customer/violations?scheduledCheckId=${data.id}`}>Xem đầy đủ</Link>
                  </div>
                </Descriptions.Item>
              ))}
            </Descriptions>
          )}
        </div>
      ) : null}

      {photoOpen && data?.id && (
        <RandomCheckEvidencePhotoModal
          tenantId={tenantId}
          checkId={data.id}
          employeeName={employeeName}
          open
          onClose={() => setPhotoOpen(false)}
        />
      )}
    </BaseModal>
  );
}
