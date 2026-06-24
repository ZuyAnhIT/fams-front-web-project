import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { employeeService } from "../services/employee.service";
import type {
  CreateEmployeePayload,
  UpdateEmployeePayload,
  ChangeEmployeeStatusPayload,
  InviteEmployeePayload,
  AcceptInvitationPayload,
} from "../types/employee.type";

export const useEmployees = (params: any) => {
  return useQuery({
    queryKey: ["employees", params],
    queryFn: () => employeeService.listEmployees(params),
  });
};

export const useEmployeeDetail = (id: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ["employees", id],
    queryFn: () => employeeService.getEmployee(id),
    enabled,
  });
};

export const useCreateEmployee = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateEmployeePayload) => employeeService.createEmployee(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
  });
};

export const useUpdateEmployee = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateEmployeePayload }) =>
      employeeService.updateEmployee(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["employees", variables.id] });
    },
  });
};

export const useChangeEmployeeStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ChangeEmployeeStatusPayload }) =>
      employeeService.changeStatus(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["employees", variables.id] });
    },
  });
};

export const useSendInvitation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: InviteEmployeePayload) => employeeService.sendInvitation(payload),
    onSuccess: () => {
      // Có thể invalidate list lời mời nếu sau này có API list invitations
    },
  });
};

export const useAcceptInvitation = () => {
  return useMutation({
    mutationFn: (payload: AcceptInvitationPayload) => employeeService.acceptInvitation(payload),
  });
};
