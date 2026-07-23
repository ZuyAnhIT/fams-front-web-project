import { useQuery } from "@tanstack/react-query";
import { rolePermissionService } from "@/features/admin/role-permission/services/role-permission.service";

/** Issue #3 (docs/issues/ISSUES.md): fresh list of the current user's tenant memberships. */
export const useMyMemberships = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ["auth", "my-memberships"],
    queryFn: () => rolePermissionService.getMyRoles(),
    select: (res) => {
      const seen = new Set<string>();
      return (res.data || []).filter((m) => {
        if (!m.tenantId || seen.has(m.tenantId)) return false;
        seen.add(m.tenantId);
        return true;
      });
    },
    enabled,
  });
};
