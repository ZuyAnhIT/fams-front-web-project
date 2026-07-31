export interface AttendanceSummaryResponse {
  id: string;
  tenantId: string;
  employeeId: string;
  employeeName: string;
  siteId: string;
  siteName: string;
  shiftId: string | null;
  assignmentId: string | null;
  attendanceDate: string; // "yyyy-MM-dd"
  firstCheckinAt: string | null;
  lastCheckoutAt: string | null;
  totalWorkMinutes: number;
  sessionCount: number;
  status: "present" | "incomplete";
  late: boolean;
  lateMinutes: number;
  earlyLeave: boolean;
  earlyLeaveMinutes: number;
  otMinutes: number;
  missingCheckout: boolean;
  hasPendingReviewSession: boolean;
  hasRejectedSession: boolean;
  createdAt: string;
  updatedAt: string;
  adjustmentReason: string | null;
}

export interface AttendanceHrMonthlyResponse {
  tenantId: string;
  employeeId: string;
  employeeName: string;
  siteId: string;
  siteName: string;
  year: number;
  month: number;
  presentDays: number;
  totalWorkMinutes: number;
  lateDays: number;
  totalLateMinutes: number;
  earlyLeaveDays: number;
  totalEarlyLeaveMinutes: number;
  totalOtMinutes: number;
  missingCheckoutDays: number;
  daysWithPendingReview: number;
  daysWithRejectedSession: number;
}

export interface AdjustAttendanceSummaryRequest {
  totalWorkMinutes?: number;
  status?: "present" | "incomplete";
  late?: boolean;
  lateMinutes?: number;
  earlyLeave?: boolean;
  earlyLeaveMinutes?: number;
  otMinutes?: number;
  missingCheckout?: boolean;
  reason: string;
}

export interface UnlockAttendanceSummaryRequest {
  reason: string;
}

export interface RecomputeAttendanceRequest {
  date: string;
  siteId?: string;
}

export interface AttendanceListParams {
  employeeId?: string;
  siteId?: string;
  status?: string;
  from?: string; // yyyy-MM-dd
  to?: string;   // yyyy-MM-dd
  page?: number;
  size?: number;
}

export interface AttendanceMonthlyParams {
  year: number;
  month: number;
  employeeId?: string;
  siteId?: string;
  page?: number;
  size?: number;
}
