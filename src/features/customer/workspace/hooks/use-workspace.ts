import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { workspaceService } from "../services/workspace.service";
import {
  AssignWorkspaceMemberRequest,
  CreateWorkspaceRequest,
  TransferWorkspaceMemberRequest,
  UpdateWorkspaceRequest,
  WorkspaceListParams,
  WorkspaceTreeParams,
} from "../types";

type OptionalTenant<T extends { tenantId: string }> = Omit<T, "tenantId"> & {
  tenantId: string | undefined;
};

export const workspaceKeys = {
  all: ["workspaces"] as const,
  lists: () => [...workspaceKeys.all, "list"] as const,
  list: (params: OptionalTenant<WorkspaceListParams>) => [...workspaceKeys.lists(), params] as const,
  trees: () => [...workspaceKeys.all, "tree"] as const,
  tree: (params: OptionalTenant<WorkspaceTreeParams>) => [...workspaceKeys.trees(), params] as const,
  details: () => [...workspaceKeys.all, "detail"] as const,
  detail: (id: string) => [...workspaceKeys.details(), id] as const,
};

export const useWorkspacesQuery = (params: OptionalTenant<WorkspaceListParams>) => {
  return useQuery({
    queryKey: workspaceKeys.list(params),
    queryFn: () => workspaceService.getWorkspaces({ ...params, tenantId: params.tenantId! }),
    enabled: !!params.tenantId,
  });
};

export const useWorkspaceTreeQuery = (params: OptionalTenant<WorkspaceTreeParams>) => {
  return useQuery({
    queryKey: workspaceKeys.tree(params),
    queryFn: () => workspaceService.getWorkspaceTree({ ...params, tenantId: params.tenantId! }),
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
      data: UpdateWorkspaceRequest;
    }) => workspaceService.updateWorkspace(tenantId, workspaceId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: workspaceKeys.all });
      queryClient.invalidateQueries({ queryKey: workspaceKeys.detail(variables.workspaceId) });
    },
  });
};

export const useDeleteWorkspaceMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ tenantId, workspaceId }: { tenantId: string; workspaceId: string }) =>
      workspaceService.deleteWorkspace(tenantId, workspaceId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: workspaceKeys.all }),
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
      data: AssignWorkspaceMemberRequest;
    }) => workspaceService.assignWorkspaceMember(tenantId, workspaceId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workspaceKeys.all });
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
      data: TransferWorkspaceMemberRequest;
    }) => workspaceService.transferWorkspaceMember(tenantId, workspaceId, memberId, data),
    onSuccess: () => {
      // Invalidate source workspace to remove the member from list
      queryClient.invalidateQueries({ queryKey: workspaceKeys.all });
    },
  });
};

export const useRemoveMemberMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      tenantId,
      workspaceId,
      memberId,
    }: {
      tenantId: string;
      workspaceId: string;
      memberId: string;
    }) => workspaceService.removeWorkspaceMember(tenantId, workspaceId, memberId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: workspaceKeys.all }),
  });
};
