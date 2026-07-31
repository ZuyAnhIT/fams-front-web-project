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
      // Issue #3 (docs/issues/ISSUES.md): a multi-tenant user has one role row per tenant —
      // pick the one matching the JWT's current tenant (set at login/switch-tenant), not a
      // flattened union of every tenant's permissions, which would over-grant UI affordances
      // for tenants the user isn't currently operating as.
      const matchingAssignments = tenantId
        ? userRoles.filter((role) => role.tenantId === tenantId)
        : [];
      // A freshly issued token should always point at one row returned by /roles/me.
      // Keep a defensive fallback so a temporarily stale roles response cannot crash login.
      const currentAssignments =
        matchingAssignments.length > 0 ? matchingAssignments : [userRoles[0]];
      const currentRole = currentAssignments[0];
      if (!tenantRole) tenantRole = currentRole.roleName as SystemRole;
      if (!tenantId) tenantId = currentRole.tenantId;

      permissions = Array.from(
        new Set(currentAssignments.flatMap((role) => role.permissions ?? [])),
      );
    }

    return {
      ...profile,
      role: isPlatformAdmin ? SystemRole.PLATFORM_ADMIN : tenantRole,
      tenantId: tenantId,
      permissions: permissions,
      memberships: userRoles,
    };
  },
};
