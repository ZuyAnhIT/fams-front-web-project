import type { PageResponse } from "@/types/api";

export interface ScheduledJobStatus {
  jobName: string;
  lastStatus: string;
  lastRunAt: string | null;
  errorMessage: string | null;
}

export interface SystemStatus {
  overallHealth: string;
  healthComponents: Record<string, { status?: string; details?: Record<string, unknown> } | string>;
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
