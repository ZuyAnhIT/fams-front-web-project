import { apiClient } from "@/services/api-client";
import { ApiResponse, PageResponse } from "@/types/api";
import {
  SiteResponse,
  SiteDetailResponse,
  CreateSiteRequest,
  UpdateSiteRequest,
  SiteListParams,
} from "../types/site.type";

export const siteService = {
  getSites: async (
    params: SiteListParams
  ): Promise<ApiResponse<PageResponse<SiteResponse>>> => {
    const { tenantId, ...queryParams } = params;
    const response = await apiClient.get<ApiResponse<PageResponse<SiteResponse>>>(
      `/tenants/${tenantId}/sites`,
      { params: queryParams }
    );
    return response.data;
  },

  getSiteDetail: async (
    tenantId: string,
    siteId: string
  ): Promise<ApiResponse<SiteDetailResponse>> => {
    const response = await apiClient.get<ApiResponse<SiteDetailResponse>>(
      `/tenants/${tenantId}/sites/${siteId}`
    );
    return response.data;
  },

  createSite: async (
    tenantId: string,
    data: CreateSiteRequest
  ): Promise<ApiResponse<SiteResponse>> => {
    const response = await apiClient.post<ApiResponse<SiteResponse>>(
      `/tenants/${tenantId}/sites`,
      data
    );
    return response.data;
  },

  updateSite: async (
    tenantId: string,
    siteId: string,
    data: UpdateSiteRequest
  ): Promise<ApiResponse<SiteResponse>> => {
    const response = await apiClient.put<ApiResponse<SiteResponse>>(
      `/tenants/${tenantId}/sites/${siteId}`,
      data
    );
    return response.data;
  },

  deleteSite: async (tenantId: string, siteId: string): Promise<void> => {
    await apiClient.delete(`/tenants/${tenantId}/sites/${siteId}`);
  },
};
