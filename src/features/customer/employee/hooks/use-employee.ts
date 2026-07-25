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
  InvitationType,
  PlatformInvitationListParams,
  SendPlatformInvitationPayload,
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

export const useAcceptInvitation = (type: InvitationType = "tenant") => {
  return useMutation({
    mutationFn: (payload: AcceptInvitationPayload) => employeeService.acceptInvitation(payload, type),
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

export const useValidateInvitation = (
  token: string | null,
  type: InvitationType = "tenant",
) => {
  return useQuery({
    queryKey: ["validate-invitation", type, token],
    queryFn: () => {
      if (!token) throw new Error("No token provided");
      return employeeService.validateInvitation(token, type);
    },
    enabled: !!token,
    retry: false,
  });
};

export const usePlatformInvitations = (params: PlatformInvitationListParams) =>
  useQuery({
    queryKey: ["platform-invitations", params],
    queryFn: () => employeeService.listPlatformInvitations(params),
  });

export const useSendPlatformInvitation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SendPlatformInvitationPayload) =>
      employeeService.sendPlatformInvitation(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["platform-invitations"] }),
  });
};

export const useCancelPlatformInvitation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => employeeService.cancelPlatformInvitation(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["platform-invitations"] }),
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
