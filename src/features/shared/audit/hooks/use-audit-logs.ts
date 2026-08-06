import { useQuery } from '@tanstack/react-query';
import { auditLogService } from '../services/audit-log.service';
import type { AuditLogListParams } from '../types/audit-log.type';

export const auditLogKeys = {
  all: ['audit-logs'] as const,
  list: (params: AuditLogListParams) => [...auditLogKeys.all, 'list', params] as const,
  detail: (id: string | null) => [...auditLogKeys.all, 'detail', id] as const,
};

export function useAuditLogs(params: AuditLogListParams, enabled = true) {
  return useQuery({
    queryKey: auditLogKeys.list(params),
    queryFn: () => auditLogService.list(params),
    enabled,
    retry: (failureCount, error) => {
      const status = (error as { response?: { status?: number } }).response?.status;
      return status !== 403 && failureCount < 2;
    },
  });
}

export function useAuditLogDetail(id: string | null, enabled = true) {
  return useQuery({
    queryKey: auditLogKeys.detail(id),
    queryFn: () => auditLogService.detail(id!),
    enabled: Boolean(id) && enabled,
    retry: false,
  });
}
