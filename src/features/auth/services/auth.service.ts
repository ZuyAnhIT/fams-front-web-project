import { apiClient } from "@/services/api-client";
import {
  type LoginPayload,
  type LoginResponse,
  type RegisterPayload,
  type RegisterResponse,
  type SendOtpPayload,
  type VerifyOtpPayload,
  type ForgotPasswordPayload,
  type ResetPasswordPayload,
  type GoogleLoginPayload,
  type UserProfile,
  type UpdateProfilePayload,
  type ChangePasswordPayload,
  type TotpSetupResponse,
  type TotpVerifyPayload,
  type LoginTotpPayload
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

  /**
   * Đăng nhập tài khoản bằng Email + Mật khẩu
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
   * Gửi OTP đăng nhập bằng Số điện thoại
   */
  async sendOtp(payload: SendOtpPayload): Promise<void> {
    await apiClient.post("/auth/otp/send", payload);
  },

  /**
   * Xác nhận OTP để đăng nhập
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
  async verifyTotp(payload: TotpVerifyPayload): Promise<void> {
    await apiClient.post("/auth/totp/verify", payload);
  },

  /**
   * Tắt TOTP
   */
  async disableTotp(): Promise<void> {
    await apiClient.post("/auth/totp/disable");
  },

  /**
   * Đăng nhập bước 2 bằng mã TOTP
   */
  async loginWithTotp(payload: LoginTotpPayload): Promise<LoginResponse> {
    const response = await apiClient.post<ApiResponse<LoginResponse>>("/auth/login/totp", payload);
    return response.data.data;
  }
};
