import axios, { AxiosInstance } from "axios";
import { authTokenService } from "./auth-token.service";
import { message } from "antd";

export const apiClient: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// ─── Request Interceptor ────────────────────────────────────────────────────
// Tự động gắn Access Token vào header Authorization cho mọi request
apiClient.interceptors.request.use(
  (config) => {
    const token = authTokenService.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor ───────────────────────────────────────────────────
// Xử lý lỗi 401 (Token hết hạn / không hợp lệ)
//
// [NOTE FOR BACKEND TEAM]:
// Hiện tại Backend chưa có API POST /api/v1/auth/refresh-token.
// Khi Backend xây dựng xong, hãy bổ sung logic ở đây để:
//   1. Dùng refreshToken lấy từ authTokenService.getRefreshToken()
//   2. Gọi POST /auth/refresh-token để lấy accessToken mới
//   3. Lưu token mới bằng authTokenService.setAccessToken(newToken)
//   4. Retry lại request ban đầu với token mới
//   5. Nếu refresh thất bại → mới logout và redirect về /login
//
// Pattern: axios-auth-refresh hoặc tự implement với biến isRefreshing + queue

let isRedirectingToLogin = false; // Chống redirect nhiều lần cùng lúc

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const isLogoutEndpoint = error.config?.url?.includes("/auth/logout");
    const isLoginEndpoint  = error.config?.url?.includes("/auth/login");
    const isRefreshEndpoint = error.config?.url?.includes("/auth/refresh");

    // Bỏ qua lỗi 401 từ chính endpoint login/logout/refresh (xử lý riêng ở component)
    if (isLogoutEndpoint || isLoginEndpoint || isRefreshEndpoint) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401) {
      // Chỉ redirect một lần duy nhất dù có nhiều request cùng thất bại
      if (!isRedirectingToLogin && typeof window !== "undefined" && !window.location.pathname.includes("/login")) {
        isRedirectingToLogin = true;

        // Xóa token cũ
        authTokenService.clearTokens();

        message.error({
          content: "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại!",
          duration: 3,
          key: "session-expired",
        });

        setTimeout(() => {
          isRedirectingToLogin = false;
          window.location.href = "/login";
        }, 1500);
      }
    }

    return Promise.reject(error);
  }
);