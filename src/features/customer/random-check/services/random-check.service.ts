import { apiClient } from "@/services/api-client";
import type { ApiResponse } from "@/types/api";
import type {
  RandomCheckConfigPayload,
  RandomCheckConfigResponse,
  UpdateRandomCheckConfigPayload,
} from "../types";

const basePath = (tenantId: string) =>
  `/tenants/${tenantId}/random-check-configs`;

export const randomCheckService = {
  async list(tenantId: string) {
    const { data } = await apiClient.get<ApiResponse<RandomCheckConfigResponse[]>>(
      basePath(tenantId),
    );
    return data.data;
  },

  async getTenantDefault(tenantId: string) {
    const { data } = await apiClient.get<ApiResponse<RandomCheckConfigResponse>>(
      `${basePath(tenantId)}/tenant-default`,
    );
    return data.data;
  },

  async createTenantDefault(
    tenantId: string,
    payload: RandomCheckConfigPayload,
  ) {
    const { data } = await apiClient.post<ApiResponse<RandomCheckConfigResponse>>(
      `${basePath(tenantId)}/tenant-default`,
      payload,
    );
    return data.data;
  },

  async getSiteOverride(tenantId: string, siteId: string) {
    const { data } = await apiClient.get<ApiResponse<RandomCheckConfigResponse>>(
      `${basePath(tenantId)}/sites/${siteId}`,
    );
    return data.data;
  },

  async getEffectiveSiteConfig(tenantId: string, siteId: string) {
    const { data } = await apiClient.get<ApiResponse<RandomCheckConfigResponse>>(
      `${basePath(tenantId)}/sites/${siteId}/effective`,
    );
    return data.data;
  },

  async createSiteOverride(
    tenantId: string,
    siteId: string,
    payload: RandomCheckConfigPayload,
  ) {
    const { data } = await apiClient.post<ApiResponse<RandomCheckConfigResponse>>(
      `${basePath(tenantId)}/sites/${siteId}`,
      payload,
    );
    return data.data;
  },

  async update(
    tenantId: string,
    configId: string,
    payload: UpdateRandomCheckConfigPayload,
  ) {
    const { data } = await apiClient.put<ApiResponse<RandomCheckConfigResponse>>(
      `${basePath(tenantId)}/${configId}`,
      payload,
    );
    return data.data;
  },

  async remove(tenantId: string, configId: string) {
    await apiClient.delete(`${basePath(tenantId)}/${configId}`);
  },
};
