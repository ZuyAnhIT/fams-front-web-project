import { apiClient } from "@/services/api-client";
import type { ApiResponse } from "@/types/api";
import type {
  DeliveryLogParams,
  NotificationDeliveryLogPage,
  SystemStatus,
} from "../types/system-operations.type";

export const systemOperationsService = {
  async getSystemStatus() {
    const response = await apiClient.get<ApiResponse<SystemStatus>>("/platform/system-status");
    return response.data.data;
  },

  async getDeliveryLogs(params: DeliveryLogParams) {
    const response = await apiClient.get<ApiResponse<NotificationDeliveryLogPage>>(
      "/platform/notifications/delivery-logs",
      { params },
    );
    return response.data.data;
  },
};
