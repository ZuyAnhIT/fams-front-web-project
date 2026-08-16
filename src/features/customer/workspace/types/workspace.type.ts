export interface WorkspaceResponse {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  type: "department" | "team";
  parentId: string | null;
  status: "active" | "inactive";
  activeMemberCount: number;
  childWorkspaceCount: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceTreeResponse extends WorkspaceResponse {
  children: WorkspaceTreeResponse[];
}

export interface WorkspaceListParams {
  tenantId: string;
  search?: string;
  status?: "active" | "inactive";
  type?: "department" | "team";
  sortBy?: string;
  sortDir?: "asc" | "desc";
  page?: number;
  size?: number;
}

export interface WorkspaceTreeParams {
  tenantId: string;
  search?: string;
  status?: "active" | "inactive";
}

export interface CreateWorkspaceRequest {
  name: string;
  description?: string;
  type?: "department" | "team";
  parentId?: string;
}

export interface UpdateWorkspaceRequest {
  name?: string;
  description?: string;
  type?: "department" | "team";
  status?: "active" | "inactive";
  parentId?: string;
  clearParent?: boolean;
}

export interface WorkspaceMemberResponse {
  id: string;
  workspaceId: string;
  employeeId: string;
  tenantId: string;
  role: "member" | "lead" | "manager";
  assignedBy: string;
  /** True if this is the employee's primary workspace — at most one active primary per employee. */
  isPrimary: boolean;
  /** Date this membership starts (may be back- or future-dated by HR). */
  effectiveFrom: string | null;
  /** When this membership ended (transfer or removal), null while active. */
  leftAt: string | null;
  createdAt: string;
  updatedAt: string;
  // Bổ sung thêm thông tin nhân viên để hiển thị trên UI
  employee?: {
    id: string;
    firstName: string;
    lastName: string;
    fullName: string;
    employeeCode?: string;
    position?: string;
    email?: string;
    status?: string;
  };
}

export interface AssignWorkspaceMemberRequest {
  employeeId: string;
  role: "member" | "lead" | "manager";
  /** Optional, default: today. */
  effectiveFrom?: string;
  /** Optional — if omitted, defaults to true only when the employee has no other active primary
   *  workspace yet. */
  isPrimary?: boolean;
}

export interface TransferWorkspaceMemberRequest {
  targetWorkspaceId: string;
  role?: "member" | "lead" | "manager";
  /** Optional, default: today. */
  effectiveFrom?: string;
  /** Optional — if omitted, carries over the isPrimary flag from the membership being transferred. */
  isPrimary?: boolean;
}
