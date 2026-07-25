import { apiClient } from "@/services/api-client";
import type { ApiResponse, PageResponse } from "@/types/api";
import type { ScheduledCheckListParams, ScheduledCheckResponse } from "../types";

export const scheduledCheckService = {
  async list(params: ScheduledCheckListParams): Promise<ApiResponse<PageResponse<ScheduledCheckResponse>>> {
    const { tenantId, ...query } = params;
    const response = await apiClient.get<ApiResponse<PageResponse<ScheduledCheckResponse>>>(
      `/tenants/${tenantId}/scheduled-checks`,
      { params: query },
    );
    return response.data;
  },

  async cancel(tenantId: string, checkId: string): Promise<ApiResponse<{ checkId: string; cancelled: boolean }>> {
    const response = await apiClient.post<ApiResponse<{ checkId: string; cancelled: boolean }>>(
      `/tenants/${tenantId}/scheduled-checks/${checkId}/cancel`,
    );
    return response.data;
  },

  async dispatch(tenantId: string, checkId: string): Promise<ApiResponse<{ checkId: string; dispatched: boolean }>> {
    const response = await apiClient.post<ApiResponse<{ checkId: string; dispatched: boolean }>>(
      `/tenants/${tenantId}/scheduled-checks/${checkId}/dispatch`,
    );
    return response.data;
  },
};
