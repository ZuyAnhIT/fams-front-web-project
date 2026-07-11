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
  createdAt: string;
  updatedAt: string;

  // Additional fields from global search (if any) or joined fields
  employeeName?: string;
  employeeCode?: string;
  siteName?: string;
}

export interface CheckinDetailResponse {
  id: string;
  tenantId: string;
  status: "valid" | "pending_review" | "rejected";
  message: string;
  gpsRiskScore: number;
  deviceId: string;
  
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
  
  employee: EmployeeInfo;
  site: SiteInfo;
  shift: ShiftInfo | null;
  
  createdAt: string;
  updatedAt: string;
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
