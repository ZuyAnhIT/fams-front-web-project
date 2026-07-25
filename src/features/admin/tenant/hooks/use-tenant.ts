import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { tenantService } from "../services/tenant.service";
import type {
  CreateTenantPayload,
  UpdateTenantPayload,
  UpdateTenantSettingsPayload,
  CreateIpWhitelistPayload,
  UpdateIpWhitelistPayload,
  TenantListParams,
} from "../types/tenant.type";

export const useTenants = (params: TenantListParams, enabled: boolean = true) => {
  return useQuery({
    queryKey: ["tenants", params],
    queryFn: () => tenantService.listTenants(params),
    enabled,
  });
};

export const useTenantDetail = (id: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ["tenant-detail", id],
    queryFn: () => tenantService.getTenantDetail(id),
    enabled: enabled && Boolean(id),
    retry: (failureCount, error) => {
      const status = (error as { response?: { status?: number } }).response?.status;
      return status !== 403 && status !== 404 && failureCount < 2;
    },
  });
};

export const useCreateTenant = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTenantPayload) => tenantService.createTenant(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      queryClient.invalidateQueries({ queryKey: ["tenant-detail"] });
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
      queryClient.invalidateQueries({ queryKey: ["tenant-detail"] });
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

export const useIpWhitelists = (id?: string, page = 0, size = 20) => {
  return useQuery({
    queryKey: ["ipWhitelists", id, page, size],
    queryFn: () => tenantService.listIpWhitelists(id, page, size),
    enabled: Boolean(id),
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
      queryClient.invalidateQueries({ queryKey: ["tenant-detail"] });
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
