import { useQuery } from '@tanstack/react-query';
import { customerDashboardService } from '../services/dashboard.service';

export const customerDashboardKeys = {
  all: (tenantId: string) => ['customer-dashboard', tenantId] as const,
  employee: (tenantId: string) => [...customerDashboardKeys.all(tenantId), 'employee'] as const,
  hr: (tenantId: string, siteId?: string) => [...customerDashboardKeys.all(tenantId), 'hr', siteId ?? null] as const,
  supervisor: (tenantId: string) => [...customerDashboardKeys.all(tenantId), 'supervisor'] as const,
};

export function useEmployeeDashboard(tenantId: string, enabled = true) {
  return useQuery({
    queryKey: customerDashboardKeys.employee(tenantId),
    queryFn: () => customerDashboardService.employee(tenantId),
    enabled: Boolean(tenantId) && enabled,
    staleTime: 30_000,
  });
}

export function useHrDashboard(tenantId: string, siteId?: string, enabled = true) {
  return useQuery({
    queryKey: customerDashboardKeys.hr(tenantId, siteId),
    queryFn: () => customerDashboardService.hr(tenantId, siteId),
    enabled: Boolean(tenantId) && enabled,
    staleTime: 30_000,
  });
}

export function useSupervisorDashboard(tenantId: string, enabled = true) {
  return useQuery({
    queryKey: customerDashboardKeys.supervisor(tenantId),
    queryFn: () => customerDashboardService.supervisor(tenantId),
    enabled: Boolean(tenantId) && enabled,
    refetchInterval: enabled ? 60_000 : false,
  });
}
