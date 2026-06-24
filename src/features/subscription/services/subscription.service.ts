import { apiClient } from "@/services/api-client";
import { type ApiResponse } from "@/types/api";
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
  async listPlans(activeOnly: boolean = false): Promise<PlanResponse[]> {
    const response = await apiClient.get<ApiResponse<PlanResponse[]>>("/plans", {
      params: { activeOnly },
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
