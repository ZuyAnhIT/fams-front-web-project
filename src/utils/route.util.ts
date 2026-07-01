
import { ADMIN_ROUTES, CUSTOMER_ROUTES } from "@/constants/routes";
import { SystemRole } from "@/features/customer/auth/types/auth.type";

export function getDashboardRoute(role?: SystemRole | string): string {
  if (role === SystemRole.PLATFORM_ADMIN) {
    return ADMIN_ROUTES.DASHBOARD;
  }
  return CUSTOMER_ROUTES.DASHBOARD;
}
