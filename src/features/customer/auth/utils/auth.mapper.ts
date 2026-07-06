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
    
    let tenantRole: SystemRole | undefined = decoded?.role as SystemRole | undefined;
    let tenantId: string | undefined = decoded?.tenantId;
    let permissions: string[] = [];

    if (!isPlatformAdmin && userRoles && userRoles.length > 0) {
      // Dùng role đầu tiên tìm được làm role hiện tại
      const firstRole = userRoles[0];
      if (!tenantRole) tenantRole = firstRole.roleName as SystemRole;
      if (!tenantId) tenantId = firstRole.tenantId;
      
      permissions = Array.from(new Set(userRoles.flatMap(r => r.permissions || [])));
    }

    return {
      ...profile,
      role: isPlatformAdmin ? SystemRole.PLATFORM_ADMIN : tenantRole,
      tenantId: tenantId,
      permissions: permissions,
    };
  },
};
