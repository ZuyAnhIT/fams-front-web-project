import { useQuery } from "@tanstack/react-query";
import { assignmentService } from "../services/assignment.service";
import { AssignmentListParams } from "../types/assignment.type";

export const assignmentKeys = {
  all: ["assignments"] as const,
  lists: () => [...assignmentKeys.all, "list"] as const,
  list: (
    siteId: string,
    params: Omit<AssignmentListParams, "tenantId" | "siteId">,
  ) => [...assignmentKeys.lists(), siteId, params] as const,
};

export const useAssignments = (
  tenantId: string,
  siteId: string,
  params: Omit<AssignmentListParams, "tenantId" | "siteId">
) => {
  return useQuery({
    queryKey: assignmentKeys.list(siteId, params),
    queryFn: () => assignmentService.getAssignments(tenantId, siteId, params),
    enabled: !!tenantId && !!siteId,
  });
};
