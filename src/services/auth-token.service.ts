/**
 * Dịch vụ quản lý token xác thực trong hệ thống.
 * Lưu trữ dưới LocalStorage để giả lập phiên làm việc của người dùng.
 */

const ACCESS_TOKEN_KEY = "fams_access_token";
const REFRESH_TOKEN_KEY = "fams_refresh_token";

export const authTokenService = {
  getAccessToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  },

  setAccessToken(token: string): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  },

  removeAccessToken(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(ACCESS_TOKEN_KEY);
  },

  getRefreshToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },

  setRefreshToken(token: string): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  },

  removeRefreshToken(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },

  clearTokens(): void {
    this.removeAccessToken();
    this.removeRefreshToken();
  },
};
