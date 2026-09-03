import type { PageResponse } from '@/types/api';

export type AuditJsonValue = string | number | boolean | null | AuditJsonValue[] | { [key: string]: AuditJsonValue };

export interface AuditLogEntry {
  id: string;
  tenantId: string;
  actorId: string | null;
  actorEmail: string | null;
  /** Display name of the actor, resolved by the backend at read time. */
  actorName: string | null;
  entityType: string;
  entityId: string | null;
  /** Human-readable name of the affected entity (employee/site/… name), resolved at read time. */
  entityName: string | null;
  action: string;
  oldValue: AuditJsonValue | null;
  newValue: AuditJsonValue | null;
  requestId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  endpoint: string | null;
  httpStatus: number | null;
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
