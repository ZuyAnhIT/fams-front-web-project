import { apiClient } from "@/services/api-client";
import {
  type LoginPayload,
  type LoginResponse,
  type RegisterPayload,
  type RegisterResponse,
  type SendRegistrationOtpPayload,
  type ResendVerificationPayload,
  type VerifyOtpPayload,
  type ForgotPasswordPayload,
  type ResetPasswordPayload,
  type GoogleLoginPayload,
  type UserProfile,
  type UpdateProfilePayload,
  type ChangePasswordPayload,
  type TotpSetupResponse,
  type TotpVerifyPayload,
  type TotpEnableResponse,
  type TotpDisablePayload,
  type LoginTotpPayload,
  type LogoutPayload,
  type SwitchTenantPayload,
  type RequestEmailChangePayload,
  type RequestPhoneChangePayload,
  type ConfirmPhoneChangePayload,
  type AuthSession,
} from "../types/auth.type";
import { type ApiResponse } from "@/types/api";

export const authService = {
  /**
   * Đăng ký tài khoản mới (Hỗ trợ cả Email và Phone)
   */
  async register(payload: RegisterPayload): Promise<RegisterResponse> {
    const response = await apiClient.post<ApiResponse<RegisterResponse>>("/auth/register", payload);
    return response.data.data;
  },

  /** Gửi OTP đăng ký do backend quản lý (không phải Firebase Phone Auth). */
  async sendRegistrationOtp(payload: SendRegistrationOtpPayload): Promise<void> {
    await apiClient.post("/auth/register/send-otp", payload);
  },

  /** Gửi lại email xác minh với response trung tính để chống dò tài khoản. */
  async resendVerification(payload: ResendVerificationPayload): Promise<void> {
    await apiClient.post("/auth/resend-verification", payload);
  },

  /**
   * Đăng nhập bằng email hoặc số điện thoại + mật khẩu.
   */
  async login(payload: LoginPayload): Promise<LoginResponse> {
    const response = await apiClient.post<ApiResponse<LoginResponse>>("/auth/login", payload);
    return response.data.data;
  },

  /**
   * Đăng nhập bước 2 bằng mã TOTP
   */
  async loginTotp(payload: LoginTotpPayload): Promise<LoginResponse> {
    const response = await apiClient.post<ApiResponse<LoginResponse>>("/auth/login/totp", payload);
    return response.data.data;
  },

  /**
   * Đăng nhập bằng số điện thoại — payload là Firebase ID token đã xác thực
   * OTP thành công phía client (xem useFirebasePhoneAuth), backend chỉ verify
   * token này, không tự gửi/kiểm tra mã OTP.
   */
  async verifyOtp(payload: VerifyOtpPayload): Promise<LoginResponse> {
    const response = await apiClient.post<ApiResponse<LoginResponse>>("/auth/otp/verify", payload);
    return response.data.data;
  },

  /**
   * Yêu cầu gửi link quên mật khẩu qua email
   */
  async forgotPassword(payload: ForgotPasswordPayload): Promise<void> {
    await apiClient.post("/auth/forgot-password", payload);
  },

  /**
   * Đặt lại mật khẩu mới
   */
  async resetPassword(payload: ResetPasswordPayload): Promise<void> {
    await apiClient.post("/auth/reset-password", payload);
  },

  /**
   * Đăng nhập bằng Google
   */
  async loginWithGoogle(payload: GoogleLoginPayload): Promise<LoginResponse> {
    const response = await apiClient.post<ApiResponse<LoginResponse>>("/auth/login/google", payload);
    return response.data.data;
  },

  /**
   * Lấy thông tin cá nhân của người dùng đang đăng nhập
   */
  async getProfile(): Promise<UserProfile> {
    const response = await apiClient.get<ApiResponse<UserProfile>>("/auth/me");
    return response.data.data;
  },

  async logout(payload: LogoutPayload): Promise<void> {
    await apiClient.post("/auth/logout", payload);
  },

  /**
   * Đăng xuất khỏi mọi thiết bị
   */
  async logoutAll(): Promise<void> {
    await apiClient.post("/auth/logout/all");
  },

  /**
   * Cập nhật thông tin cá nhân
   */
  async updateProfile(payload: UpdateProfilePayload): Promise<UserProfile> {
    const response = await apiClient.patch<ApiResponse<UserProfile>>("/auth/me", payload);
    return response.data.data;
  },

  /**
   * Đổi mật khẩu
   */
  async changePassword(payload: ChangePasswordPayload): Promise<void> {
    await apiClient.post("/auth/change-password", payload);
  },

  /**
   * Khởi tạo thiết lập TOTP
   */
  async setupTotp(): Promise<TotpSetupResponse> {
    const response = await apiClient.post<ApiResponse<TotpSetupResponse>>("/auth/totp/setup");
    return response.data.data;
  },

  /**
   * Xác nhận bật TOTP
   */
  async verifyTotp(payload: TotpVerifyPayload): Promise<TotpEnableResponse> {
    const response = await apiClient.post<ApiResponse<TotpEnableResponse>>("/auth/totp/verify", payload);
    return response.data.data;
  },

  /**
   * Tắt TOTP
   */
  async disableTotp(payload: TotpDisablePayload): Promise<void> {
    await apiClient.post("/auth/totp/disable", payload);
  },

  /**
   * Đăng nhập bước 2 bằng mã TOTP
   */
  async loginWithTotp(payload: LoginTotpPayload): Promise<LoginResponse> {
    const response = await apiClient.post<ApiResponse<LoginResponse>>("/auth/login/totp", payload);
    return response.data.data;
  },

  /**
   * Chuyển đổi công ty đang làm việc (Issue #3) — dành cho người dùng thuộc nhiều công ty.
   */
  async switchTenant(payload: SwitchTenantPayload): Promise<LoginResponse> {
    const response = await apiClient.post<ApiResponse<LoginResponse>>("/auth/switch-tenant", payload);
    return response.data.data;
  },

  /**
   * Tải ảnh đại diện thật từ thiết bị (Issue #4, docs/issues/ISSUES.md) — thay cho việc chỉ
   * dán URL ảnh có sẵn. Backend lưu vào S3-compatible storage (MinIO ở dev, S3 thật ở production).
   */
  async uploadAvatar(file: File): Promise<UserProfile> {
    const formData = new FormData();
    formData.append("file", file);
    const response = await apiClient.post<ApiResponse<UserProfile>>("/auth/profile/avatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data.data;
  },

  async deleteAvatar(): Promise<UserProfile> {
    const response = await apiClient.delete<ApiResponse<UserProfile>>("/auth/profile/avatar");
    return response.data.data;
  },

  async requestEmailChange(payload: RequestEmailChangePayload): Promise<void> {
    await apiClient.post("/auth/profile/email/request-change", payload);
  },

  async requestPhoneChange(payload: RequestPhoneChangePayload): Promise<void> {
    await apiClient.post("/auth/profile/phone/request-change", payload);
  },

  async confirmPhoneChange(payload: ConfirmPhoneChangePayload): Promise<UserProfile> {
    const response = await apiClient.post<ApiResponse<UserProfile>>("/auth/profile/phone/confirm-change", payload);
    return response.data.data;
  },

  async linkGoogle(idToken: string): Promise<void> {
    await apiClient.post("/auth/link-google", { idToken });
  },

  async unlinkGoogle(): Promise<void> {
    await apiClient.post("/auth/unlink-google");
  },

  async getSessions(): Promise<AuthSession[]> {
    const response = await apiClient.get<ApiResponse<AuthSession[]>>("/auth/sessions");
    return response.data.data;
  },

  async logoutSession(sessionId: string): Promise<void> {
    await apiClient.delete(`/auth/sessions/${encodeURIComponent(sessionId)}`);
  },

  async logoutOthers(): Promise<void> {
    await apiClient.post("/auth/logout/others");
  },
};
