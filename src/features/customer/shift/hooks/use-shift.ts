import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { shiftService } from "../services/shift.service";
import {
  CreateShiftRequest,
  UpdateShiftRequest,
  ConfigureShiftOtRequest,
  ShiftListParams,
} from "../types/shift.type";
import { siteKeys } from "../../site/hooks/use-site";

export const shiftKeys = {
  all: ["shifts"] as const,
  lists: () => [...shiftKeys.all, "list"] as const,
  list: (siteId: string, params: ShiftListParams) =>
    [...shiftKeys.lists(), siteId, params] as const,
};

export const useShiftsQuery = (
  tenantId: string | undefined,
  siteId: string,
  params: ShiftListParams,
) => {
  return useQuery({
    queryKey: shiftKeys.list(siteId, params),
    queryFn: () => shiftService.listShifts(tenantId!, siteId, params),
    enabled: !!tenantId && !!siteId,
  });
};

export const useCreateShiftMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      tenantId,
      siteId,
      data,
    }: {
      tenantId: string;
      siteId: string;
      data: CreateShiftRequest;
    }) => shiftService.createShift(tenantId, siteId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: shiftKeys.lists() });
      queryClient.invalidateQueries({ queryKey: siteKeys.detail(variables.siteId) });
    },
  });
};

export const useUpdateShiftMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      tenantId,
      siteId,
      shiftId,
      data,
    }: {
      tenantId: string;
      siteId: string;
      shiftId: string;
      data: UpdateShiftRequest;
    }) => shiftService.updateShift(tenantId, siteId, shiftId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: shiftKeys.lists() });
      queryClient.invalidateQueries({ queryKey: siteKeys.detail(variables.siteId) });
    },
  });
};

export const useConfigureOtMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      tenantId,
      siteId,
      shiftId,
      data,
    }: {
      tenantId: string;
      siteId: string;
      shiftId: string;
      data: ConfigureShiftOtRequest;
    }) => shiftService.configureOt(tenantId, siteId, shiftId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: shiftKeys.lists() });
      queryClient.invalidateQueries({ queryKey: siteKeys.detail(variables.siteId) });
    },
  });
};

export const useDeleteShiftMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      tenantId,
      siteId,
      shiftId,
    }: {
      tenantId: string;
      siteId: string;
      shiftId: string;
    }) => shiftService.deleteShift(tenantId, siteId, shiftId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: shiftKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: siteKeys.detail(variables.siteId),
      });
    },
  });
};
