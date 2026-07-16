import { apiClient } from "@/services/api-client";
import { type ApiResponse } from "@/types/api";
import type {
  FaceIdReportParams,
  FaceIdReportResponse,
} from "../types/face-id-report.type";
import { useAuthStore } from "@/stores/auth.store";

const getTenantId = () => {
  const state = useAuthStore.getState();
  if (state.user && state.user.tenantId) {
    return state.user.tenantId;
  }
  throw new Error("Tenant ID is required but not found in user state.");
};

export const faceIdReportService = {
  /**
   * Lấy báo cáo tổng hợp trạng thái đăng ký Face ID theo tenant.
   * Hỗ trợ lọc theo status (not_enrolled | pending | enrolled | revoked) + phân trang.
   * Yêu cầu permission: reports:list
   */
  async getEnrollmentReport(params: FaceIdReportParams): Promise<FaceIdReportResponse> {
    const tenantId = getTenantId();
    const response = await apiClient.get<ApiResponse<FaceIdReportResponse>>(
      `/tenants/${tenantId}/reports/face-id/enrollment`,
      { params }
    );
    return response.data.data;
  },
};