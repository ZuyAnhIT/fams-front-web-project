export interface Permission {
  id: string;
  name: string;
  description: string;
}

export interface PermissionGroupResponse {
  resource: string;
  permissions: Permission[];
}

export interface Role {
  id: string;
  name: string;
  description: string;
  isSystem: boolean;
  tenantId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RoleDetailResponse extends Role {
  permissions: Permission[];
}

export interface RoleListParams {
  page?: number;
  size?: number;
  search?: string;
  isSystem?: boolean;
  sortBy?: string;
  sortDir?: "asc" | "desc";
  tenantId?: string;
}

export interface CreateRolePayload {
  tenantId?: string; // Tùy chọn (Platform Admin có thể set, Tenant admin thì tự lấy từ JWT)
  name: string;
  description?: string;
  permissionIds: string[];
}

export interface UpdateRolePayload {
  name: string;
  description?: string;
  permissionIds: string[];
}
