import { useQuery } from "@tanstack/react-query";
import { assignmentService } from "../services/assignment.service";
import { AssignmentListParams } from "../types/assignment.type";

export const useAssignments = (
  tenantId: string,
  siteId: string,
  params: Omit<AssignmentListParams, "tenantId" | "siteId">
) => {
  return useQuery({
    queryKey: ["assignments", tenantId, siteId, params],
    queryFn: () => assignmentService.getAssignments(tenantId, siteId, params),
    enabled: !!tenantId && !!siteId,
  });
};
