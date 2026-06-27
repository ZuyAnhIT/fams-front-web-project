import { apiClient } from "@/services/api-client";
import { type ApiResponse, type PageResponse } from "@/types/api";
import type { PaginationState } from "@/hooks/usePagination";
import type {
  PlanResponse,
  PlanLimitsResponse,
  CreatePlanPayload,
  UpdatePlanPayload,
  UpdatePlanLimitsPayload,
} from "../types/subscription.type";

export const subscriptionService = {
  /**
   * Lấy danh sách các Gói (Plans)
   */
  async listPlans(activeOnly: boolean = false, state?: PaginationState): Promise<PageResponse<PlanResponse>> {
    const response = await apiClient.get<ApiResponse<PageResponse<PlanResponse>>>("/plans", {
      params: { 
        activeOnly,
        page: state?.page,
        size: state?.size,
        sortBy: state?.sortBy,
        sortDir: state?.sortDir
      },
    });
    return response.data.data;
  },

  /**
   * Tạo Gói dịch vụ mới
   */
  async createPlan(payload: CreatePlanPayload): Promise<PlanResponse> {
    const response = await apiClient.post<ApiResponse<PlanResponse>>("/plans", payload);
    return response.data.data;
  },

  /**
   * Cập nhật thông tin Gói
   */
  async updatePlan(id: string, payload: UpdatePlanPayload): Promise<PlanResponse> {
    const response = await apiClient.patch<ApiResponse<PlanResponse>>(`/plans/${id}`, payload);
    return response.data.data;
  },

  /**
   * Lấy Giới hạn của Gói (Limits)
   */
  async getLimits(planId: string): Promise<PlanLimitsResponse> {
    const response = await apiClient.get<ApiResponse<PlanLimitsResponse>>(`/plans/${planId}/limits`);
    return response.data.data;
  },

  /**
   * Cập nhật Giới hạn của Gói
   */
  async updateLimits(planId: string, payload: UpdatePlanLimitsPayload): Promise<PlanLimitsResponse> {
    const response = await apiClient.patch<ApiResponse<PlanLimitsResponse>>(`/plans/${planId}/limits`, payload);
    return response.data.data;
  },
};
