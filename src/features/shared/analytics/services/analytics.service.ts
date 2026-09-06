import { apiClient } from "@/services/api-client";
import type { ApiResponse } from "@/types/api";
import type { AnalyticsFilters, CustomerHealthReport, PlatformAnalyticsFilters, RevenueReport, RiskReport, WorkforceReport } from "../types/analytics.type";

export const analyticsService = {
  revenue: async (from: string, to: string, expiryDays = 30, filters: PlatformAnalyticsFilters = {}) =>
    (await apiClient.get<ApiResponse<RevenueReport>>("/platform/reports/revenue", { params: { from, to, expiryDays, ...filters } })).data.data,
  customerHealth: async (from: string, to: string, filters: PlatformAnalyticsFilters = {}) =>
    (await apiClient.get<ApiResponse<CustomerHealthReport>>("/platform/reports/customer-health", { params: { from, to, ...filters } })).data.data,
  workforce: async (tenantId: string, filters: AnalyticsFilters) =>
    (await apiClient.get<ApiResponse<WorkforceReport>>(`/tenants/${tenantId}/reports/workforce-effectiveness`, { params: filters })).data.data,
  risk: async (tenantId: string, filters: AnalyticsFilters) =>
    (await apiClient.get<ApiResponse<RiskReport>>(`/tenants/${tenantId}/reports/risk-compliance`, { params: filters })).data.data,
};
