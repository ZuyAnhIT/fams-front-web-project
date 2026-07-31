import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { attendanceService } from "../services/attendance.service";
import type {
  AdjustAttendanceSummaryRequest,
  AttendanceListParams,
  AttendanceMonthlyParams,
  RecomputeAttendanceRequest,
  UnlockAttendanceSummaryRequest,
} from "../types/attendance.type";

export const attendanceKeys = {
  all: (tenantId?: string) => ["attendance", tenantId] as const,
  summaries: (tenantId: string | undefined, params: AttendanceListParams) =>
    [...attendanceKeys.all(tenantId), "summaries", params] as const,
  monthly: (
    tenantId: string | undefined,
    params: AttendanceMonthlyParams,
  ) => [...attendanceKeys.all(tenantId), "monthly", params] as const,
  detail: (tenantId: string | undefined, summaryId: string | null) =>
    [...attendanceKeys.all(tenantId), "detail", summaryId] as const,
};

export function useAttendanceSummaries(
  tenantId: string | undefined,
  params: AttendanceListParams,
  enabled = true,
) {
  return useQuery({
    queryKey: attendanceKeys.summaries(tenantId, params),
    queryFn: () => attendanceService.listSummaries(tenantId!, params),
    enabled: Boolean(tenantId) && enabled,
  });
}

export function useMonthlyAttendance(
  tenantId: string | undefined,
  params: AttendanceMonthlyParams,
  enabled = true,
) {
  return useQuery({
    queryKey: attendanceKeys.monthly(tenantId, params),
    queryFn: () => attendanceService.listMonthlyAttendance(tenantId!, params),
    enabled: Boolean(tenantId) && enabled,
  });
}

export function useAttendanceSummaryDetail(
  tenantId: string | undefined,
  summaryId: string | null,
) {
  return useQuery({
    queryKey: attendanceKeys.detail(tenantId, summaryId),
    queryFn: () => attendanceService.getSummary(tenantId!, summaryId!),
    enabled: Boolean(tenantId && summaryId),
    retry: (failureCount, error) => {
      const status = (error as { response?: { status?: number } }).response?.status;
      return status !== 403 && status !== 404 && failureCount < 2;
    },
  });
}

export function useAdjustAttendanceSummary() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      tenantId,
      summaryId,
      payload,
    }: {
      tenantId: string;
      summaryId: string;
      payload: AdjustAttendanceSummaryRequest;
    }) => attendanceService.adjustSummary(tenantId, summaryId, payload),
    onSuccess: (updated, variables) => {
      queryClient.setQueryData(
        attendanceKeys.detail(variables.tenantId, variables.summaryId),
        updated,
      );
      queryClient.invalidateQueries({ queryKey: attendanceKeys.all(variables.tenantId) });
    },
  });
}

export function useUnlockAttendanceSummary() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      tenantId,
      summaryId,
      payload,
    }: {
      tenantId: string;
      summaryId: string;
      payload: UnlockAttendanceSummaryRequest;
    }) => attendanceService.unlockAndRecompute(tenantId, summaryId, payload),
    onSuccess: (updated, variables) => {
      queryClient.setQueryData(
        attendanceKeys.detail(variables.tenantId, variables.summaryId),
        updated,
      );
      queryClient.invalidateQueries({ queryKey: attendanceKeys.all(variables.tenantId) });
    },
  });
}

export function useRecomputeAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      tenantId,
      params,
    }: {
      tenantId: string;
      params: RecomputeAttendanceRequest;
    }) => attendanceService.recompute(tenantId, params),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: attendanceKeys.all(variables.tenantId) });
    },
  });
}

export function useExportMonthlyAttendance() {
  return useMutation({
    mutationFn: ({
      tenantId,
      params,
    }: {
      tenantId: string;
      params: {
        year: number;
        month: number;
        siteId?: string;
        confirmDespiteWarnings?: boolean;
      };
    }) => attendanceService.exportMonthlyAttendance(tenantId, params),
  });
}
