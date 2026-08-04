import type { CheckinPolicy } from "../constants/checkin-policy";

export interface EmployeeInfo {
  id: string;
  firstName: string;
  lastName: string;
  employeeCode: string;
  position: string;
  department: string;
}

export interface SiteInfo {
  id: string;
  name: string;
  code: string;
  address: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

export interface ShiftInfo {
  id: string;
  name: string;
  startTime: string; // e.g., "08:00:00"
  endTime: string;
  allowOvernight: boolean;
  earlyCheckinMinutes: number;
  lateCheckoutMinutes: number;
}

export interface CheckinResponse {
  id: string;
  tenantId: string;
  employeeId: string;
  siteId: string;
  shiftId: string | null;
  assignmentId: string;
  status: "valid" | "pending_review" | "rejected";
  message: string;
  
  checkInAt: string | null; // ISO 8601 string
  checkInLat: number | null;
  checkInLon: number | null;
  checkInAccuracy: number | null;
  checkInInsideGeofence: boolean | null;
  
  checkOutAt: string | null;
  checkOutLat: number | null;
  checkOutLon: number | null;
  checkOutAccuracy: number | null;
  checkOutInsideGeofence: boolean | null;
  
  workMinutes: number | null;
  gpsRiskScore: number;
  deviceId: string | null;
  faceVerified: boolean | null;
  livenessVerified: boolean | null;
  faceVerifyScore: number | null;
  checkoutFaceVerified: boolean | null;
  checkoutLivenessVerified: boolean | null;
  checkoutFaceVerifyScore: number | null;
  effectiveCheckinPolicy: CheckinPolicy | null;
  source: "online" | "offline";
  createdAt: string;
  updatedAt: string;

  employeeName: string | null;
  employeeCode: string | null;
  siteName: string | null;
}

export interface CheckinDetailResponse {
  id: string;
  tenantId: string;
  status: "valid" | "pending_review" | "rejected";
  message: string;
  gpsRiskScore: number;
  deviceId: string | null;
  
  checkInAt: string;
  checkInLat: number;
  checkInLon: number;
  checkInAccuracy: number;
  checkInInsideGeofence: boolean;
  
  checkOutAt: string | null;
  checkOutLat: number | null;
  checkOutLon: number | null;
  checkOutAccuracy: number | null;
  checkOutInsideGeofence: boolean | null;
  
  workMinutes: number | null;
  faceVerified: boolean | null;
  livenessVerified: boolean | null;
  faceVerifyScore: number | null;
  checkoutFaceVerified: boolean | null;
  checkoutLivenessVerified: boolean | null;
  checkoutFaceVerifyScore: number | null;
  effectiveCheckinPolicy: CheckinPolicy | null;
  source: "online" | "offline";
  note: string | null;
  clientNonce: string | null;
  overriddenBy: string | null;
  overriddenAt: string | null;
  employeeNote: string | null;
  employeePhotoUrl: string | null;
  
  employee: EmployeeInfo | null;
  site: SiteInfo | null;
  shift: ShiftInfo | null;
  
  createdAt: string;
  updatedAt: string;
}

export interface OverrideCheckinRequest {
  status: "valid" | "rejected";
  reason: string;
}

export interface CheckinListParams {
  employeeId?: string;
  siteId?: string;
  status?: string;
  from?: string;
  to?: string;
  sortBy?: string;
  sortDir?: "asc" | "desc";
  page?: number;
  size?: number;
}
