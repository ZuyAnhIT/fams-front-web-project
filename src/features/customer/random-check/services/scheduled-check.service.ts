import { apiClient } from "@/services/api-client";
import type { ApiResponse, PageResponse } from "@/types/api";
import type {
  ManualCheckPayload,
  ScheduledCheckDetailResponse,
  ScheduledCheckListParams,
  ScheduledCheckResponse,
  ScheduledCheckSummaryResponse,
} from "../types";

export const scheduledCheckService = {
  async list(params: ScheduledCheckListParams): Promise<ApiResponse<PageResponse<ScheduledCheckResponse>>> {
    const { tenantId, ...query } = params;
    const response = await apiClient.get<ApiResponse<PageResponse<ScheduledCheckResponse>>>(
      `/tenants/${tenantId}/scheduled-checks`,
      { params: query },
    );
    return response.data;
  },

  async summary(
    tenantId: string,
    params: Pick<ScheduledCheckListParams, "siteId" | "dateFrom" | "dateTo">,
  ) {
    const response = await apiClient.get<ApiResponse<ScheduledCheckSummaryResponse>>(
      `/tenants/${tenantId}/scheduled-checks/summary`,
      { params },
    );
    return response.data;
  },

  async detail(tenantId: string, checkId: string) {
    const response = await apiClient.get<ApiResponse<ScheduledCheckDetailResponse>>(
      `/tenants/${tenantId}/scheduled-checks/${checkId}`,
    );
    return response.data;
  },

  async photo(tenantId: string, checkId: string): Promise<Blob> {
    const response = await apiClient.get<Blob>(
      `/tenants/${tenantId}/scheduled-checks/${checkId}/photo`,
      { responseType: "blob" },
    );
    return response.data;
  },

  async triggerManual(tenantId: string, payload: ManualCheckPayload) {
    const response = await apiClient.post<ApiResponse<ScheduledCheckResponse>>(
      `/tenants/${tenantId}/scheduled-checks/manual`,
      payload,
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
