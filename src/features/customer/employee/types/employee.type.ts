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
  /** National ID (CCCD/CMND). Masked (e.g. "abcdef***") unless caller has employees:pii:read —
   *  same convention as email/phone, see piiMasked. */
  nationalId?: string;
  position?: string;
  department?: string;
  departmentId?: string;
  /** Intended role for this person once invited/linked to a login account (null/undefined if
   *  none set) — not a real role assignment, this profile has no account yet. */
  plannedRoleId?: string | null;
  plannedRoleName?: string | null;
  hiredDate?: string;
  avatarUrl?: string;
  status: string; // 'active' | 'inactive' | 'terminated'
  /** When this employee's status last became "terminated" (null if never terminated, or if
   *  reversed since). */
  terminatedAt?: string | null;
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
  /** Consent text version the employee agreed to — a policy bump invalidates older consents. */
  consentVersion?: string | null;
  enrolledAt?: string | null;
  revokedAt?: string | null;
  /** Why Face ID was revoked, null if not revoked or reason wasn't captured. */
  deletedReason?: string | null;
  /** Who revoked this Face ID — null if system-triggered (e.g. auto-revoke on termination). */
  deletedBy?: string | null;
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
  /** true = only employees with an enrolled Face ID; false = not enrolled/revoked. */
  faceRegistered?: boolean;
  /** Filter to employees with an active WorkspaceMember in this workspace. */
  workspaceId?: string;
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
  isPrimary: boolean;
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
  nationalId?: string;
  position?: string;
  department?: string;
  departmentId?: string;
  hiredDate?: string;
  /** Intended role once this person is invited/linked to a login account — no real role
   *  assignment happens yet (this profile has no account), but a later invite to the same email
   *  uses this instead of defaulting to EMPLOYEE. */
  plannedRoleId?: string;
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
  /** Default workspace the invitee is added to (as a WorkspaceMember) once they accept. */
  workspaceId?: string;
}

export interface CancelInvitationPayload {
  /** Optional free-text reason, shown later in the invitation list/audit trail. */
  reason?: string;
}

export interface InvitationResponse {
  id: string;
  email: string;
  phone?: string | null;
  tenantId: string;
  status: string;
  invitedBy?: string;
  roleId?: string | null;
  workspaceId?: string | null;
  /** Bearer credential: only present on the POST response, never on list/cancel. */
  token?: string | null;
  firstName?: string;
  lastName?: string;
  createdAt: string;
  updatedAt?: string;
  expiresAt: string;
  cancelledBy?: string | null;
  cancelReason?: string | null;
  cancelledAt?: string | null;
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
