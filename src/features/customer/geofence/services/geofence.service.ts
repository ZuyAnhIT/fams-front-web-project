import { apiClient } from "@/services/api-client";
import { ApiResponse, PageResponse } from "@/types/api";
import { GeofenceResponse } from "../../site/types/site.type";
import { CreateGeofenceRequest, GeofenceHistoryParams, UpdateGeofenceRequest } from "../types/geofence.type";

export const geofenceService = {
  createGeofence: async (tenantId: string, siteId: string, data: CreateGeofenceRequest): Promise<GeofenceResponse> => {
    const response = await apiClient.post<ApiResponse<GeofenceResponse>>(
      `/tenants/${tenantId}/sites/${siteId}/geofences`,
      data
    );
    return response.data.data;
  },

  updateGeofence: async (tenantId: string, siteId: string, data: UpdateGeofenceRequest): Promise<GeofenceResponse> => {
    const response = await apiClient.put<ApiResponse<GeofenceResponse>>(
      `/tenants/${tenantId}/sites/${siteId}/geofences/active`,
      data
    );
    return response.data.data;
  },

  listGeofenceHistory: async (
    tenantId: string,
    siteId: string,
    params: GeofenceHistoryParams,
  ): Promise<PageResponse<GeofenceResponse>> => {
    const response = await apiClient.get<ApiResponse<PageResponse<GeofenceResponse>>>(
      `/tenants/${tenantId}/sites/${siteId}/geofences`,
      { params }
    );
    return response.data.data;
  },

  getActiveGeofence: async (tenantId: string, siteId: string): Promise<GeofenceResponse> => {
    const response = await apiClient.get<ApiResponse<GeofenceResponse>>(
      `/tenants/${tenantId}/sites/${siteId}/geofences/active`
    );
    return response.data.data;
  }
};
