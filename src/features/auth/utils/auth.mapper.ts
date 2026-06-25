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
    // TODO: (Phân quyền Tenant) JWT từ backend hiện tại không chứa các Tenant Role (như TENANT_ADMIN, HR_MANAGER).
    // API /api/v1/auth/me cũng không trả về thông tin này.
    // Nếu Dashboard cần kiểm tra quyền hạn cấp Tenant, Frontend sẽ phải gọi thêm
    // một API phụ (ví dụ: /api/v1/user-roles) trong tương lai.
    return {
      ...profile,
      role: isPlatformAdmin ? SystemRole.PLATFORM_ADMIN : undefined,
    };
  },
};
