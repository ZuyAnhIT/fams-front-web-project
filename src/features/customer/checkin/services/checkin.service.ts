import { apiClient } from "@/services/api-client";
import { ApiResponse, PageResponse } from "@/types/api";
import {
  CheckinDetailResponse,
  CheckinListParams,
  CheckinResponse,
  OverrideCheckinRequest,
} from "../types/checkin.type";

export const checkinService = {
  listCheckins: async (tenantId: string, params: CheckinListParams) => {
    const { data } = await apiClient.get<
      ApiResponse<PageResponse<CheckinResponse>>
    >(`/tenants/${tenantId}/checkin`, { params });
    return data.data;
  },

  getCheckinDetail: async (tenantId: string, checkinId: string) => {
    const { data } = await apiClient.get<ApiResponse<CheckinDetailResponse>>(
      `/tenants/${tenantId}/checkin/${checkinId}/detail`
    );
    return data.data;
  },

  overrideCheckin: async (
    tenantId: string,
    checkinId: string,
    payload: OverrideCheckinRequest,
  ) => {
    const { data } = await apiClient.patch<ApiResponse<CheckinResponse>>(
      `/tenants/${tenantId}/checkin/${checkinId}/override`,
      payload,
    );
    return data.data;
  },
};
