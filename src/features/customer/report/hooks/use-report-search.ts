import { useMutation, useQuery } from '@tanstack/react-query';
import { reportSearchService } from '../services/report-search.service';
import type {
  AttendanceExportParams,
  DailyAttendanceReportParams,
  MonthlyAttendanceReportParams,
  SitePresenceParams,
  ViolationReportParams,
  ViolationExportParams,
} from '../types/report-search.type';

export const reportSearchKeys = {
  all: (tenantId?: string) => ['report-search', tenantId] as const,
  daily: (tenantId: string | undefined, params: DailyAttendanceReportParams) =>
    [...reportSearchKeys.all(tenantId), 'daily', params] as const,
  monthly: (tenantId: string | undefined, params: MonthlyAttendanceReportParams) =>
    [...reportSearchKeys.all(tenantId), 'monthly', params] as const,
  violations: (tenantId: string | undefined, params: ViolationReportParams) =>
    [...reportSearchKeys.all(tenantId), 'violations', params] as const,
  presence: (tenantId: string | undefined, params: SitePresenceParams) =>
    [...reportSearchKeys.all(tenantId), 'presence', params] as const,
  search: (tenantId: string | undefined, q: string, limit: number) =>
    [...reportSearchKeys.all(tenantId), 'search', q, limit] as const,
};

export function useDailyAttendanceReport(tenantId: string | undefined, params: DailyAttendanceReportParams) {
  return useQuery({
    queryKey: reportSearchKeys.daily(tenantId, params),
    queryFn: () => reportSearchService.dailyAttendance(tenantId!, params),
    enabled: Boolean(tenantId && params.date),
  });
}

export function useMonthlyAttendanceReport(tenantId: string | undefined, params: MonthlyAttendanceReportParams) {
  return useQuery({
    queryKey: reportSearchKeys.monthly(tenantId, params),
    queryFn: () => reportSearchService.monthlyAttendance(tenantId!, params),
    enabled: Boolean(tenantId && params.year && params.month),
  });
}

export function useViolationReport(tenantId: string | undefined, params: ViolationReportParams) {
  return useQuery({
    queryKey: reportSearchKeys.violations(tenantId, params),
    queryFn: () => reportSearchService.violationReport(tenantId!, params),
    enabled: Boolean(tenantId),
  });
}

export function useSitePresenceReport(tenantId: string | undefined, params: SitePresenceParams) {
  return useQuery({
    queryKey: reportSearchKeys.presence(tenantId, params),
    queryFn: () => reportSearchService.sitePresence(tenantId!, params),
    enabled: Boolean(tenantId),
    refetchInterval: 60_000,
  });
}

export function useGlobalSearch(tenantId: string | undefined, q: string, limit = 5) {
  return useQuery({
    queryKey: reportSearchKeys.search(tenantId, q, limit),
    queryFn: () => reportSearchService.globalSearch(tenantId!, q, limit),
    enabled: Boolean(tenantId && q.trim().length >= 2),
    staleTime: 30_000,
  });
}

export function useExportAttendanceReport() {
  return useMutation({
    mutationFn: ({ tenantId, params }: { tenantId: string; params: AttendanceExportParams }) =>
      reportSearchService.exportAttendance(tenantId, params),
  });
}

export function useExportViolationReport() {
  return useMutation({
    mutationFn: ({ tenantId, params }: { tenantId: string; params: ViolationExportParams }) =>
      reportSearchService.exportViolations(tenantId, params),
  });
}
