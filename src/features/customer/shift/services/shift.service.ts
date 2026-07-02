import { apiClient } from "@/services/api-client";
import { ApiResponse, PageResponse } from "@/types/api";
import {
  CreateShiftRequest,
  UpdateShiftRequest,
  ConfigureShiftOtRequest,
  ShiftResponse,
} from "../types/shift.type";

export const shiftService = {
  createShift: async (
    tenantId: string,
    siteId: string,
    data: CreateShiftRequest
  ): Promise<ShiftResponse> => {
    const response = await apiClient.post<ApiResponse<ShiftResponse>>(
      `/tenants/${tenantId}/sites/${siteId}/shifts`,
      data
    );
    return response.data.data;
  },

  listShifts: async (
    tenantId: string,
    siteId: string,
    params: { status?: string; page?: number; size?: number }
  ): Promise<PageResponse<ShiftResponse>> => {
    const response = await apiClient.get<ApiResponse<PageResponse<ShiftResponse>>>(
      `/tenants/${tenantId}/sites/${siteId}/shifts`,
      { params }
    );
    return response.data.data;
  },

  updateShift: async (
    tenantId: string,
    siteId: string,
    shiftId: string,
    data: UpdateShiftRequest
  ): Promise<ShiftResponse> => {
    const response = await apiClient.put<ApiResponse<ShiftResponse>>(
      `/tenants/${tenantId}/sites/${siteId}/shifts/${shiftId}`,
      data
    );
    return response.data.data;
  },

  configureOt: async (
    tenantId: string,
    siteId: string,
    shiftId: string,
    data: ConfigureShiftOtRequest
  ): Promise<ShiftResponse> => {
    const response = await apiClient.put<ApiResponse<ShiftResponse>>(
      `/tenants/${tenantId}/sites/${siteId}/shifts/${shiftId}/ot-config`,
      data
    );
    return response.data.data;
  },
};
