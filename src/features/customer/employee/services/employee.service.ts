import axios from "axios";
import { apiClient } from "@/services/api-client";
import { type ApiResponse, type PageResponse } from "@/types/api";
import type {
  Employee,
  EmployeeDetailResponse,
  CreateEmployeePayload,
  UpdateEmployeePayload,
  ChangeEmployeeStatusPayload,
  InviteEmployeePayload,
  InvitationResponse,
  AcceptInvitationPayload,
  InvitationListParams,
} from "../types/employee.type";

import { useAuthStore } from "@/stores/auth.store";

// Fallback tenant ID cho quá trình dev 
const FALLBACK_TENANT_ID = "89239420-a819-4dc5-9ac4-10cefadd6e06";

const getTenantId = () => {
  const state = useAuthStore.getState();
  if (state.user && state.user.tenantId) {
    return state.user.tenantId;
  }
  return FALLBACK_TENANT_ID;
};

export const employeeService = {
  /**
   * Lấy danh sách nhân viên có phân trang và filter
   */
  async listEmployees(params: {
    page?: number;
    size?: number;
    search?: string;
    sortBy?: string;
    sortDir?: "asc" | "desc";
    status?: string;
    department?: string;
  }): Promise<PageResponse<Employee>> {
    const tenantId = getTenantId();
    try {
      const response = await apiClient.get<ApiResponse<PageResponse<Employee>>>(
        `/tenants/${tenantId}/employees`,
        { params }
      );
      return response.data.data;
    } catch (error) {
      console.warn("Using mock data for listEmployees due to API error", error);
      // MOCK DATA FALLBACK
      return {
        content: [
          {
            id: "emp-mock-1",
            tenantId,
            firstName: "Nguyễn",
            lastName: "Văn A",
            fullName: "Nguyễn Văn A",
            email: "nva@example.com",
            employeeCode: "NV001",
            position: "Nhân viên",
            status: "active",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: "emp-mock-2",
            tenantId,
            firstName: "Trần",
            lastName: "Thị B",
            fullName: "Trần Thị B",
            email: "ttb@example.com",
            employeeCode: "NV002",
            position: "Trưởng nhóm",
            status: "active",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
        ],
        // pageNumber: 0,
        // pageSize: 20,
        totalElements: 2,
        totalPages: 1,
        last: true, page: 0, size: 10, first: true,
      };
    }
  },

  /**
   * Xuất danh sách nhân viên ra file Excel
   */
  async exportEmployees(params: {
    search?: string;
    status?: string;
    department?: string;
  }): Promise<Blob> {
    const tenantId = getTenantId();
    const response = await apiClient.get(
      `/tenants/${tenantId}/employees/export`,
      {
        params,
        responseType: 'blob'
      }
    );
    return response.data;
  },

  /**
   * Lấy chi tiết nhân viên
   */
  async getEmployee(id: string): Promise<EmployeeDetailResponse> {
    const tenantId = getTenantId();
    const response = await apiClient.get<ApiResponse<EmployeeDetailResponse>>(
      `/tenants/${tenantId}/employees/${id}`
    );
    return response.data.data;
  },

  /**
   * Tạo nhân viên mới thủ công
   */
  async createEmployee(payload: CreateEmployeePayload): Promise<Employee> {
    const tenantId = getTenantId();
    const response = await apiClient.post<ApiResponse<Employee>>(
      `/tenants/${tenantId}/employees`,
      payload
    );
    return response.data.data;
  },

  /**
   * Cập nhật nhân viên
   */
  async updateEmployee(id: string, payload: UpdateEmployeePayload): Promise<Employee> {
    const tenantId = getTenantId();
    const response = await apiClient.patch<ApiResponse<Employee>>(
      `/tenants/${tenantId}/employees/${id}`,
      payload
    );
    return response.data.data;
  },

  /**
   * Cập nhật trạng thái nhân viên
   */
  async changeStatus(id: string, payload: ChangeEmployeeStatusPayload): Promise<Employee> {
    const tenantId = getTenantId();
    const response = await apiClient.patch<ApiResponse<Employee>>(
      `/tenants/${tenantId}/employees/${id}/status`,
      payload
    );
    return response.data.data;
  },

  /**
   * Lấy danh sách lời mời có phân trang và filter
   */
  async listInvitations(params: InvitationListParams): Promise<PageResponse<InvitationResponse>> {
    const tenantId = getTenantId();
    const response = await apiClient.get<ApiResponse<PageResponse<InvitationResponse>>>(
      `/tenants/${tenantId}/invitations`,
      { params }
    );
    return response.data.data;
  },

  /**
   * Gửi email mời nhân viên
   */
  async sendInvitation(payload: InviteEmployeePayload, explicitTenantId?: string): Promise<InvitationResponse> {
    const tenantId = explicitTenantId || getTenantId();
    const response = await apiClient.post<ApiResponse<InvitationResponse>>(
      `/tenants/${tenantId}/invitations`,
      payload
    );
    return response.data.data;
  },

  /**
   * Chấp nhận lời mời (Public API)
   */
  async acceptInvitation(payload: AcceptInvitationPayload) {
    const response = await apiClient.post<ApiResponse<any>>(`/invitations/accept`, payload);
    return response.data.data;
  },

  /**
   * Import danh sách nhân viên từ file Excel
   */
  async importEmployees(file: File) {
    const tenantId = getTenantId();
    const formData = new FormData();
    formData.append("file", file);

    const response = await apiClient.post<ApiResponse<any>>(
      `/tenants/${tenantId}/employees/import`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data.data;
  },

  /**
   * Hủy lời mời
   */
  async cancelInvitation(invitationId: string): Promise<InvitationResponse> {
    const tenantId = getTenantId();
    const response = await apiClient.delete<ApiResponse<InvitationResponse>>(
      `/tenants/${tenantId}/invitations/${invitationId}`
    );
    return response.data.data;
  },
};
