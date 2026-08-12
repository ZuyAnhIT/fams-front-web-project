import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { geofenceService } from "../services/geofence.service";
import { CreateGeofenceRequest, GeofenceHistoryParams, UpdateGeofenceRequest } from "../types/geofence.type";
import { siteKeys } from "../../site/hooks/use-site";

export const geofenceKeys = {
  all: ["geofences"] as const,
  lists: () => [...geofenceKeys.all, "list"] as const,
  list: (siteId: string, params: GeofenceHistoryParams) => [...geofenceKeys.lists(), siteId, params] as const,
  active: (siteId: string) => [...geofenceKeys.all, "active", siteId] as const,
};

export const useGeofenceHistoryQuery = (
  tenantId: string | undefined,
  siteId: string,
  params: GeofenceHistoryParams,
) => {
  return useQuery({
    queryKey: geofenceKeys.list(siteId, params),
    queryFn: () => geofenceService.listGeofenceHistory(tenantId!, siteId, params),
    enabled: !!tenantId && !!siteId,
  });
};

export const useActiveGeofenceQuery = (tenantId: string | undefined, siteId: string) => {
  return useQuery({
    queryKey: geofenceKeys.active(siteId),
    queryFn: () => geofenceService.getActiveGeofence(tenantId!, siteId),
    enabled: !!tenantId && !!siteId,
    retry: false,
  });
};

export const useCreateGeofenceMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ tenantId, siteId, data }: { tenantId: string; siteId: string; data: CreateGeofenceRequest }) => 
      geofenceService.createGeofence(tenantId, siteId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: geofenceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: geofenceKeys.active(variables.siteId) });
      queryClient.invalidateQueries({ queryKey: siteKeys.detail(variables.siteId) });
    },
  });
};

export const useUpdateGeofenceMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ tenantId, siteId, data }: { tenantId: string; siteId: string; data: UpdateGeofenceRequest }) => 
      geofenceService.updateGeofence(tenantId, siteId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: geofenceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: geofenceKeys.active(variables.siteId) });
      queryClient.invalidateQueries({ queryKey: siteKeys.detail(variables.siteId) });
    },
  });
};
