export interface EmployeeResponse {
  id: string;
  userId?: string;
  tenantId: string;
  email?: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone?: string;
  employeeCode?: string;
  position?: string;
  department?: string;
  hiredDate?: string;
  avatarUrl?: string;
  status: string; // 'active' | 'inactive' | 'terminated'
  createdAt: string;
  updatedAt: string;
  faceId?: FaceIdStatus;
}

export interface FaceIdStatus {
  status: "not_enrolled" | "enrolled" | "revoked";
  consentGiven: boolean;
  consentGivenAt?: string;
  enrolledAt?: string;
  revokedAt?: string;
}

export interface EmployeeListParams {
  tenantId?: string;
  search?: string;
  status?: string; // 'active' | 'inactive' | 'terminated'
  department?: string;
  sortBy?: string;
  sortDir?: "asc" | "desc";
  page?: number;
  size?: number;
}

export type Employee = EmployeeResponse;

export interface EmployeeDetailResponse extends EmployeeResponse {
  // Add more detailed fields if necessary
}

export interface CreateEmployeePayload {
  email: string;
  firstName: string;
  lastName: string;
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
  firstName?: string;
  lastName?: string;
  roleId?: string;
}

export interface InvitationResponse {
  id: string;
  email: string;
  tenantId: string;
  status: string;
  token: string;
  firstName?: string;
  lastName?: string;
  createdAt: string;
  expiresAt: string;
}

export interface ValidateInvitationResponse {
  email: string;
  isExistingUser?: boolean;
  existingUser?: boolean;
  tenantName: string;
}

export interface InvitationListParams {
  tenantId?: string;
  email?: string;
  status?: string;
  page?: number;
  size?: number;
}

export interface AcceptInvitationPayload {
  token: string;
  password?: string;
}
