import type { PageResponse } from "@/types/api";

export interface ScheduledJobStatus {
  jobName: string;
  description: string;
  lastStatus: string;
  lastRunAt: string | null;
  lastRunDurationMs: number | null;
  errorMessage: string | null;
  expectedNextRunAt: string | null;
  staleThresholdMinutes: number;
  stale: boolean;
}

export interface HealthComponentStatus {
  status: string;
  details: Record<string, unknown> | null;
}

export interface SystemStatus {
  overallHealth: string;
  healthComponents: Record<string, HealthComponentStatus>;
  jobs: ScheduledJobStatus[];
  activeTenantCount: number;
  faceVerifyQueueDepth: number;
  dispatchQueueDepth: number;
  generatedAt: string;
}

export interface NotificationDeliveryLog {
  id: string;
  notificationId: string | null;
  deviceToken: string | null;
  channel: string;
  attemptNumber: number;
  status: string;
  errorMessage: string | null;
  createdAt: string;
}

export interface DeliveryLogParams {
  status?: string;
  channel?: string;
  from?: string;
  to?: string;
  page?: number;
  size?: number;
}

export type NotificationDeliveryLogPage = PageResponse<NotificationDeliveryLog>;

export type GoLiveRecordStatus = "DRAFT" | "APPROVED" | "REJECTED";
export type GoLiveStepResult = "PASS" | "FAIL" | "SKIP";

export interface GoLiveStep {
  stepName: string;
  result: GoLiveStepResult;
  note?: string | null;
  evidenceUrl?: string | null;
}

export interface GoLiveRecord {
  id: string;
  tenantId: string;
  tenantName: string;
  environment: string;
  buildVersion: string;
  status: GoLiveRecordStatus;
  steps: GoLiveStep[];
  performedBy: string;
  performedByName: string;
  startedAt: string;
  completedAt: string | null;
  approvedBy: string | null;
  approvedByName: string | null;
  approvedAt: string | null;
  approvalNote: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GoLiveRecordParams {
  tenantId?: string;
  status?: GoLiveRecordStatus;
  page?: number;
  size?: number;
}

export interface CreateGoLiveRecordPayload {
  tenantId: string;
  environment: string;
  buildVersion: string;
  steps?: GoLiveStep[];
}

export type GoLiveRecordPage = PageResponse<GoLiveRecord>;
