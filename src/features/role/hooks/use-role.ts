import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { roleService } from "../services/role.service";
import type { CreateRolePayload, UpdateRolePayload } from "../types/role.type";

export const useRoles = (params: any) => {
  return useQuery({
    queryKey: ["roles", params],
    queryFn: () => roleService.listRoles(params),
  });
};

export const useRoleDetail = (id: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ["roles", id],
    queryFn: () => roleService.getRole(id),
    enabled,
  });
};

export const useGroupedPermissions = () => {
  return useQuery({
    queryKey: ["permissions", "grouped"],
    queryFn: () => roleService.listGroupedPermissions(),
  });
};

export const useCreateRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateRolePayload) => roleService.createRole(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
    },
  });
};

export const useUpdateRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateRolePayload }) =>
      roleService.updateRole(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      queryClient.invalidateQueries({ queryKey: ["roles", variables.id] });
    },
  });
};

export const useDeleteRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => roleService.deleteRole(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
    },
  });
};
