export interface AssignmentResponse {
  id: string;
  tenantId: string;
  siteId: string;
  employeeId: string;
  shiftId: string | null;
  startDate: string; // yyyy-MM-dd
  endDate: string | null; // yyyy-MM-dd
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
  status?: string;
  role?: string;
  employeeId?: string;
  shiftId?: string;
  sortBy?: string;
  sortDir?: "asc" | "desc";
  page?: number;
  size?: number;
}

/** Khớp với CreateAssignmentRequest.java của Backend */
export interface CreateAssignmentRequest {
  employeeId: string;
  shiftId?: string | null;
  startDate: string; // yyyy-MM-dd
  endDate?: string | null;
  role?: "worker" | "supervisor";
  notes?: string;
}

/** Khớp với UpdateAssignmentRequest.java của Backend */
export interface UpdateAssignmentRequest {
  shiftId?: string | null;
  clearShift?: boolean;
  startDate?: string;
  endDate?: string | null;
  clearEndDate?: boolean;
  role?: "worker" | "supervisor";
  notes?: string;
}
