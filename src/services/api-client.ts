import axios from "axios";
import { authTokenService } from "./auth-token.service";
import { message } from "antd";

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Thêm Interceptor để tự động gắn Access Token vào mọi request gửi đi
apiClient.interceptors.request.use(
  (config) => {
    const token = authTokenService.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Thêm Interceptor để xử lý lỗi trả về
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Xóa toàn bộ token
      authTokenService.clearTokens();

      // Kiểm tra nếu đang ở browser và không ở trang login
      const isLogoutEndpoint = error.config?.url?.includes("/auth/logout");
      if (typeof window !== "undefined" && !window.location.pathname.includes("/login") && !isLogoutEndpoint && !(window as any).__isLoggingOut) {
        message.error("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại!");
        // Chuyển hướng về login sau 1 giây để người dùng kịp đọc thông báo
        setTimeout(() => {
          window.location.href = "/login";
        }, 1000);
      }
    }
    return Promise.reject(error);
  }
);