import { apiClient } from "@/services/api-client";
import { type ApiResponse } from "@/types/api";
import type {
  FaceIdReportParams,
  FaceIdReportResponse,
  FaceIdReviewItem,
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

  /** #127 (2026-08-18): export not-yet-enrolled employees to Excel. */
  async exportNotEnrolled(params: { departmentId?: string; siteId?: string }): Promise<Blob> {
    const tenantId = getTenantId();
    const response = await apiClient.get<Blob>(
      `/tenants/${tenantId}/reports/face-id/enrollment/export`,
      { params, responseType: "blob" },
    );
    return response.data;
  },

  async getPendingReviews(): Promise<FaceIdReviewItem[]> {
    const tenantId = getTenantId();
    const response = await apiClient.get<ApiResponse<FaceIdReviewItem[]>>(
      `/tenants/${tenantId}/face-id/pending-review`,
    );
    return response.data.data;
  },

  async getPendingReviewPhoto(employeeId: string): Promise<Blob> {
    const tenantId = getTenantId();
    const response = await apiClient.get<Blob>(
      `/tenants/${tenantId}/employees/${employeeId}/face-id/pending-review/photo`,
      { responseType: "blob" },
    );
    return response.data;
  },

  async approveEnrollment(employeeId: string): Promise<FaceIdReviewItem> {
    const tenantId = getTenantId();
    const response = await apiClient.post<ApiResponse<FaceIdReviewItem>>(
      `/tenants/${tenantId}/employees/${employeeId}/face-id/approve`,
    );
    return response.data.data;
  },

  async rejectEnrollment(
    employeeId: string,
    reason: string,
  ): Promise<FaceIdReviewItem> {
    const tenantId = getTenantId();
    const response = await apiClient.post<ApiResponse<FaceIdReviewItem>>(
      `/tenants/${tenantId}/employees/${employeeId}/face-id/reject`,
      { reason },
    );
    return response.data.data;
  },
};
