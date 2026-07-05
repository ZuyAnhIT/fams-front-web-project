import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { workspaceService } from "../services/workspace.service";
import { CreateWorkspaceRequest, UpdateWorkspaceRequest } from "../types";
import { MOCK_WORKSPACES } from "../../../../mocks/workspaces.mock";

export const workspaceKeys = {
  all: ["workspaces"] as const,
  lists: () => [...workspaceKeys.all, "list"] as const,
  list: (params: any) => [...workspaceKeys.lists(), params] as const,
  trees: () => [...workspaceKeys.all, "tree"] as const,
  tree: (params: any) => [...workspaceKeys.trees(), params] as const,
  details: () => [...workspaceKeys.all, "detail"] as const,
  detail: (id: string) => [...workspaceKeys.details(), id] as const,
};

export const useWorkspacesQuery = (params: {
  tenantId: string | undefined;
  search?: string;
  status?: string;
  type?: string;
  sortBy?: string;
  sortDir?: "asc" | "desc";
  page?: number;
  size?: number;
}) => {
  return useQuery({
    queryKey: workspaceKeys.list(params),
    queryFn: () => workspaceService.getWorkspaces(params as any),
    enabled: !!params.tenantId,
  });
};

export const useWorkspaceTreeQuery = (params: {
  tenantId: string | undefined;
  search?: string;
  status?: string;
}) => {
  return useQuery({
    queryKey: workspaceKeys.tree(params),
    queryFn: async () => {
      try {
        const res = await workspaceService.getWorkspaceTree(params as any);
        if (!res.data || res.data.length === 0) {
          return { data: MOCK_WORKSPACES } as any;
        }
        return res;
      } catch (e) {
        return { data: MOCK_WORKSPACES } as any;
      }
    },
    enabled: !!params.tenantId,
  });
};

export const useWorkspaceByIdQuery = (tenantId: string | undefined, workspaceId: string | undefined) => {
  return useQuery({
    queryKey: workspaceKeys.detail(workspaceId!),
    queryFn: () => workspaceService.getWorkspaceById(tenantId!, workspaceId!),
    enabled: !!tenantId && !!workspaceId,
  });
};

export const useCreateWorkspaceMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ tenantId, data }: { tenantId: string; data: CreateWorkspaceRequest }) =>
      workspaceService.createWorkspace(tenantId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workspaceKeys.all });
    },
  });
};

export const useUpdateWorkspaceMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      tenantId,
      workspaceId,
      data,
    }: {
      tenantId: string;
      workspaceId: string;
    }) => workspaceService.updateWorkspace(params.tenantId, params.workspaceId, params.data || params),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: workspaceKeys.all });
      queryClient.invalidateQueries({ queryKey: workspaceKeys.detail(variables.workspaceId) });
    },
  });
};

export const useWorkspaceMembersQuery = (
  tenantId: string | undefined,
  workspaceId: string | undefined,
  page: number = 0,
  size: number = 20
) => {
  return useQuery({
    queryKey: [...workspaceKeys.detail(workspaceId!), "members", page, size],
    queryFn: () => workspaceService.getWorkspaceMembers(tenantId!, workspaceId!, page, size),
    enabled: !!tenantId && !!workspaceId,
  });
};

export const useAssignMemberMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      tenantId,
      workspaceId,
      data,
    }: {
      tenantId: string;
      workspaceId: string;
      data: any;
    }) => workspaceService.assignWorkspaceMember(tenantId, workspaceId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: workspaceKeys.detail(variables.workspaceId) });
    },
  });
};

export const useTransferMemberMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      tenantId,
      workspaceId,
      memberId,
      data,
    }: {
      tenantId: string;
      workspaceId: string;
      memberId: string;
      data: any;
    }) => workspaceService.transferWorkspaceMember(tenantId, workspaceId, memberId, data),
    onSuccess: (_, variables) => {
      // Invalidate source workspace to remove the member from list
      queryClient.invalidateQueries({ queryKey: workspaceKeys.detail(variables.workspaceId) });
      // Invalidate target workspace if it was previously fetched
      queryClient.invalidateQueries({ queryKey: workspaceKeys.detail(variables.data.targetWorkspaceId) });
    },
  });
};
