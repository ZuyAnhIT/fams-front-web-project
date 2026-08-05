import { apiClient } from '@/services/api-client';
import type { ApiResponse } from '@/types/api';
import type { EmployeeDashboard, HrDashboard, SupervisorDashboard } from '../types/dashboard.type';

const endpoint = (tenantId: string, kind: 'employee' | 'hr' | 'supervisor') =>
  `/tenants/${tenantId}/dashboard/${kind}`;

export const customerDashboardService = {
  async employee(tenantId: string) {
    const response = await apiClient.get<ApiResponse<EmployeeDashboard>>(endpoint(tenantId, 'employee'));
    return response.data.data;
  },
  async hr(tenantId: string) {
    const response = await apiClient.get<ApiResponse<HrDashboard>>(endpoint(tenantId, 'hr'));
    return response.data.data;
  },
  async supervisor(tenantId: string) {
    const response = await apiClient.get<ApiResponse<SupervisorDashboard>>(endpoint(tenantId, 'supervisor'));
    return response.data.data;
  },
};
