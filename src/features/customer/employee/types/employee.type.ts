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
  departmentId?: string;
  hiredDate?: string;
  avatarUrl?: string;
  status: string; // 'active' | 'inactive' | 'terminated'
  createdAt: string;
  updatedAt: string;
  /** Metadata authoritative from Backend; never infer masking from the string value. */
  piiMasked: boolean;
  faceId?: FaceIdStatus;
  /** Role hệ thống (TENANT_ADMIN/HR_MANAGER/SITE_SUPERVISOR/EMPLOYEE hoặc role tùy chỉnh) mà
   *  tài khoản của nhân viên này đang giữ trong tenant — rỗng nếu chưa liên kết tài khoản hoặc
   *  chưa được gán role nào. */
  roleNames?: string[];
}

export interface FaceIdStatus {
  status: "not_enrolled" | "enrolled" | "revoked";
  consentGiven: boolean;
  consentGivenAt?: string | null;
  enrolledAt?: string | null;
  revokedAt?: string | null;
  reviewStatus: "none" | "pending" | "rejected";
  pendingPhotoCount?: number | null;
  submittedAt?: string | null;
  reviewedAt?: string | null;
  rejectionReason?: string | null;
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

export interface EmployeeRoleAssignment {
  id: string;
  userId: string;
  roleId: string;
  tenantId: string;
  assignedAt?: string;
  roleName?: string;
  permissions?: string[];
  siteIds?: string[];
  sites?: Array<{ id: string; name: string }>;
}

export interface EmployeeDetailResponse extends EmployeeResponse {
  roles?: EmployeeRoleAssignment[];
  workspaces?: EmployeeWorkspaceMembership[];
  assignments?: EmployeeAssignment[];
}

export interface EmployeeWorkspaceMembership {
  id: string;
  workspaceId: string;
  workspaceName: string;
  role: string;
  assignedAt: string;
}

export interface EmployeeAssignment {
  id: string;
  tenantId: string;
  siteId: string;
  employeeId: string;
  shiftId?: string | null;
  startDate: string;
  endDate?: string | null;
  daysOfWeek?: string[] | null;
  role: string;
  status: "active" | "cancelled";
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEmployeePayload {
  email?: string;
  firstName: string;
  lastName: string;
  phone?: string;
  employeeCode?: string;
  position?: string;
  department?: string;
  departmentId?: string;
  hiredDate?: string;
}

export type UpdateEmployeePayload = Partial<CreateEmployeePayload>;

export interface ChangeEmployeeStatusPayload {
  status: "active" | "inactive" | "terminated";
}

export interface InviteEmployeePayload {
  email: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  roleId?: string;
}

export interface InvitationResponse {
  id: string;
  email: string;
  tenantId: string;
  status: string;
  /** Bearer credential: only present on the POST response, never on list/cancel. */
  token?: string | null;
  firstName?: string;
  lastName?: string;
  createdAt: string;
  expiresAt: string;
}

export interface ValidateInvitationResponse {
  email: string;
  phone?: string;
  isExistingUser?: boolean;
  existingUser?: boolean;
  isExistingPhoneUser?: boolean;
  tenantName?: string;
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
  displayName?: string;
  deviceId?: string;
  existingPhone?: string;
  existingPassword?: string;
}

export interface EmployeeImportError {
  row: number;
  field?: string | null;
  message: string;
}

export interface EmployeeImportResult {
  totalRows: number;
  successCount: number;
  failedCount: number;
  errors: EmployeeImportError[];
}

export type InvitationType = "tenant" | "platform";

export interface PlatformInvitationResponse {
  id: string;
  email: string;
  status: string;
  invitedBy: string;
  roleId: string;
  firstName?: string;
  lastName?: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  token?: string | null;
}

export interface PlatformInvitationListParams {
  email?: string;
  status?: string;
  page?: number;
  size?: number;
}

export interface SendPlatformInvitationPayload {
  email: string;
  firstName?: string;
  lastName?: string;
  roleId?: string;
}
