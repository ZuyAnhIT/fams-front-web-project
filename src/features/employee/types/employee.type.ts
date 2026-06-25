export interface Employee {
  id: string;
  tenantId: string;
  userId?: string | null;
  employeeCode?: string | null;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  position?: string | null;
  department?: string | null;
  status: "active" | "inactive" | "terminated";
  hiredDate?: string | null;
  avatarUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

import { UserRoleResponse } from "../../role-permission/types";

export interface EmployeeDetailResponse extends Employee {
  roles: UserRoleResponse[];
}

export interface CreateEmployeePayload {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  employeeCode?: string;
  position?: string;
  department?: string;
  hiredDate?: string;
}

export interface UpdateEmployeePayload extends Partial<CreateEmployeePayload> { }

export interface ChangeEmployeeStatusPayload {
  status: "active" | "inactive" | "terminated";
}

export interface InviteEmployeePayload {
  email: string;
  roleId?: string;
}

export interface InvitationResponse {
  id: string;
  tenantId: string;
  email: string;
  token: string;
  status: "pending" | "accepted" | "cancelled" | "expired";
  expiresAt: string;
  createdAt: string;
}

export interface AcceptInvitationPayload {
  token: string;
  password?: string;
}
