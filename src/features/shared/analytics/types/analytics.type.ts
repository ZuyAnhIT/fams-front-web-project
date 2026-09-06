export interface RevenueReport {
  from: string; to: string;
  kpis: { collectedRevenue: number; currentMrr: number; trialConversionRate: number; renewalRate: number; churnRate: number; averageRevenuePerCompany: number; paymentSuccessRate: number };
  subscriptionStatus: Record<string, number>;
  paymentStatus: Record<string, number>;
  trend: Array<{ period: string; collectedRevenue: number; mrr: number }>;
  byPlan: Array<{ planId: string; planName: string; collectedRevenue: number; paidOrders: number; activeSubscriptions: number; revenueShare: number }>;
  funnel: { trial: number; paid: number; activated: number; renewed: number };
  expiringSubscriptions: Array<{ tenantId: string; tenantName: string; planName: string; billingCycle: string; expiresAt: string; daysRemaining: number }>;
}

export interface CustomerHealthReport {
  from: string; to: string;
  kpis: { totalTenants: number; newTenants: number; activeTenants: number; suspendedTenants: number; totalUsers: number; activeUsers7d: number; activeUsers30d: number; employees: number; sites: number; checkins: number };
  growth: Array<{ period: string; newTenants: number; newUsers: number }>;
  moduleUsage: Record<string, number>;
  inactivityBuckets: Record<string, number>;
  tenantsAtRisk: TenantHealth[];
  tenantsNearPlanLimit: TenantHealth[];
}

export interface TenantHealth {
  tenantId: string; tenantName: string; planName: string; subscriptionStatus: string;
  healthScore: number; riskLevel: "LOW" | "MEDIUM" | "HIGH"; maxPlanUsagePercent: number;
  employees: number; sites: number; checkins30d: number; randomChecks30d: number;
  lastActivityAt: string; inactiveDays: number; recommendedAction: string;
}

export interface AnalyticsFilters { from: string; to: string; siteId?: string; workspaceId?: string; shiftId?: string; employeeId?: string }
export interface PlatformAnalyticsFilters { tenantId?: string; planId?: string; subscriptionStatus?: string }

export interface WorkforceReport {
  from: string; to: string;
  kpis: { assignedOccurrences: number; presentOccurrences: number; absentOccurrences: number; attendanceRate: number; absenceRate: number; lateRate: number; earlyLeaveRate: number; missingCheckoutRate: number; totalWorkMinutes: number; totalOtMinutes: number; averageWorkMinutesPerEmployee: number };
  comparison: { attendanceRateChange: number; lateRateChange: number; absenceRateChange: number; workMinutesChange: number; otMinutesChange: number };
  dailyTrend: Array<{ date: string; assigned: number; present: number; absent: number; late: number; earlyLeave: number; missingCheckout: number; workMinutes: number; otMinutes: number }>;
  bySite: Array<{ siteId: string; siteName: string; assigned: number; present: number; absent: number; attendanceRate: number; workMinutes: number; otMinutes: number }>;
  shortageByWeekday: Array<{ isoDayOfWeek: number; weekday: string; assigned: number; absent: number; absenceRate: number }>;
}

export interface RiskReport {
  from: string; to: string;
  kpis: { violations: number; checkins: number; violationsPer100Checkins: number; unresolved: number; overdue: number; averageResolutionHours: number; medianResolutionHours: number; acceptedExplanationRate: number; randomCheckPassRate: number; faceEnrollmentRate: number; attendanceImpactViolations: number };
  byType: Record<string, number>;
  aging: Record<string, number>;
  funnel: { detected: number; explained: number; reviewed: number; confirmed: number; dismissed: number };
  trend: Array<{ date: string; violationType: string; count: number }>;
  siteRisk: Array<{ siteId: string; siteName: string; violationType: string; count: number; per100Checkins: number }>;
  repeatOffenders: Array<{ employeeId: string; employeeName: string; employeeCode?: string; violations: number; unresolved: number }>;
}
