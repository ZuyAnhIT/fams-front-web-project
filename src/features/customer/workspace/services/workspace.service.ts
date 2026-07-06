import { apiClient } from "@/services/api-client";
import { ApiResponse, PageResponse } from "@/types/api";
import {
  WorkspaceResponse,
  WorkspaceTreeResponse,
  CreateWorkspaceRequest,
  UpdateWorkspaceRequest,
} from "../types";

export const workspaceService = {
  getWorkspaces: async (params: {
    tenantId: string;
    search?: string;
    status?: string;
    type?: string;
    sortBy?: string;
    sortDir?: "asc" | "desc";
    page?: number;
    size?: number;
  }): Promise<ApiResponse<PageResponse<WorkspaceResponse>>> => {
    const { tenantId, ...restParams } = params;
    const response = await apiClient.get<ApiResponse<PageResponse<WorkspaceResponse>>>(
      `/tenants/${tenantId}/workspaces`,
      { params: restParams }
    );
    return response.data;
  },

  getWorkspaceTree: async (params: {
    tenantId: string;
    search?: string;
    status?: string;
  }): Promise<ApiResponse<WorkspaceTreeResponse[]>> => {
    const { tenantId, ...restParams } = params;
    const response = await apiClient.get<ApiResponse<WorkspaceTreeResponse[]>>(
      `/tenants/${tenantId}/workspaces/tree`,
      { params: restParams }
    );
    return response.data;
  },

  getWorkspaceById: async (tenantId: string, workspaceId: string): Promise<ApiResponse<WorkspaceResponse>> => {
    const response = await apiClient.get<ApiResponse<WorkspaceResponse>>(
      `/tenants/${tenantId}/workspaces/${workspaceId}`
    );
    return response.data;
  },

  createWorkspace: async (
    tenantId: string,
    data: CreateWorkspaceRequest
  ): Promise<ApiResponse<WorkspaceResponse>> => {
    const response = await apiClient.post<ApiResponse<WorkspaceResponse>>(
      `/tenants/${tenantId}/workspaces`,
      data
    );
    return response.data;
  },

  updateWorkspace: async (
    tenantId: string,
    workspaceId: string,
    data: UpdateWorkspaceRequest
  ): Promise<ApiResponse<WorkspaceResponse>> => {
    const response = await apiClient.put<ApiResponse<WorkspaceResponse>>(
      `/tenants/${tenantId}/workspaces/${workspaceId}`,
      data
    );
    return response.data;
  },

  getWorkspaceMembers: async (
    tenantId: string,
    workspaceId: string,
    page: number = 0,
    size: number = 20
  ): Promise<ApiResponse<PageResponse<any>>> => {
    const response = await apiClient.get<ApiResponse<PageResponse<any>>>(
      `/tenants/${tenantId}/workspaces/${workspaceId}/members`,
      { params: { page, size } }
    );
    return response.data;
  },

  assignWorkspaceMember: async (
    tenantId: string,
    workspaceId: string,
    data: any
  ): Promise<ApiResponse<any>> => {
    const response = await apiClient.post<ApiResponse<any>>(
      `/tenants/${tenantId}/workspaces/${workspaceId}/members`,
      data
    );
    return response.data;
  },

  transferWorkspaceMember: async (
    tenantId: string,
    workspaceId: string,
    memberId: string,
    data: { targetWorkspaceId: string; role?: "member" | "lead" | "manager" }
  ): Promise<ApiResponse<any>> => {
    const response = await apiClient.post<ApiResponse<any>>(
      `/tenants/${tenantId}/workspaces/${workspaceId}/members/${memberId}/transfer`,
      data
    );
    return response.data;
  },

  removeWorkspaceMember: async (
    tenantId: string,
    workspaceId: string,
    memberId: string
  ): Promise<void> => {
    await apiClient.delete(
      `/tenants/${tenantId}/workspaces/${workspaceId}/members/${memberId}`
    );
  },
};
