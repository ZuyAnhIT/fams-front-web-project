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
