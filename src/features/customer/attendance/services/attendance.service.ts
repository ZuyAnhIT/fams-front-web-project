import { apiClient } from "@/services/api-client";
import { ApiResponse, PageResponse } from "@/types/api";
import {
  type AdjustAttendanceSummaryRequest,
  type AttendanceHrMonthlyResponse,
  type AttendanceListParams,
  type AttendanceMonthlyParams,
  type AttendanceSummaryResponse,
  type RecomputeAttendanceRequest,
  type UnlockAttendanceSummaryRequest,
} from "../types/attendance.type";

export const attendanceService = {
  listSummaries: async (tenantId: string, params: AttendanceListParams) => {
    const { data } = await apiClient.get<
      ApiResponse<PageResponse<AttendanceSummaryResponse>>
    >(`/tenants/${tenantId}/attendance`, { params });
    return data.data;
  },

  listMonthlyAttendance: async (
    tenantId: string,
    params: AttendanceMonthlyParams,
  ) => {
    const { data } = await apiClient.get<
      ApiResponse<PageResponse<AttendanceHrMonthlyResponse>>
    >(`/tenants/${tenantId}/attendance/monthly`, { params });
    return data.data;
  },

  getSummary: async (tenantId: string, summaryId: string) => {
    const { data } = await apiClient.get<ApiResponse<AttendanceSummaryResponse>>(
      `/tenants/${tenantId}/attendance/${summaryId}`,
    );
    return data.data;
  },

  adjustSummary: async (
    tenantId: string,
    summaryId: string,
    payload: AdjustAttendanceSummaryRequest,
  ) => {
    const { data } = await apiClient.patch<ApiResponse<AttendanceSummaryResponse>>(
      `/tenants/${tenantId}/attendance/${summaryId}/adjust`,
      payload,
    );
    return data.data;
  },

  unlockAndRecompute: async (
    tenantId: string,
    summaryId: string,
    payload: UnlockAttendanceSummaryRequest,
  ) => {
    const { data } = await apiClient.post<ApiResponse<AttendanceSummaryResponse>>(
      `/tenants/${tenantId}/attendance/${summaryId}/unlock-and-recompute`,
      payload,
    );
    return data.data;
  },

  recompute: async (
    tenantId: string,
    params: RecomputeAttendanceRequest,
  ) => {
    const { data } = await apiClient.post<ApiResponse<string>>(
      `/tenants/${tenantId}/attendance/recompute`,
      undefined,
      { params },
    );
    return data.data;
  },

  exportMonthlyAttendance: async (
    tenantId: string,
    params: {
      year: number;
      month: number;
      siteId?: string;
      confirmDespiteWarnings?: boolean;
    },
  ) => {
    try {
      const response = await apiClient.get(
        `/tenants/${tenantId}/reports/attendance/export`,
        { params, responseType: "blob" },
      );
      return response.data;
    } catch (error) {
      // Axios also turns JSON error bodies into Blob when the successful response is
      // expected to be a file. Decode it so the UI can handle Backend errorCode/userMessage.
      const response = (error as { response?: { data?: unknown } }).response;
      if (response?.data instanceof Blob) {
        try {
          response.data = JSON.parse(await response.data.text());
        } catch {
          // Preserve the original error when a proxy returns a non-JSON body.
        }
      }
      throw error;
    }
  },
};
