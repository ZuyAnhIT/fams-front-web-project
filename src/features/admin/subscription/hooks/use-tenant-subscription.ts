import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { tenantSubscriptionService } from "../services/tenant-subscription.service";
import type { AssignSubscriptionPayload, UpdateSubscriptionPayload } from "../types/subscription.type";

export const useTenantSubscription = (tenantId: string) => {
  return useQuery({
    queryKey: ["tenant-subscription", tenantId],
    queryFn: () => tenantSubscriptionService.getSubscription(tenantId),
    retry: 1, // It may return 404 if not assigned, don't retry too much
  });
};

export const useAssignSubscription = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ tenantId, payload }: { tenantId: string; payload: AssignSubscriptionPayload }) =>
      tenantSubscriptionService.assignSubscription(tenantId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tenant-subscription", variables.tenantId] });
    },
  });
};

export const useUpdateSubscription = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ tenantId, payload }: { tenantId: string; payload: UpdateSubscriptionPayload }) =>
      tenantSubscriptionService.updateSubscription(tenantId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tenant-subscription", variables.tenantId] });
    },
  });
};
