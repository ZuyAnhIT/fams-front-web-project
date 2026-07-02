export interface AssignmentResponse {
  id: string;
  tenantId: string;
  siteId: string;
  employeeId: string;
  shiftId: string | null;
  startDate: string; // yyyy-MM-dd
  endDate: string | null; // yyyy-MM-dd
  role: "worker" | "supervisor" | string;
  status: "active" | "cancelled" | string;
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
