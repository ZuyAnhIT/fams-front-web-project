import { useQuery } from "@tanstack/react-query";
import { systemOperationsService } from "../services/system-operations.service";
import type { DeliveryLogParams } from "../types/system-operations.type";

export function useSystemStatus() {
  return useQuery({
    queryKey: ["platform-system-status"],
    queryFn: () => systemOperationsService.getSystemStatus(),
    refetchInterval: 60_000,
  });
}

export function useNotificationDeliveryLogs(params: DeliveryLogParams) {
  return useQuery({
    queryKey: ["notification-delivery-logs", params],
    queryFn: () => systemOperationsService.getDeliveryLogs(params),
  });
}
