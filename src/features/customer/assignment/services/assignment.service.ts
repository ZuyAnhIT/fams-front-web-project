import { apiClient } from "@/services/api-client";
import { ApiResponse, PageResponse } from "@/types/api";
import { AssignmentResponse, AssignmentListParams } from "../types/assignment.type";

export const assignmentService = {
  getAssignments: async (
    tenantId: string,
    siteId: string,
    params: Omit<AssignmentListParams, 'tenantId' | 'siteId'>
  ): Promise<ApiResponse<PageResponse<AssignmentResponse>>> => {
    const response = await apiClient.get<ApiResponse<PageResponse<AssignmentResponse>>>(
      `/tenants/${tenantId}/sites/${siteId}/assignments`,
      { params }
    );
    return response.data;
  },
};
