import { Tag, Tooltip } from "antd";
import { LockKeyhole } from "lucide-react";

interface AttendanceIssueBadgesProps {
  hasPendingReviewSession?: boolean;
  hasRejectedSession?: boolean;
  adjustmentReason?: string | null;
}

export default function AttendanceIssueBadges({
  hasPendingReviewSession,
  hasRejectedSession,
  adjustmentReason,
}: AttendanceIssueBadgesProps) {
  if (!hasPendingReviewSession && !hasRejectedSession && !adjustmentReason) {
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
    </div>
  );
}
