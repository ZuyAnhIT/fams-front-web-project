import { apiClient } from "@/services/api-client";
import type { ApiResponse } from "@/types/api";
import type {
  DeliveryLogParams,
  CreateGoLiveRecordPayload,
  GoLiveRecord,
  GoLiveRecordPage,
  GoLiveRecordParams,
  GoLiveStep,
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

  async listGoLiveRecords(params: GoLiveRecordParams) {
    const response = await apiClient.get<ApiResponse<GoLiveRecordPage>>("/platform/go-live-records", { params });
    return response.data.data;
  },

  async createGoLiveRecord(payload: CreateGoLiveRecordPayload) {
    const response = await apiClient.post<ApiResponse<GoLiveRecord>>("/platform/go-live-records", payload);
    return response.data.data;
  },

  async updateGoLiveSteps(id: string, steps: GoLiveStep[], completed: boolean) {
    const response = await apiClient.patch<ApiResponse<GoLiveRecord>>(`/platform/go-live-records/${id}/steps`, { steps, completed });
    return response.data.data;
  },

  async decideGoLiveRecord(id: string, decision: "approve" | "reject", note?: string) {
    const response = await apiClient.post<ApiResponse<GoLiveRecord>>(`/platform/go-live-records/${id}/${decision}`, { note });
    return response.data.data;
  },
};
