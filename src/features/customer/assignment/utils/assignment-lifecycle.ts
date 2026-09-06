export type AssignmentLifecycleStatus =
  | "upcoming"
  | "effective"
  | "completed"
  | "cancelled";

interface AssignmentLifecycleMeta {
  label: string;
  badgeStatus: "success" | "processing" | "default" | "error";
  tagColor: "success" | "processing" | "default" | "error";
}

const LIFECYCLE_META: Record<AssignmentLifecycleStatus, AssignmentLifecycleMeta> = {
  upcoming: { label: "Sắp bắt đầu", badgeStatus: "processing", tagColor: "processing" },
  effective: { label: "Đang hiệu lực", badgeStatus: "success", tagColor: "success" },
  completed: { label: "Đã kết thúc", badgeStatus: "default", tagColor: "default" },
  cancelled: { label: "Đã hủy", badgeStatus: "error", tagColor: "error" },
};

/**
 * `status=active` only means the assignment record has not been cancelled. It
 * never proves an employee is currently working; that requires an open
 * check-in session. New API responses provide the time-aware lifecycle.
 */
export function getAssignmentLifecycleMeta(
  lifecycleStatus: AssignmentLifecycleStatus | null | undefined,
  recordStatus: "active" | "cancelled",
): AssignmentLifecycleMeta {
  if (lifecycleStatus && LIFECYCLE_META[lifecycleStatus]) {
    return LIFECYCLE_META[lifecycleStatus];
  }
  return recordStatus === "cancelled"
    ? LIFECYCLE_META.cancelled
    : LIFECYCLE_META.effective;
}
