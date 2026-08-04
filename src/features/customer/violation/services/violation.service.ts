import { apiClient } from '@/services/api-client';
import type { ApiResponse } from '@/types/api';
import type {
  ExplanationResponse,
  MyExceptionItem,
  SubmitExplanationRequest,
  ViolationActionResponse,
  ViolationDetail,
  ViolationListParams,
  ViolationPage,
} from '../types/violation.type';

function base(tenantId: string) {
  return `/tenants/${tenantId}/violations`;
}

function normalizeExplainEndpoint(endpoint: string, tenantId: string) {
  const expectedPrefix = `/api/v1/tenants/${tenantId}/`;
  if (!endpoint.startsWith(expectedPrefix)) throw new Error('Backend trả về endpoint giải trình không hợp lệ.');
  return endpoint.slice('/api/v1'.length);
}

export const violationService = {
  async list(tenantId: string, params: ViolationListParams) {
    const response = await apiClient.get<ApiResponse<ViolationPage>>(base(tenantId), { params });
    return response.data;
  },
  async detail(tenantId: string, violationId: string) {
    const response = await apiClient.get<ApiResponse<ViolationDetail>>(`${base(tenantId)}/${violationId}`);
    return response.data;
  },
  async confirm(tenantId: string, violationId: string, note?: string) {
    const response = await apiClient.post<ApiResponse<ViolationActionResponse>>(
      `${base(tenantId)}/${violationId}/confirm`,
      note?.trim() ? { note: note.trim() } : {},
    );
    return response.data;
  },
  async dismiss(tenantId: string, violationId: string, reason: string) {
    const response = await apiClient.post<ApiResponse<ViolationActionResponse>>(
      `${base(tenantId)}/${violationId}/dismiss`,
      { reason: reason.trim() },
    );
    return response.data;
  },
  async updateAttendanceImpact(tenantId: string, violationId: string, affectsAttendance: boolean) {
    const response = await apiClient.patch<ApiResponse<{ id: string; affectsAttendance: boolean }>>(
      `${base(tenantId)}/${violationId}/attendance-impact`,
      { affectsAttendance },
    );
    return response.data;
  },
  async myExceptions(tenantId: string, size = 50) {
    const response = await apiClient.get<ApiResponse<MyExceptionItem[]>>(
      `/tenants/${tenantId}/me/exceptions`,
      { params: { size } },
    );
    return response.data;
  },
  async explain(tenantId: string, explainEndpoint: string, payload: SubmitExplanationRequest) {
    const body = payload.photo ? (() => {
      const formData = new FormData();
      formData.append('note', payload.note);
      formData.append('photo', payload.photo!);
      return formData;
    })() : { note: payload.note };
    const response = await apiClient.post<ApiResponse<ExplanationResponse>>(
      normalizeExplainEndpoint(explainEndpoint, tenantId),
      body,
      payload.photo ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined,
    );
    return response.data;
  },
  async explanationPhoto(tenantId: string, endpoint: string) {
    const response = await apiClient.get<Blob>(normalizeExplainEndpoint(endpoint, tenantId), {
      responseType: 'blob',
    });
    return response.data;
  },
};
