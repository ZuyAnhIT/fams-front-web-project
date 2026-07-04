import { apiClient } from "@/services/api-client";
import { ApiResponse, PageResponse } from "@/types/api";
import {
  AssignmentResponse,
  AssignmentListParams,
  CreateAssignmentRequest,
  UpdateAssignmentRequest,
} from "../types/assignment.type";

export const assignmentService = {
  /** Danh sách phân công theo công trình (GET) */
  getAssignments: async (
    tenantId: string,
    siteId: string,
    params: Omit<AssignmentListParams, "tenantId" | "siteId">
  ): Promise<ApiResponse<PageResponse<AssignmentResponse>>> => {
    const response = await apiClient.get<ApiResponse<PageResponse<AssignmentResponse>>>(
      `/tenants/${tenantId}/sites/${siteId}/assignments`,
      { params }
    );
    return response.data;
  },

  /** Tạo phân công nhân viên vào công trình (POST) */
  createAssignment: async (
    tenantId: string,
    siteId: string,
    data: CreateAssignmentRequest
  ): Promise<ApiResponse<AssignmentResponse>> => {
    const response = await apiClient.post<ApiResponse<AssignmentResponse>>(
      `/tenants/${tenantId}/sites/${siteId}/assignments`,
      data
    );
    return response.data;
  },

  /** Cập nhật phân công (PUT) */
  updateAssignment: async (
    tenantId: string,
    siteId: string,
    assignmentId: string,
    data: UpdateAssignmentRequest
  ): Promise<ApiResponse<AssignmentResponse>> => {
    const response = await apiClient.put<ApiResponse<AssignmentResponse>>(
      `/tenants/${tenantId}/sites/${siteId}/assignments/${assignmentId}`,
      data
    );
    return response.data;
  },

  /** Hủy phân công - soft delete (DELETE) */
  cancelAssignment: async (
    tenantId: string,
    siteId: string,
    assignmentId: string
  ): Promise<void> => {
    await apiClient.delete(
      `/tenants/${tenantId}/sites/${siteId}/assignments/${assignmentId}`
    );
  },
};
