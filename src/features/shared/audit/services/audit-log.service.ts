import { apiClient } from '@/services/api-client';
import type { ApiResponse } from '@/types/api';
import type { AuditLogEntry, AuditLogListParams, AuditLogPage } from '../types/audit-log.type';

export const auditLogService = {
  async list(params: AuditLogListParams) {
    const response = await apiClient.get<ApiResponse<AuditLogPage>>('/audit-logs', { params });
    return response.data.data;
  },

  async detail(id: string) {
    const response = await apiClient.get<ApiResponse<AuditLogEntry>>(`/audit-logs/${id}`);
    return response.data.data;
  },
};
