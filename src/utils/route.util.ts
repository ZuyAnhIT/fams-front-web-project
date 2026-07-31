
import { ADMIN_ROUTES, CUSTOMER_ROUTES } from "@/constants/routes";
import { SystemRole } from "@/features/customer/auth/types/auth.type";
import type { UserRoleResponse } from "@/features/admin/role-permission/types";
import { countDistinctTenants } from "@/features/customer/tenant/utils/tenant-membership.util";

export function getDashboardRoute(role?: SystemRole | string): string {
  if (role === SystemRole.PLATFORM_ADMIN || role === SystemRole.PLATFORM_STAFF) {
    return ADMIN_ROUTES.DASHBOARD;
  }
  return CUSTOMER_ROUTES.DASHBOARD;
}

/**
 * Issue #3 (docs/issues/ISSUES.md): any authenticated user may now belong to zero companies
 * (fresh self-serve signup, before creating/joining one) — sending them to the ordinary
 * dashboard would show empty/broken tenant-scoped data. Route them to pick-or-create a
 * company instead. Used right after login/register/accept-invite, not for general navigation.
 */
export function resolvePostLoginRoute(user?: {
  role?: SystemRole | string;
  tenantId?: string | null;
  memberships?: UserRoleResponse[];
}): string {
  if (user?.role === SystemRole.PLATFORM_ADMIN) {
    return ADMIN_ROUTES.DASHBOARD;
  }
  if (user?.role === SystemRole.PLATFORM_STAFF) {
    return ADMIN_ROUTES.TENANTS;
  }
  if (!user?.tenantId || countDistinctTenants(user.memberships) >= 2) {
    return CUSTOMER_ROUTES.SELECT_COMPANY;
  }
  return CUSTOMER_ROUTES.DASHBOARD;
}
