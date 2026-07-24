import { apiClient } from "@/services/api-client";
import { type ApiResponse, type PageResponse } from "@/types/api";
import type {
  Tenant,
  TenantSettingsResponse,
  IpWhitelistResponse,
  CreateTenantPayload,
  UpdateTenantPayload,
  UpdateTenantSettingsPayload,
  CreateIpWhitelistPayload,
  UpdateIpWhitelistPayload,
  TenantListParams,
  TenantOperationalDetail,
} from "../types/tenant.type";
import { useAuthStore } from "@/stores/auth.store";

const getTenantId = () => {
  const state = useAuthStore.getState();
  if (state.user && state.user.tenantId) {
    return state.user.tenantId;
  }
  throw new Error("Tenant ID is required but not found in the authenticated user context.");
};

export const tenantService = {
  /**
   * Lấy danh sách Tenant (Platform Admin)
   */
  async listTenants(params: TenantListParams): Promise<PageResponse<Tenant>> {
    const response = await apiClient.get<ApiResponse<PageResponse<Tenant>>>("/tenants", {
      params,
    });
    return response.data.data;
  },

  /**
   * Tạo Tenant (Platform Admin)
   */
  async createTenant(payload: CreateTenantPayload): Promise<Tenant> {
    const response = await apiClient.post<ApiResponse<Tenant>>("/tenants", payload);
    return response.data.data;
  },

  async getTenantDetail(id: string): Promise<TenantOperationalDetail> {
    const response = await apiClient.get<ApiResponse<TenantOperationalDetail>>(`/tenants/${id}/detail`);
    return response.data.data;
  },

  /**
   * Cập nhật thông tin cơ bản Tenant
   */
  async updateTenant(payload: UpdateTenantPayload, id?: string): Promise<Tenant> {
    const tenantId = id || getTenantId();
    const response = await apiClient.patch<ApiResponse<Tenant>>(`/tenants/${tenantId}`, payload);
    return response.data.data;
  },

  /**
   * Lấy thiết lập giao diện (UI Settings)
   */
  async getSettings(id?: string): Promise<TenantSettingsResponse> {
    const tenantId = id || getTenantId();
    const response = await apiClient.get<ApiResponse<TenantSettingsResponse>>(`/tenants/${tenantId}/settings`);
    return response.data.data;
  },

  /**
   * Cập nhật thiết lập giao diện
   */
  async updateSettings(payload: UpdateTenantSettingsPayload, id?: string): Promise<TenantSettingsResponse> {
    const tenantId = id || getTenantId();
    const response = await apiClient.patch<ApiResponse<TenantSettingsResponse>>(`/tenants/${tenantId}/settings`, payload);
    return response.data.data;
  },

  /**
   * Lấy danh sách IP Whitelist
   */
  async listIpWhitelists(id?: string): Promise<PageResponse<IpWhitelistResponse>> {
    const tenantId = id || getTenantId();
    const response = await apiClient.get<ApiResponse<PageResponse<IpWhitelistResponse>>>(`/tenants/${tenantId}/ip-whitelists`);
    return response.data.data;
  },

  /**
   * Thêm IP Whitelist
   */
  async addIpWhitelist(payload: CreateIpWhitelistPayload, id?: string): Promise<IpWhitelistResponse> {
    const tenantId = id || getTenantId();
    const response = await apiClient.post<ApiResponse<IpWhitelistResponse>>(`/tenants/${tenantId}/ip-whitelists`, payload);
    return response.data.data;
  },

  /**
   * Cập nhật IP Whitelist (Toggle Active)
   */
  async updateIpWhitelist(entryId: string, payload: UpdateIpWhitelistPayload, id?: string): Promise<IpWhitelistResponse> {
    const tenantId = id || getTenantId();
    const response = await apiClient.patch<ApiResponse<IpWhitelistResponse>>(`/tenants/${tenantId}/ip-whitelists/${entryId}`, payload);
    return response.data.data;
  },

  /**
   * Xóa IP Whitelist
   */
  async deleteIpWhitelist(entryId: string, id?: string): Promise<void> {
    const tenantId = id || getTenantId();
    await apiClient.delete(`/tenants/${tenantId}/ip-whitelists/${entryId}`);
  },
  /**
   * Đình chỉ (Suspend) Tenant
   */
  async suspendTenant(id: string): Promise<Tenant> {
    const response = await apiClient.post<ApiResponse<Tenant>>(`/tenants/${id}/suspend`);
    return response.data.data;
  },

  /**
   * Kích hoạt lại (Reactivate) Tenant
   */
  async reactivateTenant(id: string): Promise<Tenant> {
    const response = await apiClient.post<ApiResponse<Tenant>>(`/tenants/${id}/reactivate`);
    return response.data.data;
  },

  /**
   * Hủy bỏ (Cancel) Tenant vĩnh viễn
   */
  async cancelTenant(id: string): Promise<Tenant> {
    const response = await apiClient.post<ApiResponse<Tenant>>(`/tenants/${id}/cancel`);
    return response.data.data;
  },
};
