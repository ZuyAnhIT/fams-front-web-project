import { Descriptions, Tag } from "antd";
import type { RandomCheckConfigResponse, RandomCheckMode } from "../types";

const modeMeta: Record<RandomCheckMode, { label: string; color: string }> = {
  location_only: { label: "Chỉ GPS", color: "blue" },
  location_face: { label: "GPS + Face ID", color: "purple" },
  location_face_liveness: { label: "GPS + Face ID + Liveness", color: "magenta" },
};

export default function RandomCheckConfigSummary({
  config,
}: {
  config: RandomCheckConfigResponse;
}) {
  return (
    <Descriptions bordered size="small" column={{ xs: 1, sm: 2, lg: 3 }}>
      <Descriptions.Item label="Trạng thái">
        <Tag color={config.active ? "success" : "default"}>
          {config.active ? "Đang áp dụng" : "Tạm ngừng"}
        </Tag>
      </Descriptions.Item>
      <Descriptions.Item label="Mode">
        <Tag color={modeMeta[config.checkMode].color}>
          {modeMeta[config.checkMode].label}
        </Tag>
      </Descriptions.Item>
      <Descriptions.Item label="Số lần/ca">
        {config.checksPerShift} lần
      </Descriptions.Item>
      <Descriptions.Item label="Khung giờ">
        {config.windowMode === "full_shift"
          ? "Toàn bộ thời gian từng ca"
          : config.allowedStartTime && config.allowedEndTime
            ? `${config.allowedStartTime.slice(0, 5)}–${config.allowedEndTime.slice(0, 5)}`
            : "Chưa cấu hình khung giờ"}
      </Descriptions.Item>
      <Descriptions.Item label="Khoảng cách tối thiểu">
        {config.minIntervalMinutes} phút
      </Descriptions.Item>
      <Descriptions.Item label="Thời gian phản hồi">
        {config.responseWindowSeconds} giây
      </Descriptions.Item>
      <Descriptions.Item label="Vai trò áp dụng" span={2}>
        {config.applicableRoles.length === 0 ? (
          <Tag color="cyan">Tất cả vai trò tại site</Tag>
        ) : (
          config.applicableRoles.map((role) => <Tag key={role}>{role}</Tag>)
        )}
      </Descriptions.Item>
      <Descriptions.Item label="Ngưỡng cảnh báo tháng">
        {config.failureEscalationThreshold} lần fail/không phản hồi
      </Descriptions.Item>
      <Descriptions.Item label="Kiểm tra thủ công">
        <Tag color={config.manualChecksAllowed ? "success" : "default"}>
          {config.manualChecksAllowed ? "Cho phép" : "Không cho phép"}
        </Tag>
      </Descriptions.Item>
    </Descriptions>
  );
}
