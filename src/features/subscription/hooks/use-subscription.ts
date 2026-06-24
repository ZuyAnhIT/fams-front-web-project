import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { subscriptionService } from "../services/subscription.service";
import type {
  CreatePlanPayload,
  UpdatePlanPayload,
  UpdatePlanLimitsPayload,
} from "../types/subscription.type";

export const usePlans = (activeOnly: boolean = false) => {
  return useQuery({
    queryKey: ["plans", activeOnly],
    queryFn: () => subscriptionService.listPlans(activeOnly),
  });
};

export const useCreatePlan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePlanPayload) => subscriptionService.createPlan(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plans"] });
    },
  });
};

export const useUpdatePlan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdatePlanPayload }) =>
      subscriptionService.updatePlan(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plans"] });
    },
  });
};

export const usePlanLimits = (planId: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ["planLimits", planId],
    queryFn: () => subscriptionService.getLimits(planId),
    enabled,
  });
};

export const useUpdatePlanLimits = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ planId, payload }: { planId: string; payload: UpdatePlanLimitsPayload }) =>
      subscriptionService.updateLimits(planId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["planLimits", variables.planId] });
    },
  });
};
