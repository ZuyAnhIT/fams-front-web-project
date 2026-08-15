import { apiClient } from "@/services/api-client";
import { ApiResponse, PageResponse } from "@/types/api";
import {
  AssignRoleRequest,
  AssignPlatformRoleRequest,
  BulkAssignRoleRequest,
  BulkAssignRoleResponse,
  CloneRoleRequest,
  CreateRoleRequest,
  PermissionGroupResponse,
  RoleDetailResponse,
  RoleMember,
  RoleResponse,
  UpdateRoleRequest,
  UserRoleResponse,
} from "../types";

export const rolePermissionService = {
  // Roles
  getRoles: async (params: {
    tenantId?: string;
    search?: string;
    isSystem?: boolean;
    isActive?: boolean;
    sortBy?: string;
    sortDir?: "asc" | "desc";
    page?: number;
    size?: number;
  }): Promise<ApiResponse<PageResponse<RoleResponse>>> => {
    const response = await apiClient.get<ApiResponse<PageResponse<RoleResponse>>>(
      "/roles",
      { params }
    );
    return response.data;
  },

  getRoleById: async (id: string): Promise<ApiResponse<RoleDetailResponse>> => {
    const response = await apiClient.get<ApiResponse<RoleDetailResponse>>(
      `/roles/${id}`
    );
    return response.data;
  },

  getRoleMembers: async (id: string, tenantId?: string): Promise<ApiResponse<RoleMember[]>> => {
    const response = await apiClient.get<ApiResponse<RoleMember[]>>(
      `/roles/${id}/members`,
      { params: tenantId ? { tenantId } : undefined }
    );
    return response.data;
  },


  createRole: async (
    data: CreateRoleRequest
  ): Promise<ApiResponse<RoleDetailResponse>> => {
    const response = await apiClient.post<ApiResponse<RoleDetailResponse>>(
      "/roles",
      data
    );
    return response.data;
  },

  updateRole: async (
    id: string,
    data: UpdateRoleRequest
  ): Promise<ApiResponse<RoleDetailResponse>> => {
    const response = await apiClient.put<ApiResponse<RoleDetailResponse>>(
      `/roles/${id}`,
      data
    );
    return response.data;
  },

  deleteRole: async (id: string): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete<ApiResponse<void>>(`/roles/${id}`);
    return response.data;
  },

  cloneRole: async (
    sourceRoleId: string,
    data: CloneRoleRequest
  ): Promise<ApiResponse<RoleDetailResponse>> => {
    const response = await apiClient.post<ApiResponse<RoleDetailResponse>>(
      `/roles/${sourceRoleId}/clone`,
      data
    );
    return response.data;
  },

  // Permissions
  getPermissionsGrouped: async (): Promise<
    ApiResponse<PermissionGroupResponse[]>
  > => {
    const response = await apiClient.get<ApiResponse<PermissionGroupResponse[]>>(
      "/permissions"
    );
    return response.data;
  },

  // User Roles
  assignRole: async (
    data: AssignRoleRequest
  ): Promise<ApiResponse<UserRoleResponse>> => {
    const response = await apiClient.post<ApiResponse<UserRoleResponse>>(
      "/user-roles",
      data
    );
    return response.data;
  },

  assignPlatformRole: async (
    data: AssignPlatformRoleRequest
  ): Promise<ApiResponse<UserRoleResponse>> => {
    const response = await apiClient.post<ApiResponse<UserRoleResponse>>(
      "/user-roles/platform",
      data
    );
    return response.data;
  },

  revokeRole: async (id: string): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete<ApiResponse<void>>(
      `/user-roles/${id}`
    );
    return response.data;
  },

  bulkAssignRole: async (
    data: BulkAssignRoleRequest
  ): Promise<ApiResponse<BulkAssignRoleResponse>> => {
    const response = await apiClient.post<ApiResponse<BulkAssignRoleResponse>>(
      "/user-roles/bulk-assign",
      data
    );
    return response.data;
  },

  getMyRoles: async (): Promise<ApiResponse<UserRoleResponse[]>> => {
    const response = await apiClient.get<ApiResponse<UserRoleResponse[]>>(
      "/roles/me"
    );
    return response.data;
  },
};
