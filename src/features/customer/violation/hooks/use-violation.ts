import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { violationService } from '../services/violation.service';
import type { MyExceptionItem, SubmitExplanationRequest, ViolationListParams } from '../types/violation.type';

export const violationKeys = {
  all: (tenantId: string) => ['violations', tenantId] as const,
  list: (tenantId: string, params: ViolationListParams) => ['violations', tenantId, 'list', params] as const,
  detail: (tenantId: string, violationId: string | null) => ['violations', tenantId, 'detail', violationId] as const,
  exceptions: (tenantId: string) => ['my-exceptions', tenantId] as const,
  photo: (tenantId: string, id: string | null) => ['violations', tenantId, 'photo', id] as const,
};

export function useViolations(tenantId: string, params: ViolationListParams, enabled = true) {
  return useQuery({ queryKey: violationKeys.list(tenantId, params), queryFn: () => violationService.list(tenantId, params), enabled: Boolean(tenantId) && enabled });
}

export function useViolationDetail(tenantId: string, violationId: string | null) {
  return useQuery({
    queryKey: violationKeys.detail(tenantId, violationId),
    queryFn: () => violationService.detail(tenantId, violationId!),
    enabled: Boolean(tenantId && violationId),
    retry: (failureCount, error) => {
      const status = (error as { response?: { status?: number } }).response?.status;
      return status !== 403 && status !== 404 && failureCount < 2;
    },
  });
}

function useRefreshRelations() {
  const queryClient = useQueryClient();
  return (tenantId: string) => Promise.all([
    queryClient.invalidateQueries({ queryKey: violationKeys.all(tenantId) }),
    queryClient.invalidateQueries({ queryKey: ['scheduled-checks'] }),
    queryClient.invalidateQueries({ queryKey: ['attendance', tenantId] }),
  ]);
}

export function useConfirmViolation() {
  const refresh = useRefreshRelations();
  return useMutation({
    mutationFn: ({ tenantId, violationId, note }: { tenantId: string; violationId: string; note?: string }) => violationService.confirm(tenantId, violationId, note),
    onSuccess: (_result, variables) => refresh(variables.tenantId),
  });
}

export function useDismissViolation() {
  const refresh = useRefreshRelations();
  return useMutation({
    mutationFn: ({ tenantId, violationId, reason }: { tenantId: string; violationId: string; reason: string }) => violationService.dismiss(tenantId, violationId, reason),
    onSuccess: (_result, variables) => refresh(variables.tenantId),
  });
}

export function useUpdateViolationAttendanceImpact() {
  const refresh = useRefreshRelations();
  return useMutation({
    mutationFn: ({ tenantId, violationId, affectsAttendance }: { tenantId: string; violationId: string; affectsAttendance: boolean }) => violationService.updateAttendanceImpact(tenantId, violationId, affectsAttendance),
    onSuccess: (_result, variables) => refresh(variables.tenantId),
  });
}

export function useMyExceptions(tenantId: string, size = 50) {
  return useQuery({
    queryKey: violationKeys.exceptions(tenantId),
    queryFn: () => violationService.myExceptions(tenantId, size),
    enabled: Boolean(tenantId),
    // 403/404 = the account has no employee profile in this company (#19) — a stable state,
    // not a transient failure, so don't burn retries on it.
    retry: (failureCount, error) => {
      const status = (error as { response?: { status?: number } }).response?.status;
      return status !== 403 && status !== 404 && failureCount < 2;
    },
  });
}

export function useExplainException() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ tenantId, item, payload }: { tenantId: string; item: MyExceptionItem; payload: SubmitExplanationRequest }) => violationService.explain(tenantId, item.explainEndpoint, payload),
    onSuccess: async (_result, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: violationKeys.exceptions(variables.tenantId) }),
        queryClient.invalidateQueries({ queryKey: ['checkins', variables.tenantId] }),
        queryClient.invalidateQueries({ queryKey: violationKeys.all(variables.tenantId) }),
      ]);
    },
  });
}

export function useViolationExplanationPhoto(
  tenantId: string,
  violationId: string | null,
  endpoint: string | null | undefined,
) {
  const managed = Boolean(endpoint?.startsWith(`/api/v1/tenants/${tenantId}/`));
  return useQuery({
    queryKey: violationKeys.photo(tenantId, violationId),
    queryFn: () => violationService.explanationPhoto(tenantId, endpoint!),
    enabled: Boolean(tenantId && violationId && managed),
    staleTime: 60_000,
    gcTime: 0,
    retry: false,
  });
}
