import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { tenantService } from "../services/tenant.service";
import type {
  CreateTenantPayload,
  UpdateTenantPayload,
  UpdateTenantSettingsPayload,
  CreateIpWhitelistPayload,
  UpdateIpWhitelistPayload,
} from "../types/tenant.type";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const useTenants = (params: any, enabled: boolean = true) => {
  return useQuery({
    queryKey: ["tenants", params],
    queryFn: () => tenantService.listTenants(params),
    enabled,
  });
};

export const useCreateTenant = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTenantPayload) => tenantService.createTenant(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
    },
  });
};

export const useUpdateTenant = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ payload, id }: { payload: UpdateTenantPayload; id?: string }) =>
      tenantService.updateTenant(payload, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
    },
  });
};

export const useTenantSettings = (id?: string) => {
  return useQuery({
    queryKey: ["tenantSettings", id],
    queryFn: () => tenantService.getSettings(id),
    enabled: !!id,
  });
};

export const useUpdateTenantSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ payload, id }: { payload: UpdateTenantSettingsPayload; id?: string }) =>
      tenantService.updateSettings(payload, id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tenantSettings", variables.id] });
    },
  });
};

export const useIpWhitelists = (id?: string) => {
  return useQuery({
    queryKey: ["ipWhitelists", id],
    queryFn: () => tenantService.listIpWhitelists(id),
  });
};

export const useAddIpWhitelist = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ payload, id }: { payload: CreateIpWhitelistPayload; id?: string }) =>
      tenantService.addIpWhitelist(payload, id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["ipWhitelists", variables.id] });
    },
  });
};

export const useUpdateIpWhitelist = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ entryId, payload, id }: { entryId: string; payload: UpdateIpWhitelistPayload; id?: string }) =>
      tenantService.updateIpWhitelist(entryId, payload, id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["ipWhitelists", variables.id] });
    },
  });
};

export const useDeleteIpWhitelist = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ entryId, id }: { entryId: string; id?: string }) =>
      tenantService.deleteIpWhitelist(entryId, id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["ipWhitelists", variables.id] });
    },
  });
};

export const useSuspendTenant = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tenantService.suspendTenant(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
    },
  });
};

export const useReactivateTenant = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tenantService.reactivateTenant(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
    },
  });
};

export const useCancelTenant = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tenantService.cancelTenant(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
    },
  });
};
