import axios, { AxiosInstance } from "axios";
import { authTokenService } from "./auth-token.service";
import { message } from "antd";
import { publicEnv } from "@/config/env";

export const apiClient: AxiosInstance = axios.create({
  baseURL: publicEnv.NEXT_PUBLIC_API_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// ─── Request Interceptor ────────────────────────────────────────────────────
// Tự động gắn Access Token vào header Authorization cho mọi request
apiClient.interceptors.request.use(
  (config) => {
    // Correlate client errors with Backend audit/log entries. Backend will also
    // echo this value in the X-Request-Id response header.
    if (!config.headers["X-Request-Id"]) {
      config.headers["X-Request-Id"] = globalThis.crypto?.randomUUID?.()
        ?? `web-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    }
    const token = authTokenService.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor ───────────────────────────────────────────────────
// Xử lý lỗi 401 (Token hết hạn / không hợp lệ) và tự động Refresh Token

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

let isRedirectingToLogin = false;
function forceLogout() {
  if (!isRedirectingToLogin && typeof window !== "undefined" && !window.location.pathname.includes("/login")) {
    isRedirectingToLogin = true;
    authTokenService.clearTokens();
    message.error({
      content: "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại!",
      duration: 3,
      key: "session-expired",
    });
    setTimeout(() => {
      isRedirectingToLogin = false;
      // A hard replace is intentional here: this module lives outside React,
      // and an expired session must reset every in-memory tenant query/store.
      window.location.replace("/login");
    }, 1500);
  }
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Backend sends both a technical `message` (often raw English, e.g. "Account
    // locked until 2026-...") and a `userMessage` (always Vietnamese, user-facing —
    // see BusinessException/ApiResponse on the backend). Every call site in this app
    // reads `error.response.data.message` for its error toast, so normalize it here
    // once instead of touching each of those call sites individually.
    if (error.response?.data?.userMessage) {
      error.response.data.message = error.response.data.userMessage;
    }

    const originalRequest = error.config;
    const isLogoutEndpoint = originalRequest?.url?.includes("/auth/logout");
    const isLoginEndpoint  = originalRequest?.url?.includes("/auth/login");
    const isRefreshEndpoint = originalRequest?.url?.includes("/auth/refresh-token");
    const isSwitchTenantEndpoint = originalRequest?.url?.includes("/auth/switch-tenant");

    // switch-tenant requires the current access + refresh token as one matching pair.
    // Rotating only the refresh token here and retrying the old request body would make
    // that pair inconsistent; its caller deliberately handles 401 by ending the session.
    if (isLogoutEndpoint || isLoginEndpoint || isRefreshEndpoint || isSwitchTenantEndpoint) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = authTokenService.getRefreshToken();
      if (!refreshToken) {
        processQueue(new Error("No refresh token"), null);
        isRefreshing = false;
        forceLogout();
        return Promise.reject(error);
      }

      try {
        // Sử dụng axios riêng biệt để tránh lặp vô hạn với apiClient
        const res = await axios.post(`${apiClient.defaults.baseURL || ''}/auth/refresh-token`, {
          refreshToken,
        });

        const newAccessToken = res.data.data.accessToken;
        const newRefreshToken = res.data.data.refreshToken;

        authTokenService.setAccessToken(newAccessToken);
        authTokenService.setRefreshToken(newRefreshToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        processQueue(null, newAccessToken);

        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        forceLogout();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
