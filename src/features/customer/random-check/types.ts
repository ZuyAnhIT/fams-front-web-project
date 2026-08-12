export interface ScheduledCheckResponse {
  id: string;
  tenantId: string;
  assignmentId: string;
  employeeId: string;
  employeeName?: string | null;
  siteId: string;
  siteName?: string | null;
  shiftId: string;
  configId: string;
  checkDate: string;
  checkIndex: number;
  scheduledAt: string;
  expiresAt?: string | null;
  status: "pending" | "sent" | "responded" | "no_response" | "cancelled";
  createdAt: string;
  configSnapshot?: string;
  manualReason?: string | null;
  triggeredBy?: string | null;
  outcome?: "pass" | "fail" | null;
  failureReason?: string | null;
  /** Soft signal returned by POST /manual; never a hard rate limit. */
  manualTriggerCountToday?: number;
}

export interface ScheduledCheckViolationSummary {
  id: string;
  violationType: 'no_response' | 'location_fail' | 'face_fail' | 'liveness_fail' | 'face_verify_timeout';
  resolved: boolean;
  resolution: 'confirmed' | 'dismissed' | null;
  description: string | null;
}

export interface CheckResponseDetail {
  id: string;
  scheduledCheckId: string;
  employeeId: string;
  respondedAt: string;
  latitude: number;
  longitude: number;
  accuracyMeters: number | null;
  locationVerified: boolean;
  faceVerified: boolean | null;
  livenessVerified: boolean | null;
  faceVerifyScore?: number | null;
  outcome: "pass" | "fail";
  failureReason: string | null;
  hasPhotoEvidence: boolean;
  createdAt: string;
}

export interface ScheduledCheckDetailResponse extends ScheduledCheckResponse {
  response: CheckResponseDetail | null;
  violations?: ScheduledCheckViolationSummary[];
}

export interface ScheduledCheckListParams {
  tenantId: string;
  siteId?: string;
  employeeId?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  size?: number;
}

export interface ScheduledCheckSummaryResponse {
  counts: Partial<Record<ScheduledCheckResponse["status"] | "total", number>>;
  dateFrom?: string;
  dateTo?: string;
  siteId?: string;
}

export type RandomCheckMode =
  | "location_only"
  | "location_face"
  | "location_face_liveness";

export interface RandomCheckConfigResponse {
  id: string;
  tenantId: string;
  siteId: string | null;
  checksPerShift: number;
  minIntervalMinutes: number;
  allowedStartTime: string;
  allowedEndTime: string;
  checkMode: RandomCheckMode;
  applicableRoles: string[];
  responseWindowSeconds: number;
  failureEscalationThreshold: number;
  active: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  resolvedFrom?: "site_override" | "tenant_default" | null;
}

export interface RandomCheckConfigPayload {
  checksPerShift: number;
  minIntervalMinutes: number;
  allowedStartTime: string;
  allowedEndTime: string;
  checkMode: RandomCheckMode;
  applicableRoles: string[];
  responseWindowSeconds: number;
  failureEscalationThreshold?: number;
}

export interface UpdateRandomCheckConfigPayload
  extends Partial<RandomCheckConfigPayload> {
  isActive?: boolean;
}

export interface ManualCheckPayload {
  siteId: string;
  employeeId: string;
  reason: string;
  checkMode?: RandomCheckMode;
}
