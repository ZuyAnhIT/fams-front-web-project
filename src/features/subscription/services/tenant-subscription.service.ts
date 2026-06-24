import { apiClient } from "@/services/api-client";
import type { ApiResponse } from "@/types/api";
import type {
  SubscriptionResponse,
  AssignSubscriptionPayload,
  UpdateSubscriptionPayload,
} from "../types/subscription.type";

class TenantSubscriptionService {
  private readonly baseUrl = "/tenants";

  async getSubscription(tenantId: string): Promise<SubscriptionResponse> {
    const response = await apiClient.get<ApiResponse<SubscriptionResponse>>(
      `${this.baseUrl}/${tenantId}/subscription`
    );
    return response.data.data;
  }

  async assignSubscription(
    tenantId: string,
    payload: AssignSubscriptionPayload
  ): Promise<SubscriptionResponse> {
    const response = await apiClient.post<ApiResponse<SubscriptionResponse>>(
      `${this.baseUrl}/${tenantId}/subscription`,
      payload
    );
    return response.data.data;
  }

  async updateSubscription(
    tenantId: string,
    payload: UpdateSubscriptionPayload
  ): Promise<SubscriptionResponse> {
    const response = await apiClient.patch<ApiResponse<SubscriptionResponse>>(
      `${this.baseUrl}/${tenantId}/subscription`,
      payload
    );
    return response.data.data;
  }
}

export const tenantSubscriptionService = new TenantSubscriptionService();
