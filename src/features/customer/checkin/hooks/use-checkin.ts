import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { checkinService } from "../services/checkin.service";
import type {
  CheckinListParams,
  OverrideCheckinRequest,
} from "../types/checkin.type";

export const checkinKeys = {
  all: (tenantId?: string) => ["checkins", tenantId] as const,
  list: (tenantId: string | undefined, params: CheckinListParams) =>
    [...checkinKeys.all(tenantId), "list", params] as const,
  detail: (tenantId: string | undefined, checkinId?: string | null) =>
    [...checkinKeys.all(tenantId), "detail", checkinId] as const,
  explanationPhoto: (tenantId: string | undefined, checkinId?: string | null) =>
    [...checkinKeys.all(tenantId), "explanation-photo", checkinId] as const,
};

export function useCheckins(
  tenantId: string | undefined,
  params: CheckinListParams,
  enabled = true,
) {
  return useQuery({
    queryKey: checkinKeys.list(tenantId, params),
    queryFn: () => checkinService.listCheckins(tenantId!, params),
    enabled: Boolean(tenantId) && enabled,
  });
}

export function useCheckinExplanationPhoto(
  tenantId: string | undefined,
  checkinId: string | null,
  enabled: boolean,
) {
  return useQuery({
    queryKey: checkinKeys.explanationPhoto(tenantId, checkinId),
    queryFn: () => checkinService.getExplanationPhoto(tenantId!, checkinId!),
    enabled: enabled && Boolean(tenantId && checkinId),
    staleTime: 60_000,
    gcTime: 0,
    retry: false,
  });
}

export function useCheckinDetail(
  tenantId: string | undefined,
  checkinId: string | null,
  enabled: boolean
) {
  return useQuery({
    queryKey: checkinKeys.detail(tenantId, checkinId),
    queryFn: () => checkinService.getCheckinDetail(tenantId!, checkinId!),
    enabled: enabled && Boolean(tenantId && checkinId),
  });
}

export function useOverrideCheckin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      tenantId,
      checkinId,
      payload,
    }: {
      tenantId: string;
      checkinId: string;
      payload: OverrideCheckinRequest;
    }) => checkinService.overrideCheckin(tenantId, checkinId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: checkinKeys.all(variables.tenantId),
      });
    },
  });
}
