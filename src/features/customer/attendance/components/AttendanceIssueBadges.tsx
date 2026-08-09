import { Tag, Tooltip } from "antd";
import { AlertTriangle, Crosshair, LockKeyhole } from "lucide-react";

interface AttendanceIssueBadgesProps {
  hasPendingReviewSession?: boolean;
  hasRejectedSession?: boolean;
  adjustmentReason?: string | null;
  hasRandomCheckFailure?: boolean;
  otDailyLimitExceeded?: boolean;
  otWeeklyLimitExceeded?: boolean;
}

export default function AttendanceIssueBadges({
  hasPendingReviewSession,
  hasRejectedSession,
  adjustmentReason,
  hasRandomCheckFailure,
  otDailyLimitExceeded,
  otWeeklyLimitExceeded,
}: AttendanceIssueBadgesProps) {
  if (!hasPendingReviewSession && !hasRejectedSession && !adjustmentReason && !hasRandomCheckFailure && !otDailyLimitExceeded && !otWeeklyLimitExceeded) {
    return <span className="text-slate-400">—</span>;
  }

  return (
    <div className="flex max-w-56 flex-wrap gap-1">
      {hasPendingReviewSession && (
        <Tooltip title="Có chấm công đang chờ HR duyệt — số liệu ngày này có thể thay đổi.">
          <Tag color="warning">Chờ duyệt</Tag>
        </Tooltip>
      )}
      {hasRejectedSession && (
        <Tooltip title="Có chấm công đã bị từ chối và không được tính vào công.">
          <Tag color="error">Đã từ chối</Tag>
        </Tooltip>
      )}
      {adjustmentReason && (
        <Tooltip title={`Lý do: ${adjustmentReason}`}>
          <Tag color="blue" icon={<LockKeyhole className="h-3 w-3" />}>
            Điều chỉnh tay
          </Tag>
        </Tooltip>
      )}
      {hasRandomCheckFailure && (
        <Tooltip title="Có random check thất bại hoặc không phản hồi. Đây là tín hiệu audit để HR xem xét, không tự động trừ giờ công/lương.">
          <Tag color="orange" icon={<Crosshair className="h-3 w-3" />}>
            Random check
          </Tag>
        </Tooltip>
      )}
      {otDailyLimitExceeded && (
        <Tooltip title="OT ngày vượt ngưỡng cấu hình của ca. Đây chỉ là cảnh báo; số phút OT vẫn được giữ nguyên và không khóa thao tác.">
          <Tag color="warning" icon={<AlertTriangle className="h-3 w-3" />}>Vượt OT ngày</Tag>
        </Tooltip>
      )}
      {otWeeklyLimitExceeded && (
        <Tooltip title="Tổng OT tuần ISO của nhân viên vượt ngưỡng cấu hình. Đây chỉ là cảnh báo, không tự cắt OT/lương.">
          <Tag color="warning" icon={<AlertTriangle className="h-3 w-3" />}>Vượt OT tuần</Tag>
        </Tooltip>
      )}
    </div>
  );
}
