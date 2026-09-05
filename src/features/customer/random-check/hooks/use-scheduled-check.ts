import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { scheduledCheckService } from "../services/scheduled-check.service";
import type { ManualCheckPayload, ScheduledCheckListParams } from "../types";

export const scheduledCheckKeys = {
  all: ["scheduled-checks"] as const,
  list: (params: ScheduledCheckListParams) => ["scheduled-checks", "list", params] as const,
  summary: (tenantId: string, params: object) =>
    ["scheduled-checks", "summary", tenantId, params] as const,
  detail: (tenantId: string, checkId: string | null) =>
    ["scheduled-checks", "detail", tenantId, checkId] as const,
  photo: (tenantId: string, checkId: string | null) =>
    ["scheduled-checks", "photo", tenantId, checkId] as const,
  manualCandidates: (tenantId: string, siteId: string) =>
    ["scheduled-checks", "manual-candidates", tenantId, siteId] as const,
};

export function useManualCheckCandidates(tenantId: string, siteId: string, enabled: boolean) {
  return useQuery({
    queryKey: scheduledCheckKeys.manualCandidates(tenantId, siteId),
    queryFn: () => scheduledCheckService.manualCandidates(tenantId, siteId),
    enabled: Boolean(tenantId && siteId) && enabled,
    refetchInterval: enabled ? 30_000 : false,
  });
}

export function useScheduledChecksQuery(params: ScheduledCheckListParams, enabled: boolean) {
  return useQuery({
    queryKey: scheduledCheckKeys.list(params),
    queryFn: () => scheduledCheckService.list(params),
    enabled,
  });
}

export function useScheduledCheckSummary(
  tenantId: string,
  params: Pick<ScheduledCheckListParams, "siteId" | "dateFrom" | "dateTo">,
  enabled: boolean,
) {
  return useQuery({
    queryKey: scheduledCheckKeys.summary(tenantId, params),
    queryFn: () => scheduledCheckService.summary(tenantId, params),
    enabled: Boolean(tenantId) && enabled,
  });
}

export function useScheduledCheckDetail(
  tenantId: string,
  checkId: string | null,
) {
  return useQuery({
    queryKey: scheduledCheckKeys.detail(tenantId, checkId),
    queryFn: () => scheduledCheckService.detail(tenantId, checkId!),
    enabled: Boolean(tenantId && checkId),
    retry: (failureCount, error) => {
      const status = (error as { response?: { status?: number } }).response?.status;
      return status !== 403 && status !== 404 && failureCount < 2;
    },
  });
}

export function useScheduledCheckPhoto(
  tenantId: string,
  checkId: string | null,
  enabled: boolean,
) {
  return useQuery({
    queryKey: scheduledCheckKeys.photo(tenantId, checkId),
    queryFn: () => scheduledCheckService.photo(tenantId, checkId!),
    enabled: Boolean(tenantId && checkId) && enabled,
    staleTime: 60_000,
    gcTime: 0,
    refetchOnWindowFocus: false,
    retry: false,
  });
}

export function useTriggerManualCheck() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      tenantId,
      payload,
    }: {
      tenantId: string;
      payload: ManualCheckPayload;
    }) => scheduledCheckService.triggerManual(tenantId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: scheduledCheckKeys.all }),
  });
}

export function useCancelScheduledCheck() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ tenantId, checkId, reason }: { tenantId: string; checkId: string; reason?: string }) =>
      scheduledCheckService.cancel(tenantId, checkId, reason),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: scheduledCheckKeys.all }),
  });
}

export function useDispatchScheduledCheck() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ tenantId, checkId }: { tenantId: string; checkId: string }) =>
      scheduledCheckService.dispatch(tenantId, checkId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: scheduledCheckKeys.all }),
  });
}
