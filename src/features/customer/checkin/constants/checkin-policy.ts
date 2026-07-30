export type CheckinPolicy =
  | "gps_only"
  | "gps_face"
  | "gps_face_liveness";

export const CHECKIN_POLICY_META: Record<
  CheckinPolicy,
  {
    label: string;
    shortLabel: string;
    description: string;
    color: string;
  }
> = {
  gps_only: {
    label: "GPS và geofence",
    shortLabel: "GPS",
    description:
      "Chỉ kiểm tra vị trí trong vùng chấm công, không yêu cầu camera.",
    color: "default",
  },
  gps_face: {
    label: "GPS + Face ID",
    shortLabel: "GPS + Face ID",
    description:
      "Yêu cầu Face ID đã duyệt; chấp nhận ảnh tĩnh hoặc active liveness.",
    color: "blue",
  },
  gps_face_liveness: {
    label: "GPS + Face ID + liveness",
    shortLabel: "GPS + liveness",
    description:
      "Mức cao nhất: bắt buộc quay đầu/nháy mắt theo challenge thời gian thực.",
    color: "purple",
  },
};

export const CHECKIN_POLICY_OPTIONS = (
  Object.entries(CHECKIN_POLICY_META) as Array<
    [CheckinPolicy, (typeof CHECKIN_POLICY_META)[CheckinPolicy]]
  >
).map(([value, meta]) => ({
  value,
  label: meta.label,
}));

export function normalizeCheckinPolicy(
  value: string | null | undefined,
): CheckinPolicy {
  if (value === "gps_face" || value === "gps_face_liveness") return value;
  return "gps_only";
}
