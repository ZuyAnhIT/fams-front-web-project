import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { systemOperationsService } from "../services/system-operations.service";
import type { CreateGoLiveRecordPayload, DeliveryLogParams, GoLiveRecordParams, GoLiveStep } from "../types/system-operations.type";

export function useSystemStatus(enabled = true) {
  return useQuery({
    queryKey: ["platform-system-status"],
    queryFn: () => systemOperationsService.getSystemStatus(),
    refetchInterval: 60_000,
    enabled,
  });
}

export function useNotificationDeliveryLogs(params: DeliveryLogParams, enabled = true) {
  return useQuery({
    queryKey: ["notification-delivery-logs", params],
    queryFn: () => systemOperationsService.getDeliveryLogs(params),
    enabled,
  });
}

export function useGoLiveRecords(params: GoLiveRecordParams, enabled = true) {
  return useQuery({
    queryKey: ["go-live-records", params],
    queryFn: () => systemOperationsService.listGoLiveRecords(params),
    enabled,
  });
}

export function useCreateGoLiveRecord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateGoLiveRecordPayload) => systemOperationsService.createGoLiveRecord(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["go-live-records"] }),
  });
}

export function useUpdateGoLiveSteps() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, steps, completed }: { id: string; steps: GoLiveStep[]; completed: boolean }) => systemOperationsService.updateGoLiveSteps(id, steps, completed),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["go-live-records"] }),
  });
}

export function useDecideGoLiveRecord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, decision, note }: { id: string; decision: "approve" | "reject"; note?: string }) => systemOperationsService.decideGoLiveRecord(id, decision, note),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["go-live-records"] }),
  });
}
