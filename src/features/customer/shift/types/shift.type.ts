import type { CheckinPolicy } from "../../checkin/constants/checkin-policy";

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
  maxOtMinutesPerDay: number | null;
  maxOtMinutesPerWeek: number | null;
  status: "active" | "inactive";
  isDefault: boolean;
  checkinPolicyOverride: CheckinPolicy | null;
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
  checkinPolicyOverride?: CheckinPolicy | null;
  isDefault?: boolean;
}

export interface UpdateShiftRequest {
  name?: string;
  startTime?: string;
  endTime?: string;
  allowOvernight?: boolean;
  status?: "active" | "inactive";
  checkinPolicyOverride?: CheckinPolicy;
  clearCheckinPolicyOverride?: boolean;
  isDefault?: boolean;
}

export interface ConfigureShiftOtRequest {
  allowOvertime?: boolean;
  earlyCheckinMinutes?: number;
  lateCheckoutMinutes?: number;
  maxOtMinutesPerDay?: number;
  clearMaxOtMinutesPerDay?: boolean;
  maxOtMinutesPerWeek?: number;
  clearMaxOtMinutesPerWeek?: boolean;
}

export interface ShiftListParams {
  status?: "active" | "inactive";
  search?: string;
  isDefault?: boolean;
  page?: number;
  size?: number;
}
