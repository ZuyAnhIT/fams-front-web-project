import { apiClient } from "@/services/api-client";
import { useAuthStore } from "@/stores/auth.store";
import type {
  ApiResponse,
  Notification,
  NotificationFilter,
  NotificationEventType,
  NotificationPageResponse,
  NotificationSetting,
  NotificationTemplate,
  NotificationTemplatePage,
  NotificationTemplatePayload,
  UpdateNotificationTemplatePayload,
  UpdateNotificationSettingPayload,
} from "../types/notification.type";

const getTenantId = (): string | null => {
  const state = useAuthStore.getState();
  if (state.user && state.user.tenantId) {
    return state.user.tenantId;
  }
  return null;
};

const emptyNotificationPage = (
  filter: NotificationFilter,
): NotificationPageResponse => ({
  items: [],
  page: filter.page ?? 0,
  size: filter.size ?? 20,
  totalElements: 0,
  totalPages: 0,
  first: true,
  last: true,
  unreadCount: 0,
});

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

    const data = response.data.data as NotificationPageResponse | null;
    if (!data) {
      // A successful response should always contain a page. Keep the global
      // notification shell usable if an older deployment returns data=null.
      return emptyNotificationPage(filter);
    }

    return {
      ...emptyNotificationPage(filter),
      ...data,
      items: Array.isArray(data.items) ? data.items : [],
      unreadCount: Number.isFinite(data.unreadCount) ? data.unreadCount : 0,
    };
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

    const response = await apiClient.patch<ApiResponse<{ markedCount: number }>>(
      `/tenants/${tenantId}/notifications/read-all`
    );

    return response.data.data.markedCount;
  },

  markBatchAsRead: async (notificationIds: string[]): Promise<number> => {
    const tenantId = getTenantId();
    if (!tenantId) throw new Error("Tenant ID not found");
    const response = await apiClient.patch<ApiResponse<{ markedCount: number }>>(
      `/tenants/${tenantId}/notifications/read`,
      { notificationIds },
    );
    return response.data.data.markedCount;
  },

  getSettings: async (): Promise<NotificationSetting[]> => {
    const response = await apiClient.get<ApiResponse<NotificationSetting[]>>(
      "/me/notification-settings",
    );
    return response.data.data;
  },

  getEventTypes: async (): Promise<NotificationEventType[]> => {
    const response = await apiClient.get<ApiResponse<NotificationEventType[]>>(
      "/notification-event-types",
    );
    return response.data.data;
  },

  updateSetting: async (
    eventType: string,
    payload: UpdateNotificationSettingPayload,
  ): Promise<NotificationSetting> => {
    const response = await apiClient.put<ApiResponse<NotificationSetting>>(
      `/me/notification-settings/${encodeURIComponent(eventType)}`,
      payload,
    );
    return response.data.data;
  },

  getTemplates: async (tenantId: string, page = 0, size = 20): Promise<NotificationTemplatePage> => {
    const response = await apiClient.get<ApiResponse<NotificationTemplatePage>>(
      `/tenants/${tenantId}/notification-templates`,
      { params: { page, size } },
    );
    return response.data.data;
  },

  createTemplate: async (tenantId: string, payload: NotificationTemplatePayload): Promise<NotificationTemplate> => {
    const response = await apiClient.post<ApiResponse<NotificationTemplate>>(
      `/tenants/${tenantId}/notification-templates`,
      payload,
    );
    return response.data.data;
  },

  updateTemplate: async (
    tenantId: string,
    templateId: string,
    payload: UpdateNotificationTemplatePayload,
  ): Promise<NotificationTemplate> => {
    const response = await apiClient.put<ApiResponse<NotificationTemplate>>(
      `/tenants/${tenantId}/notification-templates/${templateId}`,
      payload,
    );
    return response.data.data;
  },

  deleteTemplate: async (tenantId: string, templateId: string): Promise<void> => {
    await apiClient.delete(`/tenants/${tenantId}/notification-templates/${templateId}`);
  },
};
