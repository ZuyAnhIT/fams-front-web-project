import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { scheduledCheckService } from "../services/scheduled-check.service";
import type { ScheduledCheckListParams } from "../types";

const keys = {
  all: ["scheduled-checks"] as const,
  list: (params: ScheduledCheckListParams) => ["scheduled-checks", "list", params] as const,
};

export function useScheduledChecksQuery(params: ScheduledCheckListParams, enabled: boolean) {
  return useQuery({
    queryKey: keys.list(params),
    queryFn: () => scheduledCheckService.list(params),
    enabled,
  });
}

export function useCancelScheduledCheck() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ tenantId, checkId }: { tenantId: string; checkId: string }) =>
      scheduledCheckService.cancel(tenantId, checkId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.all }),
  });
}

export function useDispatchScheduledCheck() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ tenantId, checkId }: { tenantId: string; checkId: string }) =>
      scheduledCheckService.dispatch(tenantId, checkId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.all }),
  });
}
