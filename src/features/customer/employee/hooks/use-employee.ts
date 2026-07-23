import { useQuery, useMutation, useQueryClient, type UseQueryOptions } from "@tanstack/react-query";
import type { PageResponse } from "@/types/api";
import { employeeService } from "../services/employee.service";
import type {
  CreateEmployeePayload,
  UpdateEmployeePayload,
  ChangeEmployeeStatusPayload,
  InviteEmployeePayload,
  AcceptInvitationPayload,
  Employee,
  EmployeeListParams,
  InvitationListParams,
  InvitationResponse,
} from "../types/employee.type";

type EmployeeQueryOptions = Omit<
  UseQueryOptions<PageResponse<Employee>, Error>,
  "queryKey" | "queryFn"
>;

type InvitationQueryOptions = Omit<
  UseQueryOptions<PageResponse<InvitationResponse>, Error>,
  "queryKey" | "queryFn"
>;

export const useEmployees = (
  params: Omit<EmployeeListParams, "tenantId">,
  options?: EmployeeQueryOptions
) => {
  return useQuery({
    queryKey: ["employees", params],
    queryFn: () => employeeService.listEmployees(params),
    ...options,
  });
};

export const useInvitations = (
  params: Omit<InvitationListParams, "tenantId">,
  options?: InvitationQueryOptions
) => {
  return useQuery({
    queryKey: ["invitations", params],
    queryFn: () => employeeService.listInvitations(params),
    ...options,
  });
};

export const useExportEmployees = () => {
  return useMutation({
    mutationFn: (params: { search?: string; status?: string; department?: string }) =>
      employeeService.exportEmployees(params),
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
    mutationFn: ({ payload, tenantId }: { payload: InviteEmployeePayload; tenantId?: string }) => 
      employeeService.sendInvitation(payload, tenantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invitations"] });
    },
  });
};

export const useAcceptInvitation = () => {
  return useMutation({
    mutationFn: (payload: AcceptInvitationPayload) => employeeService.acceptInvitation(payload),
  });
};

export const useImportEmployees = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => employeeService.importEmployees(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
  });
};

export const useCancelInvitation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (invitationId: string) => employeeService.cancelInvitation(invitationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invitations"] });
    },
  });
};

export const useValidateInvitation = (token: string | null) => {
  return useQuery({
    queryKey: ["validate-invitation", token],
    queryFn: () => {
      if (!token) throw new Error("No token provided");
      return employeeService.validateInvitation(token);
    },
    enabled: !!token,
    retry: false,
  });
};

export const useRevokeFaceId = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (employeeId: string) => employeeService.revokeFaceId(employeeId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["employees", variables] });
    },
  });
};
