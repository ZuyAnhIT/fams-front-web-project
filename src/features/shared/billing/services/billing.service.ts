import { apiClient } from "@/services/api-client";
import type { ApiResponse, PageResponse } from "@/types/api";
import type { BillingOrder, BillingOrderStatus, CreateBillingOrderPayload } from "../types/billing.type";

export const billingService = {
  async create(tenantId: string, payload: CreateBillingOrderPayload): Promise<BillingOrder> {
    const response = await apiClient.post<ApiResponse<BillingOrder>>(
      `/tenants/${tenantId}/billing-orders`, payload,
    );
    return response.data.data;
  },

  async listForTenant(tenantId: string, page = 0, size = 20): Promise<PageResponse<BillingOrder>> {
    const response = await apiClient.get<ApiResponse<PageResponse<BillingOrder>>>(
      `/tenants/${tenantId}/billing-orders`, { params: { page, size } },
    );
    return response.data.data;
  },

  async getForTenant(tenantId: string, orderId: string): Promise<BillingOrder> {
    const response = await apiClient.get<ApiResponse<BillingOrder>>(
      `/tenants/${tenantId}/billing-orders/${orderId}`,
    );
    return response.data.data;
  },

  async refreshForTenant(tenantId: string, orderId: string): Promise<BillingOrder> {
    const response = await apiClient.post<ApiResponse<BillingOrder>>(
      `/tenants/${tenantId}/billing-orders/${orderId}/refresh`, {},
    );
    return response.data.data;
  },

  async cancelForTenant(tenantId: string, orderId: string): Promise<BillingOrder> {
    const response = await apiClient.post<ApiResponse<BillingOrder>>(
      `/tenants/${tenantId}/billing-orders/${orderId}/cancel`, {},
    );
    return response.data.data;
  },

  async listForPlatform(params: {
    tenantId?: string;
    status?: BillingOrderStatus;
    page?: number;
    size?: number;
  }): Promise<PageResponse<BillingOrder>> {
    const response = await apiClient.get<ApiResponse<PageResponse<BillingOrder>>>("/billing-orders", { params });
    return response.data.data;
  },

  async refreshForPlatform(orderId: string): Promise<BillingOrder> {
    const response = await apiClient.post<ApiResponse<BillingOrder>>(`/billing-orders/${orderId}/refresh`, {});
    return response.data.data;
  },
};
