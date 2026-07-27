export type AssignmentDayOfWeek =
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY"
  | "SUNDAY";

export interface AssignmentEmployeeSummary {
  id: string;
  employeeCode: string | null;
  fullName: string;
  status: "active" | "inactive" | "terminated";
}

export interface AssignmentShiftSummary {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  status: "active" | "inactive";
}

export interface AssignmentResponse {
  id: string;
  tenantId: string;
  siteId: string;
  employeeId: string;
  shiftId: string | null;
  employeeSummary: AssignmentEmployeeSummary | null;
  shiftSummary: AssignmentShiftSummary | null;
  startDate: string; // yyyy-MM-dd
  endDate: string | null; // yyyy-MM-dd
  daysOfWeek: AssignmentDayOfWeek[] | null;
  role: "worker" | "supervisor";
  status: "active" | "cancelled";
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface AssignmentListParams {
  tenantId?: string;
  siteId?: string;
  status?: "active" | "cancelled";
  role?: "worker" | "supervisor";
  employeeId?: string;
  shiftId?: string;
  sortBy?: "startDate" | "endDate" | "role" | "status" | "createdAt";
  sortDir?: "asc" | "desc";
  page?: number;
  size?: number;
}

/** Khớp với CreateAssignmentRequest.java của Backend */
export interface CreateAssignmentRequest {
  employeeId: string;
  shiftId?: string;
  startDate: string; // yyyy-MM-dd
  endDate?: string;
  daysOfWeek?: AssignmentDayOfWeek[];
  role?: "worker" | "supervisor";
  notes?: string;
}

/** Khớp với UpdateAssignmentRequest.java của Backend */
export interface UpdateAssignmentRequest {
  shiftId?: string;
  clearShift?: boolean;
  startDate?: string;
  endDate?: string;
  clearEndDate?: boolean;
  daysOfWeek?: AssignmentDayOfWeek[];
  clearDaysOfWeek?: boolean;
  role?: "worker" | "supervisor";
  notes?: string;
}
