import { useMutation, useQuery } from "@tanstack/react-query";
import { attendanceService } from "../services/attendance.service";
import type { AttendanceListParams } from "../types/attendance.type";

export const attendanceKeys = {
  all: (tenantId?: string) => ["attendance", tenantId] as const,
  summaries: (tenantId: string | undefined, params: AttendanceListParams) =>
    [...attendanceKeys.all(tenantId), "summaries", params] as const,
  monthly: (
    tenantId: string | undefined,
    params: { year: number; month: number; employeeId?: string; siteId?: string; page?: number; size?: number }
  ) => [...attendanceKeys.all(tenantId), "monthly", params] as const,
};

export function useAttendanceSummaries(
  tenantId: string | undefined,
  params: AttendanceListParams
) {
  return useQuery({
    queryKey: attendanceKeys.summaries(tenantId, params),
    queryFn: () => attendanceService.listSummaries(tenantId!, params),
    enabled: Boolean(tenantId),
  });
}

export function useMonthlyAttendance(
  tenantId: string | undefined,
  params: { year: number; month: number; employeeId?: string; siteId?: string; page?: number; size?: number }
) {
  return useQuery({
    queryKey: attendanceKeys.monthly(tenantId, params),
    queryFn: () => attendanceService.listMonthlyAttendance(tenantId!, params),
    enabled: Boolean(tenantId),
  });
}

export function useExportMonthlyAttendance() {
  return useMutation({
    mutationFn: ({
      tenantId,
      params,
    }: {
      tenantId: string;
      params: { year: number; month: number; siteId?: string };
    }) => attendanceService.exportMonthlyAttendance(tenantId, params),
  });
}
