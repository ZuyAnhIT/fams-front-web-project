import { UserProfile, AuthUser, SystemRole } from "../types/auth.type";
import { decodeJwt } from "./jwt";
import { UserRoleResponse } from "@/features/admin/role-permission/types";

export const authMapper = {
  /**
   * Kết hợp dữ liệu Profile từ API và thông tin phân quyền từ JWT Token
   * để tạo ra object AuthUser hoàn chỉnh lưu vào Store.
   */
  toAuthUser(profile: UserProfile, accessToken: string, userRoles?: UserRoleResponse[]): AuthUser {
    const decoded = decodeJwt(accessToken);
    const isPlatformAdmin = decoded?.isPlatformAdmin === true;
    
    let tenantRole: SystemRole | undefined = undefined;
    let tenantId: string | undefined = undefined;

    if (!isPlatformAdmin && userRoles && userRoles.length > 0) {
      // Dùng role đầu tiên tìm được làm role hiện tại
      const firstRole = userRoles[0];
      tenantRole = firstRole.roleName as SystemRole;
      tenantId = firstRole.tenantId;
    }

    return {
      ...profile,
      role: isPlatformAdmin ? SystemRole.PLATFORM_ADMIN : tenantRole,
      tenantId: tenantId,
    };
  },
};
