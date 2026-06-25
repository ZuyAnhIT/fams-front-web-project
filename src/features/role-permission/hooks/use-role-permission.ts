import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { rolePermissionService } from "../services/role-permission.service";
import { AssignRoleRequest, CreateRoleRequest, UpdateRoleRequest } from "../types";

export const rolePermissionKeys = {
  all: ["roles"] as const,
  lists: () => [...rolePermissionKeys.all, "list"] as const,
  list: (filters: string) => [...rolePermissionKeys.lists(), { filters }] as const,
  permissions: () => ["permissions"] as const,
};

export const useRolesQuery = (params: {
  tenantId?: string;
  search?: string;
  isSystem?: boolean;
  sortBy?: string;
  sortDir?: "asc" | "desc";
  page?: number;
  size?: number;
}) => {
  return useQuery({
    queryKey: rolePermissionKeys.list(JSON.stringify(params)),
    queryFn: () => rolePermissionService.getRoles(params),
  });
};

export const usePermissionsGroupedQuery = () => {
  return useQuery({
    queryKey: rolePermissionKeys.permissions(),
    queryFn: () => rolePermissionService.getPermissionsGrouped(),
  });
};

export const useCreateRoleMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateRoleRequest) => rolePermissionService.createRole(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rolePermissionKeys.lists() });
    },
  });
};

export const useUpdateRoleMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRoleRequest }) =>
      rolePermissionService.updateRole(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rolePermissionKeys.lists() });
    },
  });
};

export const useDeleteRoleMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => rolePermissionService.deleteRole(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rolePermissionKeys.lists() });
    },
  });
};

export const useAssignRoleMutation = () => {
  return useMutation({
    mutationFn: (data: AssignRoleRequest) => rolePermissionService.assignRole(data),
  });
};

export const useRevokeRoleMutation = () => {
  return useMutation({
    mutationFn: (id: string) => rolePermissionService.revokeRole(id),
  });
};
