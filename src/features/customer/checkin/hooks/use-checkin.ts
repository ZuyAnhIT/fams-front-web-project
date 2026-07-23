import { useQuery } from "@tanstack/react-query";
import { checkinService } from "../services/checkin.service";
import type { CheckinListParams } from "../types/checkin.type";

export const checkinKeys = {
  all: (tenantId?: string) => ["checkins", tenantId] as const,
  list: (tenantId: string | undefined, params: CheckinListParams) =>
    [...checkinKeys.all(tenantId), "list", params] as const,
  detail: (tenantId: string | undefined, checkinId?: string | null) =>
    [...checkinKeys.all(tenantId), "detail", checkinId] as const,
};

export function useCheckins(
  tenantId: string | undefined,
  params: CheckinListParams
) {
  return useQuery({
    queryKey: checkinKeys.list(tenantId, params),
    queryFn: () => checkinService.listCheckins(tenantId!, params),
    enabled: Boolean(tenantId),
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
