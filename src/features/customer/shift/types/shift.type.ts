export interface ShiftResponse {
  id: string;
  siteId: string;
  tenantId: string;
  name: string;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  allowOvernight: boolean;
  allowOvertime: boolean;
  earlyCheckinMinutes: number;
  lateCheckoutMinutes: number;
  status: "active" | "inactive";
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  assignmentHistoryCount: number;
  canDelete: boolean;
}

export interface CreateShiftRequest {
  name: string;
  startTime: string;
  endTime: string;
  allowOvernight: boolean;
}

export interface UpdateShiftRequest {
  name?: string;
  startTime?: string;
  endTime?: string;
  allowOvernight?: boolean;
  status?: "active" | "inactive";
}

export interface ConfigureShiftOtRequest {
  allowOvertime?: boolean;
  earlyCheckinMinutes?: number;
  lateCheckoutMinutes?: number;
}

export interface ShiftListParams {
  status?: "active" | "inactive";
  page?: number;
  size?: number;
}
