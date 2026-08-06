import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { savedFilterService } from '../services/saved-filter.service';
import type { CreateSavedFilterPayload, UpdateSavedFilterPayload } from '../types/saved-filter.type';

export const savedFilterKeys = {
  list: (tenantId: string, resourceType: string) => ['saved-filters', tenantId, resourceType] as const,
};

export function useSavedFilters(tenantId: string, resourceType: string) {
  return useQuery({
    queryKey: savedFilterKeys.list(tenantId, resourceType),
    queryFn: () => savedFilterService.list(tenantId, resourceType),
    enabled: Boolean(tenantId && resourceType),
  });
}

export function useCreateSavedFilter(tenantId: string, resourceType: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateSavedFilterPayload) => savedFilterService.create(tenantId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: savedFilterKeys.list(tenantId, resourceType) }),
  });
}

export function useUpdateSavedFilter(tenantId: string, resourceType: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ filterId, payload }: { filterId: string; payload: UpdateSavedFilterPayload }) =>
      savedFilterService.update(tenantId, filterId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: savedFilterKeys.list(tenantId, resourceType) }),
  });
}

export function useDeleteSavedFilter(tenantId: string, resourceType: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (filterId: string) => savedFilterService.remove(tenantId, filterId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: savedFilterKeys.list(tenantId, resourceType) }),
  });
}
