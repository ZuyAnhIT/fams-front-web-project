import { apiClient } from "@/services/api-client";
import { ApiResponse, PageResponse } from "@/types/api";
import { CheckinDetailResponse, CheckinListParams, CheckinResponse } from "../types/checkin.type";

export const checkinService = {
  listCheckins: async (tenantId: string, params: CheckinListParams) => {
    const { data } = await apiClient.get<
      ApiResponse<PageResponse<CheckinResponse>>
    >(`/tenants/${tenantId}/checkins`, { params });
    return data.data;
  },

  getCheckinDetail: async (tenantId: string, checkinId: string) => {
    const { data } = await apiClient.get<ApiResponse<CheckinDetailResponse>>(
      `/tenants/${tenantId}/checkins/${checkinId}/detail`
    );
    return data.data;
  },
};
