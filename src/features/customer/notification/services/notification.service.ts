import { apiClient } from "@/services/api-client";
import { useAuthStore } from "@/stores/auth.store";
import type {
  ApiResponse,
  Notification,
  NotificationFilter,
  NotificationPageResponse,
} from "../types/notification.type";

const getTenantId = (): string | null => {
  const state = useAuthStore.getState();
  if (state.user && state.user.tenantId) {
    return state.user.tenantId;
  }
  return null;
};

export const notificationService = {
  getNotifications: async (
    filter: NotificationFilter = {}
  ): Promise<NotificationPageResponse> => {
    const tenantId = getTenantId();
    if (!tenantId) {
      throw new Error("Tenant ID not found");
    }

    const response = await apiClient.get<ApiResponse<NotificationPageResponse>>(
      `/tenants/${tenantId}/notifications`,
      { params: filter }
    );

    return response.data.data;
  },

  markAsRead: async (notificationId: string): Promise<Notification> => {
    const tenantId = getTenantId();
    if (!tenantId) {
      throw new Error("Tenant ID not found");
    }

    const response = await apiClient.patch<ApiResponse<Notification>>(
      `/tenants/${tenantId}/notifications/${notificationId}/read`
    );

    return response.data.data;
  },

  markAllAsRead: async (): Promise<number> => {
    const tenantId = getTenantId();
    if (!tenantId) {
      throw new Error("Tenant ID not found");
    }

    const response = await apiClient.patch<ApiResponse<{ count: number }>>(
      `/tenants/${tenantId}/notifications/read-all`
    );

    return response.data.data.count;
  },
};
