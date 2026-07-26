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
}

export interface TransferWorkspaceMemberRequest {
  targetWorkspaceId: string;
  role?: "member" | "lead" | "manager";
}
