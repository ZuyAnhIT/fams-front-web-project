import { UserProfile, AuthUser, SystemRole } from "../types/auth.type";
import { decodeJwt } from "./jwt";

export const authMapper = {
  /**
   * Kết hợp dữ liệu Profile từ API và thông tin phân quyền từ JWT Token
   * để tạo ra object AuthUser hoàn chỉnh lưu vào Store.
   */
  toAuthUser(profile: UserProfile, accessToken: string): AuthUser {
    const decoded = decodeJwt(accessToken);
    const isPlatformAdmin = decoded?.isPlatformAdmin === true;

    return {
      ...profile,
      role: isPlatformAdmin ? SystemRole.PLATFORM_ADMIN : SystemRole.EMPLOYEE,
    };
  },
};
