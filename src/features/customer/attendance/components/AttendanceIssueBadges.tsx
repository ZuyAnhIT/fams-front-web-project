import { Tag, Tooltip } from "antd";
import { Crosshair, LockKeyhole } from "lucide-react";

interface AttendanceIssueBadgesProps {
  hasPendingReviewSession?: boolean;
  hasRejectedSession?: boolean;
  adjustmentReason?: string | null;
  hasRandomCheckFailure?: boolean;
}

export default function AttendanceIssueBadges({
  hasPendingReviewSession,
  hasRejectedSession,
  adjustmentReason,
  hasRandomCheckFailure,
}: AttendanceIssueBadgesProps) {
  if (!hasPendingReviewSession && !hasRejectedSession && !adjustmentReason && !hasRandomCheckFailure) {
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
    </div>
  );
}
