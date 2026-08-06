import type { PageResponse } from '@/types/api';

export type AuditJsonValue = string | number | boolean | null | AuditJsonValue[] | { [key: string]: AuditJsonValue };

export interface AuditLogEntry {
  id: string;
  tenantId: string;
  actorId: string | null;
  actorEmail: string | null;
  entityType: string;
  entityId: string | null;
  action: string;
  oldValue: AuditJsonValue | null;
  newValue: AuditJsonValue | null;
  requestId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export interface AuditLogListParams {
  tenantId?: string;
  actorId?: string;
  entityType?: string;
  entityId?: string;
  action?: string;
  requestId?: string;
  from?: string;
  to?: string;
  page?: number;
  size?: number;
}

export type AuditLogPage = PageResponse<AuditLogEntry>;
