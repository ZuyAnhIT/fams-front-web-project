/**
 * Kiểu dữ liệu liên quan đến phần xác thực (Authentication).
 */
import type { UserRoleResponse } from "@/features/admin/role-permission/types";

/** Dữ liệu gửi lên khi đăng nhập bằng email hoặc số điện thoại + mật khẩu. */
export interface LoginPayload {
  identifier: string;
  password: string;
  deviceId?: string;
}

/** Dữ liệu gửi lên khi đăng ký tài khoản mới */
export interface RegisterPayload {
  email?: string;
  phone?: string;
  otpCode?: string;
  password: string;
  displayName: string;
  deviceId?: string;
}

export interface SendRegistrationOtpPayload {
  phone: string;
}

export interface ResendVerificationPayload {
  email: string;
}

/** Dữ liệu gửi lên để đăng nhập bằng số điện thoại — backend chỉ verify token Firebase đã có sẵn,
 *  không có bước "gửi OTP" ở phía backend (việc đó do Firebase Client SDK làm trực tiếp). */
export interface VerifyOtpPayload {
  firebaseIdToken: string;
  deviceId?: string;
}

export interface LogoutPayload {
  refreshToken: string;
}

export interface LoginResponse {
  userId?: string | null;
  activeTenantId?: string | null;
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  totpRequired?: boolean;
  pendingToken?: string;
}

/** Phản hồi từ API đăng ký */
export interface RegisterResponse {
  userId: string;
  emailVerificationRequired: boolean;
  phoneVerified: boolean;
  message: string;
}

/** Thông tin người dùng trả về từ API /me */
export interface UserProfile {
  id: string;
  email: string | null;
  emailVerified: boolean;
  phone: string | null;
  phoneVerified: boolean;
  displayName: string;
  avatarUrl: string | null;
  /** Issue #4 (docs/issues/ISSUES.md) */
  dateOfBirth?: string | null;
  hometown?: string | null;
  gender?: string | null;
  address?: string | null;
  /** Issue #7 (docs/issues/ISSUES.md): whether a Google account is linked for one-click login. */
  googleLinked?: boolean;
  active: boolean;
  /** Directory-only fields returned by GET /users. */
  platformAdmin?: boolean;
  lastLoginAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

/** 5 Role Hệ thống cố định từ Backend */
export enum SystemRole {
  PLATFORM_ADMIN = "PLATFORM_ADMIN",
  PLATFORM_STAFF = "PLATFORM_STAFF",
  TENANT_ADMIN = "TENANT_ADMIN",
  HR_MANAGER = "HR_MANAGER",
  SITE_SUPERVISOR = "SITE_SUPERVISOR",
  EMPLOYEE = "EMPLOYEE",
}

export interface AuthUser extends UserProfile {
  role?: SystemRole;
  tenantId?: string | null;
  permissions?: string[];
  /** Issue #3 (docs/issues/ISSUES.md): every tenant this user holds a role in, for the company switcher. */
  memberships?: UserRoleResponse[];
}

/** Dữ liệu gửi lên khi chuyển đổi công ty đang làm việc (Issue #3) */
export interface SwitchTenantPayload {
  tenantId: string;
  refreshToken: string;
}

/** Dữ liệu gửi lên khi yêu cầu khôi phục mật khẩu */
export interface ForgotPasswordPayload {
  email: string;
}

/** Dữ liệu gửi lên khi đặt lại mật khẩu mới */
export interface ResetPasswordPayload {
  token: string;
  newPassword: string;
}

/** Dữ liệu gửi lên khi đăng nhập bằng Google */
export interface GoogleLoginPayload {
  idToken: string;
  deviceId?: string;
}

/** Dữ liệu gửi lên khi cập nhật hồ sơ */
export interface UpdateProfilePayload {
  displayName?: string;
  /** Issue #4 (docs/issues/ISSUES.md) */
  dateOfBirth?: string;
  hometown?: string;
  gender?: string;
  address?: string;
}

/** Dữ liệu gửi lên khi đổi mật khẩu */
export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export interface RequestEmailChangePayload {
  email: string;
}

export interface RequestPhoneChangePayload {
  phone: string;
}

export interface ConfirmPhoneChangePayload extends RequestPhoneChangePayload {
  otpCode: string;
}

export interface AuthSession {
  id: string;
  deviceId: string;
  userAgent: string | null;
  ipAddress: string | null;
  createdAt: string;
  lastUsedAt: string;
  expiresAt: string;
  current: boolean;
}

/** Phản hồi từ API khởi tạo TOTP */
export interface TotpSetupResponse {
  setupToken: string;
  qrCodeUrl: string;
  manualEntryKey: string;
}

/** Dữ liệu gửi lên khi xác nhận TOTP để bật 2FA */
export interface TotpVerifyPayload {
  setupToken: string;
  code: string;
}

/** Backup codes are returned once, immediately after TOTP is enabled. */
export interface TotpEnableResponse {
  backupCodes: string[];
}

/** Backend requires exactly one re-authentication method before disabling 2FA. */
export type TotpDisablePayload =
  | { password: string; code?: never; backupCode?: never }
  | { password?: never; code: string; backupCode?: never }
  | { password?: never; code?: never; backupCode: string };


/** Dữ liệu gửi lên khi xác nhận TOTP ở màn hình Login */
export interface LoginTotpPayload {
  pendingToken: string;
  code?: string;
  backupCode?: string;
  deviceId?: string;
}
