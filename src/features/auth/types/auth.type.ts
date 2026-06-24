/**
 * Kiểu dữ liệu liên quan đến phần xác thực (Authentication).
 */

/** Dữ liệu gửi lên khi đăng nhập bằng email/password */
export interface LoginPayload {
  email: string;
  password: string;
  deviceId?: string;
  rememberMe?: boolean;
}

/** Dữ liệu gửi lên khi đăng ký tài khoản mới */
export interface RegisterPayload {
  email?: string;
  phone?: string;
  password: string;
  displayName: string;
  deviceId?: string;
}

/** Dữ liệu gửi lên khi gửi mã OTP */
export interface SendOtpPayload {
  phone: string;
}

/** Dữ liệu gửi lên khi xác nhận mã OTP */
export interface VerifyOtpPayload {
  phone: string;
  code: string;
  deviceId?: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: AuthUser;
  totpRequired?: boolean;
  pendingToken?: string;
}

/** Phản hồi từ API đăng ký */
export interface RegisterResponse {
  emailVerificationRequired: boolean;
  message: string;
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
  user?: AuthUser;
}

/** Thông tin người dùng trả về từ API /me */
export interface UserProfile {
  id: string;
  email: string | null;
  phone: string | null;
  displayName: string;
  avatarUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** 5 Role Hệ thống cố định từ Backend */
export enum SystemRole {
  PLATFORM_ADMIN = "PLATFORM_ADMIN",
  TENANT_ADMIN = "TENANT_ADMIN",
  HR_MANAGER = "HR_MANAGER",
  SITE_SUPERVISOR = "SITE_SUPERVISOR",
  EMPLOYEE = "EMPLOYEE",
}

export interface AuthUser extends UserProfile {
  role?: SystemRole;
  tenantId?: string | null;
}

/** Dữ liệu gửi lên khi yêu cầu khôi phục mật khẩu */
export interface ForgotPasswordPayload {
  email: string;
}

/** Dữ liệu gửi lên khi đặt lại mật khẩu mới */
export interface ResetPasswordPayload {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

/** Dữ liệu gửi lên khi đăng nhập bằng Google */
export interface GoogleLoginPayload {
  idToken: string;
  deviceId?: string;
}

/** Dữ liệu gửi lên khi cập nhật hồ sơ */
export interface UpdateProfilePayload {
  displayName?: string;
  phone?: string;
  avatarUrl?: string;
}

/** Dữ liệu gửi lên khi đổi mật khẩu */
export interface ChangePasswordPayload {
  currentPassword?: string; // Tùy chọn vì nếu login qua Google thì chưa chắc có password (tùy logic backend)
  newPassword: string;
  confirmPassword: string;
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


/** Dữ liệu gửi lên khi xác nhận TOTP ở màn hình Login */
export interface LoginTotpPayload {
  pendingToken: string;
  code: string;
  deviceId?: string;
}

/** Dữ liệu tài khoản lưu trữ tạm thời trong LocalStorage (Mock Mode) */
export interface StoredUser {
  id?: string;
  fullName: string;
  emailOrPhone: string;
  password?: string;
  role?: SystemRole;
}
