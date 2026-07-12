import { apiClient } from "@/services/api-client";
import { PageResponse } from "@/types/common.type";
import { ApiResponse } from "@/types/api";
import { AttendanceHrMonthlyResponse, AttendanceListParams, AttendanceSummaryResponse } from "../types/attendance.type";

export const attendanceService = {
  listSummaries: async (tenantId: string, params: AttendanceListParams) => {
    const { data } = await apiClient.get<
      ApiResponse<PageResponse<AttendanceSummaryResponse>>
    >(`/tenants/${tenantId}/attendance`, { params });
    return data.data;
  },

  listMonthlyAttendance: async (
    tenantId: string,
    params: { year: number; month: number; employeeId?: string; siteId?: string; page?: number; size?: number }
  ) => {
    const { data } = await apiClient.get<
      ApiResponse<PageResponse<AttendanceHrMonthlyResponse>>
    >(`/tenants/${tenantId}/attendance/monthly`, { params });
    return data.data;
  },

  exportMonthlyAttendance: async (
    tenantId: string,
    params: { year: number; month: number; siteId?: string }
  ) => {
    const response = await apiClient.get(`/tenants/${tenantId}/reports/attendance/export`, {
      params,
      responseType: "blob",
    });
    return response.data;
  },
};
