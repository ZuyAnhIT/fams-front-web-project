import { apiClient } from "@/services/api-client";
import { ApiResponse, PageResponse } from "@/types/api";
import {
  AssignRoleRequest,
  CreateRoleRequest,
  PermissionGroupResponse,
  RoleDetailResponse,
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

  revokeRole: async (id: string): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete<ApiResponse<void>>(
      `/user-roles/${id}`
    );
    return response.data;
  },
};
