import { apiClient } from "@/services/api-client";
import { type ApiResponse, type PageResponse } from "@/types/api";
import type {
  Role,
  RoleDetailResponse,
  CreateRolePayload,
  UpdateRolePayload,
  PermissionGroupResponse,
} from "../types/role.type";
import { useAuthStore } from "@/stores/auth.store";

const getTenantId = () => {
  const state = useAuthStore.getState();
  if (state.user && state.user.tenantId) {
    return state.user.tenantId;
  }
  throw new Error("Tenant ID is required but not found in user state.");
};

export const roleService = {
  /**
   * Lấy danh sách Vai trò (Roles) có phân trang
   */
  async listRoles(params: {
    page?: number;
    size?: number;
    search?: string;
    isSystem?: boolean;
    sortBy?: string;
    sortDir?: "asc" | "desc";
    tenantId?: string; // Platform Admin filter
  }): Promise<PageResponse<Role>> {
    // Tự động thêm tenantId vào params nếu không phải Platform Admin
    const effectiveParams = { ...params, tenantId: params.tenantId || getTenantId() };
    const response = await apiClient.get<ApiResponse<PageResponse<Role>>>("/roles", {
      params: effectiveParams,
    });
    return response.data.data;
  },

  /**
   * Lấy chi tiết Role (bao gồm list permissions)
   */
  async getRole(id: string): Promise<RoleDetailResponse> {
    const response = await apiClient.get<ApiResponse<RoleDetailResponse>>(`/roles/${id}`);
    return response.data.data;
  },

  /**
   * Tạo Role mới
   */
  async createRole(payload: CreateRolePayload): Promise<RoleDetailResponse> {
    const effectivePayload = { ...payload, tenantId: payload.tenantId || getTenantId() };
    const response = await apiClient.post<ApiResponse<RoleDetailResponse>>("/roles", effectivePayload);
    return response.data.data;
  },

  /**
   * Cập nhật Role
   */
  async updateRole(id: string, payload: UpdateRolePayload): Promise<RoleDetailResponse> {
    const response = await apiClient.put<ApiResponse<RoleDetailResponse>>(`/roles/${id}`, payload);
    return response.data.data;
  },

  /**
   * Xóa Role (Soft delete)
   */
  async deleteRole(id: string): Promise<void> {
    await apiClient.delete(`/roles/${id}`);
  },

  /**
   * Lấy danh sách tất cả các nhóm quyền (Permission Matrix)
   */
  async listGroupedPermissions(): Promise<PermissionGroupResponse[]> {
    const response = await apiClient.get<ApiResponse<PermissionGroupResponse[]>>("/permissions");
    return response.data.data;
  },
};
