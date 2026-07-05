import { jwtDecode } from "jwt-decode";

export interface CustomJwtPayload {
  sub?: string;
  isPlatformAdmin?: boolean;
  tenantId?: string;
  role?: string;
  exp?: number;
  iat?: number;
  jti?: string;
}

/**
 * Giải mã JWT Token để lấy thông tin Payload.
 * Đặc biệt dùng để kiểm tra quyền isPlatformAdmin trước khi có API phân quyền đầy đủ.
 */
export const decodeJwt = (token: string): CustomJwtPayload | null => {
  try {
    return jwtDecode<CustomJwtPayload>(token);
  } catch (error) {
    console.error("Lỗi khi giải mã JWT token:", error);
    return null;
  }
};
