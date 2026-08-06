import { apiClient } from '@/services/api-client';
import type { ApiResponse } from '@/types/api';
import type {
  AttendanceExportParams,
  DailyAttendanceReport,
  DailyAttendanceReportParams,
  GlobalSearchResponse,
  MonthlyAttendanceReport,
  MonthlyAttendanceReportParams,
  SitePresenceParams,
  SitePresenceReport,
  ViolationReport,
  ViolationReportParams,
} from '../types/report-search.type';

async function decodeBlobError(error: unknown): Promise<never> {
  const response = (error as { response?: { data?: unknown } }).response;
  if (response?.data instanceof Blob) {
    try {
      response.data = JSON.parse(await response.data.text());
    } catch {
      // Keep the original response when a reverse proxy returns non-JSON content.
    }
  }
  throw error;
}

export const reportSearchService = {
  async dailyAttendance(tenantId: string, params: DailyAttendanceReportParams) {
    const { data } = await apiClient.get<ApiResponse<DailyAttendanceReport>>(
      `/tenants/${tenantId}/reports/attendance/daily`,
      { params },
    );
    return data.data;
  },

  async monthlyAttendance(tenantId: string, params: MonthlyAttendanceReportParams) {
    const { data } = await apiClient.get<ApiResponse<MonthlyAttendanceReport>>(
      `/tenants/${tenantId}/reports/attendance/monthly`,
      { params },
    );
    return data.data;
  },

  async violationReport(tenantId: string, params: ViolationReportParams) {
    const { data } = await apiClient.get<ApiResponse<ViolationReport>>(
      `/tenants/${tenantId}/reports/violations`,
      { params },
    );
    return data.data;
  },

  async sitePresence(tenantId: string, params: SitePresenceParams) {
    const { data } = await apiClient.get<ApiResponse<SitePresenceReport>>(
      `/tenants/${tenantId}/reports/sites/presence`,
      { params },
    );
    return data.data;
  },

  async globalSearch(tenantId: string, q: string, limit = 5) {
    const { data } = await apiClient.get<ApiResponse<GlobalSearchResponse>>(
      `/tenants/${tenantId}/search`,
      { params: { q, limit } },
    );
    return data.data;
  },

  async exportAttendance(tenantId: string, params: AttendanceExportParams) {
    try {
      const response = await apiClient.get(`/tenants/${tenantId}/reports/attendance/export`, {
        params,
        responseType: 'blob',
      });
      return response.data as Blob;
    } catch (error) {
      return decodeBlobError(error);
    }
  },

  async exportViolations(tenantId: string, params: ViolationReportParams) {
    try {
      const response = await apiClient.get(`/tenants/${tenantId}/reports/violations/export`, {
        params: { ...params, page: undefined, size: undefined },
        responseType: 'blob',
      });
      return response.data as Blob;
    } catch (error) {
      return decodeBlobError(error);
    }
  },
};
