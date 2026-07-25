export interface ScheduledCheckResponse {
  id: string;
  tenantId: string;
  assignmentId: string;
  employeeId: string;
  siteId: string;
  shiftId: string;
  configId: string;
  checkDate: string;
  checkIndex: number;
  scheduledAt: string;
  expiresAt?: string | null;
  status: "pending" | "sent" | "responded" | "no_response" | "cancelled";
  createdAt: string;
}

export interface ScheduledCheckListParams {
  tenantId: string;
  siteId?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  size?: number;
}
