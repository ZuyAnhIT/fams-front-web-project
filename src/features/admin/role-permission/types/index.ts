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
  assignmentCount: number;
  permissions: PermissionResponse[];
}

export interface RoleResponse {
  id: string;
  name: string;
  description: string;
  isSystem: boolean;
  isActive: boolean;
  tenantId: string | null;
  permissionCount: number;
  assignmentCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface RoleDetailResponse {
  id: string;
  name: string;
  description: string;
  isSystem: boolean;
  isActive: boolean;
  tenantId: string | null;
  permissions: PermissionResponse[];
  permissionCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRoleRequest {
  tenantId?: string;
  name: string;
  description?: string;
  permissionIds?: string[];
}

export interface UpdateRoleRequest {
  name: string;
  description?: string;
  permissionIds: string[];
  isActive?: boolean;
}

export interface AssignRoleRequest {
  userId: string;
  roleId: string;
  tenantId: string;
  siteIds?: string[];
}

export interface AssignPlatformRoleRequest {
  userId: string;
  roleId: string;
}

export interface CloneRoleRequest {
  name: string;
  description?: string;
  tenantId?: string;
}

export interface BulkAssignRoleRequest {
  tenantId: string;
  roleId: string;
  revokeRoleId?: string;
  userIds: string[];
  siteIds?: string[];
}

export interface BulkAssignRoleResult {
  userId: string;
  success: boolean;
  userRoleId?: string;
  message?: string;
}

export interface BulkAssignRoleResponse {
  results: BulkAssignRoleResult[];
  successCount: number;
  failureCount: number;
}

export interface RoleMember {
  userRoleId: string;
  userId: string;
  displayName: string | null;
  contact: string | null;
  assignedAt: string;
  siteIds: string[];
}

export interface UserRoleResponse {
  id: string;
  userId: string;
  roleId: string;
  tenantId: string;
  /** Issue #3 (docs/issues/ISSUES.md): tenant display name, for building a company switcher. */
  tenantName?: string;
  tenantSlug?: string;
  assignedAt?: string;
  roleName?: string;
  permissions?: string[];
  siteIds?: string[];
  sites?: Array<{ id: string; name: string }>;
}
