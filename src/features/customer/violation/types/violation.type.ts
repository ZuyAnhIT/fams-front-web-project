import type { PageResponse } from '@/types/api';

// face_verify_timeout (2026-08-12, backend V89 migration): the async face/liveness AI callback
// never arrived within the timeout window — likely an AI service outage, not necessarily a real
// verification failure. Distinct from face_fail/liveness_fail so HR can tell the two apart.
export type ViolationType = 'no_response' | 'location_fail' | 'face_fail' | 'liveness_fail' | 'face_verify_timeout';

export interface ViolationListItem {
  id: string;
  employeeId: string;
  siteId: string;
  violationType: ViolationType;
  checkDate: string;
  description: string | null;
  resolved: boolean;
  resolvedAt: string | null;
  employeeNote: string | null;
  employeePhotoUrl: string | null;
  createdAt: string;
  resolution: 'confirmed' | 'dismissed' | null;
  affectsAttendance: boolean;
}

export interface ViolationScheduledCheckSummary {
  id: string;
  scheduledAt: string;
  expiresAt: string | null;
  status: string;
  checkIndex: number;
}

export interface ViolationCheckResponseEvidence {
  id: string;
  respondedAt: string;
  latitude: number;
  longitude: number;
  accuracyMeters: number | null;
  faceImageUrl: string | null;
  livenessScore: number | null;
  locationVerified: boolean;
  faceVerified: boolean | null;
  livenessVerified: boolean | null;
  outcome: 'pass' | 'fail';
  failureReason: string | null;
}

/** Evidence from the regular check-in this violation came from (#115, 2026-08-18). */
export interface ViolationCheckinEvidence {
  id: string;
  status: string;
  checkInAt: string;
  checkInLat: number;
  checkInLon: number;
  checkInAccuracy: number | null;
  checkInInsideGeofence: boolean;
  faceVerified: boolean | null;
  livenessVerified: boolean | null;
  faceVerifyScore: number | null;
}

export interface ViolationDetail extends ViolationListItem {
  tenantId: string;
  scheduledCheckId: string | null;
  checkResponseId: string | null;
  checkinId: string | null;
  resolvedBy: string | null;
  resolutionReason: string | null;
  scheduledCheck: ViolationScheduledCheckSummary | null;
  checkResponse: ViolationCheckResponseEvidence | null;
  checkin: ViolationCheckinEvidence | null;
}

export interface ViolationListParams {
  employeeId?: string;
  siteId?: string;
  violationType?: ViolationType;
  resolved?: boolean;
  /** Whether the violation affects the employee's attendance summary (#114, 2026-08-18). */
  affectsAttendance?: boolean;
  from?: string;
  to?: string;
  scheduledCheckId?: string;
  sortBy?: 'checkDate' | 'createdAt' | 'violationType' | 'employeeId' | 'siteId';
  sortDir?: 'asc' | 'desc';
  page?: number;
  size?: number;
}

export interface ViolationActionResponse {
  id: string;
  resolution: 'confirmed' | 'dismissed';
  resolutionReason: string | null;
  resolved: boolean;
  resolvedAt: string;
  resolvedBy: string;
}

export type ViolationPage = PageResponse<ViolationListItem>;

export interface MyExceptionItem {
  id: string;
  sourceType: 'checkin' | 'violation';
  reasonType: string;
  date: string | null;
  description: string | null;
  explainEndpoint: string;
  hasExplanation: boolean;
  employeeNote: string | null;
  createdAt: string | null;
}

export interface SubmitExplanationRequest {
  note: string;
  photo?: File;
}

export interface ExplanationResponse {
  id: string;
  employeeNote: string;
  employeePhotoUrl: string | null;
  updatedAt: string;
}
