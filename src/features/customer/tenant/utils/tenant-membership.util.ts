import type { UserRoleResponse } from "@/features/admin/role-permission/types";

export interface TenantMembershipGroup {
  tenantId: string;
  tenantName?: string;
  tenantSlug?: string;
  roleNames: string[];
  permissions: string[];
  assignments: UserRoleResponse[];
}

/**
 * Một user có thể giữ nhiều role trong cùng tenant. UI chọn công ty phải gom theo
 * tenantId nhưng vẫn giữ đủ role/permission thay vì lấy tùy ý dòng đầu tiên.
 */
export function groupTenantMemberships(
  assignments: UserRoleResponse[] = [],
): TenantMembershipGroup[] {
  const groups = new Map<string, TenantMembershipGroup>();

  for (const assignment of assignments) {
    if (!assignment.tenantId) continue;
    const existing = groups.get(assignment.tenantId) ?? {
      tenantId: assignment.tenantId,
      tenantName: assignment.tenantName,
      tenantSlug: assignment.tenantSlug,
      roleNames: [],
      permissions: [],
      assignments: [],
    };

    existing.tenantName ||= assignment.tenantName;
    existing.tenantSlug ||= assignment.tenantSlug;
    existing.assignments.push(assignment);
    if (assignment.roleName && !existing.roleNames.includes(assignment.roleName)) {
      existing.roleNames.push(assignment.roleName);
    }
    for (const permission of assignment.permissions ?? []) {
      if (!existing.permissions.includes(permission)) {
        existing.permissions.push(permission);
      }
    }
    groups.set(assignment.tenantId, existing);
  }

  return Array.from(groups.values());
}

export function countDistinctTenants(assignments: UserRoleResponse[] = []): number {
  return groupTenantMemberships(assignments).length;
}
