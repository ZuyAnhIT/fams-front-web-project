import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { randomCheckService } from "../services/random-check.service";
import type {
  RandomCheckConfigPayload,
  UpdateRandomCheckConfigPayload,
} from "../types";

export const randomCheckConfigKeys = {
  all: (tenantId?: string) => ["random-check-configs", tenantId] as const,
  list: (tenantId?: string) =>
    [...randomCheckConfigKeys.all(tenantId), "list"] as const,
  tenantDefault: (tenantId?: string) =>
    [...randomCheckConfigKeys.all(tenantId), "tenant-default"] as const,
  siteOverride: (tenantId?: string, siteId?: string) =>
    [...randomCheckConfigKeys.all(tenantId), "site-override", siteId] as const,
  effective: (tenantId?: string, siteId?: string) =>
    [...randomCheckConfigKeys.all(tenantId), "effective", siteId] as const,
};

const noRetryForExpectedConfigState = (
  failureCount: number,
  error: unknown,
) => {
  const status = (error as { response?: { status?: number } }).response?.status;
  return status !== 403 && status !== 404 && failureCount < 2;
};

export function useRandomCheckConfigs(tenantId?: string, enabled = true) {
  return useQuery({
    queryKey: randomCheckConfigKeys.list(tenantId),
    queryFn: () => randomCheckService.list(tenantId!),
    enabled: Boolean(tenantId) && enabled,
  });
}

export function useTenantDefaultRandomCheckConfig(
  tenantId?: string,
  enabled = true,
) {
  return useQuery({
    queryKey: randomCheckConfigKeys.tenantDefault(tenantId),
    queryFn: () => randomCheckService.getTenantDefault(tenantId!),
    enabled: Boolean(tenantId) && enabled,
    retry: noRetryForExpectedConfigState,
  });
}

export function useSiteRandomCheckOverride(
  tenantId?: string,
  siteId?: string,
  enabled = true,
) {
  return useQuery({
    queryKey: randomCheckConfigKeys.siteOverride(tenantId, siteId),
    queryFn: () => randomCheckService.getSiteOverride(tenantId!, siteId!),
    enabled: Boolean(tenantId && siteId) && enabled,
    retry: noRetryForExpectedConfigState,
  });
}

export function useEffectiveRandomCheckConfig(
  tenantId?: string,
  siteId?: string,
  enabled = true,
) {
  return useQuery({
    queryKey: randomCheckConfigKeys.effective(tenantId, siteId),
    queryFn: () => randomCheckService.getEffectiveSiteConfig(tenantId!, siteId!),
    enabled: Boolean(tenantId && siteId) && enabled,
    retry: noRetryForExpectedConfigState,
  });
}

function useInvalidateRandomCheckConfigs() {
  const queryClient = useQueryClient();
  return (tenantId: string) =>
    queryClient.invalidateQueries({
      queryKey: randomCheckConfigKeys.all(tenantId),
    });
}

export function useCreateTenantDefaultRandomCheckConfig() {
  const invalidate = useInvalidateRandomCheckConfigs();
  return useMutation({
    mutationFn: ({
      tenantId,
      payload,
    }: {
      tenantId: string;
      payload: RandomCheckConfigPayload;
    }) => randomCheckService.createTenantDefault(tenantId, payload),
    onSuccess: (_data, variables) => invalidate(variables.tenantId),
  });
}

export function useCreateSiteRandomCheckOverride() {
  const invalidate = useInvalidateRandomCheckConfigs();
  return useMutation({
    mutationFn: ({
      tenantId,
      siteId,
      payload,
    }: {
      tenantId: string;
      siteId: string;
      payload: RandomCheckConfigPayload;
    }) => randomCheckService.createSiteOverride(tenantId, siteId, payload),
    onSuccess: (_data, variables) => invalidate(variables.tenantId),
  });
}

export function useUpdateRandomCheckConfig() {
  const invalidate = useInvalidateRandomCheckConfigs();
  return useMutation({
    mutationFn: ({
      tenantId,
      configId,
      payload,
    }: {
      tenantId: string;
      configId: string;
      payload: UpdateRandomCheckConfigPayload;
    }) => randomCheckService.update(tenantId, configId, payload),
    onSuccess: (_data, variables) => invalidate(variables.tenantId),
  });
}

export function useDeleteRandomCheckConfig() {
  const invalidate = useInvalidateRandomCheckConfigs();
  return useMutation({
    mutationFn: ({ tenantId, configId }: { tenantId: string; configId: string }) =>
      randomCheckService.remove(tenantId, configId),
    onSuccess: (_data, variables) => invalidate(variables.tenantId),
  });
}
