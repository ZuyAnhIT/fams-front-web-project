import axios from "axios";
import { authTokenService } from "./auth-token.service";

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