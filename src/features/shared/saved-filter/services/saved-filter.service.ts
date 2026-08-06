import { apiClient } from '@/services/api-client';
import type { ApiResponse } from '@/types/api';
import type {
  CreateSavedFilterPayload,
  SavedFilter,
  UpdateSavedFilterPayload,
} from '../types/saved-filter.type';

function base(tenantId: string) {
  return `/tenants/${tenantId}/saved-filters`;
}

export const savedFilterService = {
  async list(tenantId: string, resourceType: string) {
    const response = await apiClient.get<ApiResponse<SavedFilter[]>>(base(tenantId), {
      params: { resourceType },
    });
    return response.data.data;
  },

  async create(tenantId: string, payload: CreateSavedFilterPayload) {
    const response = await apiClient.post<ApiResponse<SavedFilter>>(base(tenantId), payload);
    return response.data.data;
  },

  async update(tenantId: string, filterId: string, payload: UpdateSavedFilterPayload) {
    const response = await apiClient.patch<ApiResponse<SavedFilter>>(
      `${base(tenantId)}/${filterId}`,
      payload,
    );
    return response.data.data;
  },

  async remove(tenantId: string, filterId: string) {
    await apiClient.delete(`${base(tenantId)}/${filterId}`);
  },
};
