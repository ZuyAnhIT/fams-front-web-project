export interface PermissionResponse {
  id: string;
  name: string;
  resource: string;
  action: string;
  description: string;
}

export interface PermissionGroupResponse {
  resource: string;
  permissionCount: number;
  permissions: PermissionResponse[];
}

export interface RoleResponse {
  id: string;
  name: string;
  description: string;
  isSystem: boolean;
  tenantId: string | null;
  permissionCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface RoleDetailResponse {
  id: string;
  name: string;
  description: string;
  isSystem: boolean;
  tenantId: string | null;
  permissions: PermissionResponse[];
  permissionCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRoleRequest {
  tenantId: string;
  name: string;
  description?: string;
  permissionIds?: string[];
}

export interface UpdateRoleRequest {
  name: string;
  description?: string;
  permissionIds: string[];
}

export interface AssignRoleRequest {
  userId: string;
  roleId: string;
  tenantId: string;
}

export interface UserRoleResponse {
  id: string;
  userId: string;
  roleId: string;
  tenantId: string;
  assignedAt?: string;
  roleName?: string;
  permissions?: string[];
}
