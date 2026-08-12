import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { siteService } from "../services/site.service";
import { SiteListParams, CreateSiteRequest, UpdateSiteRequest } from "../types/site.type";

export const siteKeys = {
  all: ["sites"] as const,
  lists: () => [...siteKeys.all, "list"] as const,
  list: (params: SiteListParams) => [...siteKeys.lists(), params] as const,
  details: () => [...siteKeys.all, "detail"] as const,
  detail: (id: string) => [...siteKeys.details(), id] as const,
};

export const useSitesQuery = (params: SiteListParams) => {
  return useQuery({
    queryKey: siteKeys.list(params),
    queryFn: () => siteService.getSites(params),
    enabled: !!params.tenantId,
  });
};

export const useSiteDetailQuery = (tenantId: string | undefined, siteId: string) => {
  return useQuery({
    queryKey: siteKeys.detail(siteId),
    queryFn: () => siteService.getSiteDetail(tenantId!, siteId),
    enabled: !!tenantId && !!siteId,
    retry: (failureCount, error) => {
      const status = (error as { response?: { status?: number } }).response?.status;
      return status !== 403 && status !== 404 && failureCount < 2;
    },
  });
};

export const useCreateSiteMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      tenantId,
      data,
    }: {
      tenantId: string;
      data: CreateSiteRequest;
    }) => siteService.createSite(tenantId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: siteKeys.lists() });
    },
  });
};

export const useUpdateSiteMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      tenantId,
      siteId,
      data,
    }: {
      tenantId: string;
      siteId: string;
      data: UpdateSiteRequest;
    }) => siteService.updateSite(tenantId, siteId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: siteKeys.lists() });
      queryClient.invalidateQueries({ queryKey: siteKeys.detail(variables.siteId) });
    },
  });
};

export const useDeleteSiteMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ tenantId, siteId }: { tenantId: string; siteId: string }) =>
      siteService.deleteSite(tenantId, siteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: siteKeys.all });
    },
  });
};
