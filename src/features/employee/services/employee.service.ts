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
} from "../types/employee.type";

// Fallback tenant ID cho quá trình dev (từ seed data)
const FALLBACK_TENANT_ID = "00000000-0000-0000-0000-000000000001";

const getTenantId = () => {
  // TODO: Lấy tenantId thực tế từ AuthStore khi hoàn thiện Multi-tenant
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
    const response = await apiClient.get<ApiResponse<PageResponse<Employee>>>(
      `/tenants/${tenantId}/employees`,
      { params }
    );
    return response.data.data;
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
   * Gửi email mời nhân viên
   */
  async sendInvitation(payload: InviteEmployeePayload): Promise<InvitationResponse> {
    const tenantId = getTenantId();
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
};
