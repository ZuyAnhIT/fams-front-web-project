import { useMutation, useQueryClient } from "@tanstack/react-query";
import { assignmentService } from "../services/assignment.service";
import {
  CreateAssignmentRequest,
  UpdateAssignmentRequest,
} from "../types/assignment.type";
import { assignmentKeys } from "./use-assignments";
import { siteKeys } from "../../site/hooks/use-site";

/** Hook tạo phân công mới */
export const useCreateAssignmentMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      tenantId,
      siteId,
      data,
    }: {
      tenantId: string;
      siteId: string;
      data: CreateAssignmentRequest;
    }) => assignmentService.createAssignment(tenantId, siteId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: assignmentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: siteKeys.detail(variables.siteId) });
    },
  });
};

/** Hook cập nhật phân công */
export const useUpdateAssignmentMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      tenantId,
      siteId,
      assignmentId,
      data,
    }: {
      tenantId: string;
      siteId: string;
      assignmentId: string;
      data: UpdateAssignmentRequest;
    }) => assignmentService.updateAssignment(tenantId, siteId, assignmentId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: assignmentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: siteKeys.detail(variables.siteId) });
    },
  });
};

/** Hook hủy phân công (soft delete) */
export const useCancelAssignmentMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      tenantId,
      siteId,
      assignmentId,
    }: {
      tenantId: string;
      siteId: string;
      assignmentId: string;
    }) => assignmentService.cancelAssignment(tenantId, siteId, assignmentId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: assignmentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: siteKeys.detail(variables.siteId) });
    },
  });
};
