import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { siteService } from "../services/site.service";
import { SiteListParams, CreateSiteRequest, UpdateSiteRequest } from "../types/site.type";
import { MOCK_SITES } from "../../../../mocks/sites.mock";

export const siteKeys = {
  all: ["sites"] as const,
  lists: () => [...siteKeys.all, "list"] as const,
  list: (params: any) => [...siteKeys.lists(), params] as const,
  details: () => [...siteKeys.all, "detail"] as const,
  detail: (id: string) => [...siteKeys.details(), id] as const,
};

export const useSitesQuery = (params: SiteListParams) => {
  return useQuery({
    queryKey: siteKeys.list(params),
    queryFn: async () => {
      try {
        const res = await siteService.getSites(params);
        if (!res.data?.content || res.data.content.length === 0) {
          return { data: { content: MOCK_SITES, totalElements: MOCK_SITES.length, totalPages: 1 } } as any;
        }
        return res;
      } catch (e) {
        return { data: { content: MOCK_SITES, totalElements: MOCK_SITES.length, totalPages: 1 } } as any;
      }
    },
    enabled: !!params.tenantId,
  });
};

export const useSiteDetailQuery = (tenantId: string | undefined, siteId: string) => {
  return useQuery({
    queryKey: siteKeys.detail(siteId),
    queryFn: () => siteService.getSiteDetail(tenantId!, siteId),
    enabled: !!tenantId && !!siteId,
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
