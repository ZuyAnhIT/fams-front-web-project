import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { billingService } from "../services/billing.service";
import type { BillingOrderStatus, CreateBillingOrderPayload } from "../types/billing.type";

export function useTenantBillingOrders(tenantId?: string, page = 0, size = 20) {
  return useQuery({
    queryKey: ["billing-orders", "tenant", tenantId, page, size],
    queryFn: () => billingService.listForTenant(tenantId!, page, size),
    enabled: Boolean(tenantId),
  });
}

export function useCreateBillingOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ tenantId, payload }: { tenantId: string; payload: CreateBillingOrderPayload }) =>
      billingService.create(tenantId, payload),
    onSuccess: (_, variables) => queryClient.invalidateQueries({
      queryKey: ["billing-orders", "tenant", variables.tenantId],
    }),
  });
}

export function useCancelBillingOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ tenantId, orderId }: { tenantId: string; orderId: string }) =>
      billingService.cancelForTenant(tenantId, orderId),
    onSuccess: (_, variables) => queryClient.invalidateQueries({
      queryKey: ["billing-orders", "tenant", variables.tenantId],
    }),
  });
}

export function usePlatformBillingOrders(params: {
  tenantId?: string;
  status?: BillingOrderStatus;
  page?: number;
  size?: number;
}) {
  return useQuery({
    queryKey: ["billing-orders", "platform", params],
    queryFn: () => billingService.listForPlatform(params),
  });
}

export function useRefreshPlatformBillingOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) => billingService.refreshForPlatform(orderId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["billing-orders"] }),
  });
}
