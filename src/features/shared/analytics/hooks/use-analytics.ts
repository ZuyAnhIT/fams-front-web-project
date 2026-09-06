import { useQuery } from "@tanstack/react-query";
import { analyticsService } from "../services/analytics.service";
import type { AnalyticsFilters, PlatformAnalyticsFilters } from "../types/analytics.type";

export const useRevenueReport = (from: string, to: string, expiryDays: number, filters: PlatformAnalyticsFilters) => useQuery({
  queryKey: ["analytics", "platform", "revenue", from, to, expiryDays, filters],
  queryFn: () => analyticsService.revenue(from, to, expiryDays, filters),
});

export const useCustomerHealthReport = (from: string, to: string, filters: PlatformAnalyticsFilters) => useQuery({
  queryKey: ["analytics", "platform", "customer-health", from, to, filters],
  queryFn: () => analyticsService.customerHealth(from, to, filters),
});

export const useWorkforceReport = (tenantId: string, filters: AnalyticsFilters) => useQuery({
  queryKey: ["analytics", tenantId, "workforce", filters],
  queryFn: () => analyticsService.workforce(tenantId, filters),
  enabled: Boolean(tenantId),
});

export const useRiskReport = (tenantId: string, filters: AnalyticsFilters) => useQuery({
  queryKey: ["analytics", tenantId, "risk", filters],
  queryFn: () => analyticsService.risk(tenantId, filters),
  enabled: Boolean(tenantId),
});
