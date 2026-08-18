import type { PageResponse } from '@/types/api';
import type { AttendanceHrMonthlyResponse, AttendanceSummaryResponse } from '@/features/customer/attendance/types/attendance.type';
import type { CheckinResponse } from '@/features/customer/checkin/types/checkin.type';
import type { EmployeeResponse } from '@/features/customer/employee/types/employee.type';
import type { SiteResponse } from '@/features/customer/site/types/site.type';
import type { ViolationListItem, ViolationType } from '@/features/customer/violation/types/violation.type';

export interface DailyAttendanceReportParams {
  date: string;
  siteId?: string;
  workspaceId?: string;
  page?: number;
  size?: number;
}

export interface DailyAttendanceReport {
  date: string;
  siteId: string | null;
  totalPresent: number;
  totalAbsent: number;
  totalLate: number;
  totalEarlyLeave: number;
  totalMissingCheckout: number;
  totalWorkMinutes: number;
  totalOtMinutes: number;
  absentEmployees: EmployeeRef[];
  records: PageResponse<AttendanceSummaryResponse>;
}

export interface EmployeeRef {
  employeeId: string;
  employeeName: string;
  employeeCode: string | null;
}

export interface MonthlyAttendanceReportParams {
  year: number;
  month: number;
  siteId?: string;
  workspaceId?: string;
  page?: number;
  size?: number;
}

export interface MonthlyAttendanceReport {
  year: number;
  month: number;
  siteId: string | null;
  totalEmployees: number;
  totalPresentDays: number;
  totalWorkMinutes: number;
  totalLateDays: number;
  totalLateMinutes: number;
  totalEarlyLeaveDays: number;
  totalEarlyLeaveMinutes: number;
  totalMissingCheckoutDays: number;
  totalOtMinutes: number;
  totalRowsWithPendingReview: number;
  totalRowsWithRejectedSession: number;
  totalRowsWithRandomCheckFailure: number;
  records: PageResponse<AttendanceHrMonthlyResponse>;
}

export interface ViolationReportParams {
  from?: string;
  to?: string;
  siteId?: string;
  workspaceId?: string;
  employeeId?: string;
  violationType?: ViolationType;
  page?: number;
  size?: number;
}

export interface ViolationExportParams extends ViolationReportParams {
  resolved?: boolean;
}

export interface ViolationReport {
  from: string | null;
  to: string | null;
  siteId: string | null;
  employeeId: string | null;
  violationType: ViolationType | null;
  totalViolations: number;
  resolvedCount: number;
  unresolvedCount: number;
  affectsAttendanceCount: number;
  byViolationType: Partial<Record<ViolationType, number>>;
  bySeverity: Partial<Record<'HIGH' | 'MEDIUM' | 'LOW', number>>;
  bySite: Record<string, number>;
  byEmployee: Record<string, number>;
  records: PageResponse<ViolationListItem>;
}

export interface SitePresenceEntry {
  siteId: string;
  siteName: string;
  timezone: string;
  assignedCount: number;
  presentCount: number;
  absentCount: number;
  presentEmployees: EmployeeRef[];
  absentEmployees: EmployeeRef[];
}

export interface SitePresenceReport {
  reportedAt: string;
  totalSites: number;
  totalPresent: number;
  totalAssigned: number;
  totalAbsent: number;
  sites: PageResponse<SitePresenceEntry>;
}

export interface SitePresenceParams {
  siteId?: string;
  page?: number;
  size?: number;
}

export interface GlobalSearchResponse {
  query: string;
  limit: number;
  employees: EmployeeResponse[];
  sites: SiteResponse[];
  checkins: CheckinResponse[];
}

export interface AttendanceExportParams {
  year: number;
  month: number;
  siteId?: string;
  workspaceId?: string;
  confirmDespiteWarnings?: boolean;
}
