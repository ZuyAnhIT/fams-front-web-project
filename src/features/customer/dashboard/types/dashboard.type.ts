export interface EmployeeDashboard {
  todayShifts: Array<{
    assignmentId: string;
    siteId: string;
    siteName: string;
    role: string;
    shift: { shiftId: string; name: string; startTime: string; endTime: string } | null;
  }>;
  checkin: {
    checkinId: string;
    siteId: string;
    status: 'valid' | 'pending_review' | 'rejected';
    checkInAt: string;
    checkOutAt: string | null;
    workMinutes: number | null;
    open: boolean;
  } | null;
  monthlyAttendance: {
    month: string;
    presentDays: number;
    lateDays: number;
    earlyLeaveDays: number;
    missingCheckoutDays: number;
    totalOtMinutes: number;
    totalWorkMinutes: number;
  };
  alerts: { unreadNotifications: number; pendingExplanations: number };
}

export interface HrDashboard {
  personnel: { totalEmployees: number; newThisMonth: number };
  attendance: { presentToday: number; lateToday: number; onSiteNow: number };
  violations: {
    unresolved: number;
    resolvedThisMonth: number;
    unresolvedByType: Partial<Record<'no_response' | 'location_fail' | 'face_fail' | 'liveness_fail', number>>;
  };
  sites: { totalSites: number; employeesOnSiteNow: number };
}

export interface SupervisorOnSiteEmployee {
  employeeId: string;
  firstName: string;
  lastName: string;
  employeeCode: string | null;
  checkinId: string;
  checkInAt: string;
}

export interface SupervisorSiteSummary {
  siteId: string;
  siteName: string;
  expectedToday: number;
  onSiteNow: number;
  onSiteEmployees: SupervisorOnSiteEmployee[];
}

export interface SupervisorDashboard {
  supervisedSites: SupervisorSiteSummary[];
}
