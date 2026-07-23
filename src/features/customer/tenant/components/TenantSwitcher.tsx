"use client";

import { useState } from "react";
import { Dropdown, App, type MenuProps } from "antd";
import { Building2, ChevronDown, Check, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth.store";
import { useSwitchTenant } from "@/features/customer/auth/hooks/use-auth";
import { authService } from "@/features/customer/auth/services/auth.service";
import { authMapper } from "@/features/customer/auth/utils/auth.mapper";
import { rolePermissionService } from "@/features/admin/role-permission/services/role-permission.service";
import { authTokenService } from "@/services/auth-token.service";
import { CUSTOMER_ROUTES } from "@/constants/routes";

/**
 * Issue #3 (docs/issues/ISSUES.md): a user may hold roles across several companies. Only
 * shows once there are 2+ distinct memberships — a single-company user has nothing to switch.
 */
export default function TenantSwitcher() {
  const { message } = App.useApp();
  const router = useRouter();
  const { user, setAuth } = useAuthStore();
  const { mutateAsync: switchTenant, isPending } = useSwitchTenant();
  const [switchingTo, setSwitchingTo] = useState<string | null>(null);

  const memberships = user?.memberships ?? [];
  const uniqueTenants = Array.from(
    new Map(memberships.filter((m) => m.tenantId).map((m) => [m.tenantId, m])).values()
  );

  if (uniqueTenants.length < 2) return null;

  const handleSwitch = async (tenantId: string) => {
    if (tenantId === user?.tenantId) return;
    const refreshToken = authTokenService.getRefreshToken();
    if (!refreshToken) return;

    setSwitchingTo(tenantId);
    try {
      const response = await switchTenant({ tenantId, refreshToken });
      authTokenService.setAccessToken(response.accessToken);
      authTokenService.setRefreshToken(response.refreshToken);

      const profile = await authService.getProfile();
      let rolesResponse;
      try {
        rolesResponse = await rolePermissionService.getMyRoles();
      } catch {
        // authMapper falls back gracefully when roles can't be fetched
      }
      const authUser = authMapper.toAuthUser(profile, response.accessToken, rolesResponse?.data);
      setAuth(authUser, response.accessToken, response.refreshToken);

      const newName = authUser.memberships?.find((m) => m.tenantId === tenantId)?.tenantName;
      message.success(`Đã chuyển sang ${newName ?? "công ty mới"}`);

      // Full reload: employee/site/attendance/... data is all scoped to the previous
      // tenantId in cached query results — reloading is the safest way to avoid showing
      // stale data from the company just left.
      window.location.assign(CUSTOMER_ROUTES.DASHBOARD);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { userMessage?: string; message?: string } } };
      message.error(err.response?.data?.userMessage || err.response?.data?.message || "Không thể chuyển công ty.");
      setSwitchingTo(null);
    }
  };

  const items: MenuProps["items"] = [
    ...uniqueTenants.map((m) => ({
      key: m.tenantId,
      label: (
        <div className="flex items-center justify-between gap-3 py-0.5">
          <span className="truncate">{m.tenantName || m.tenantId}</span>
          {m.tenantId === user?.tenantId && <Check className="h-4 w-4 text-blue-600" aria-hidden="true" />}
        </div>
      ),
      disabled: isPending && switchingTo === m.tenantId,
      onClick: () => void handleSwitch(m.tenantId),
    })),
    { type: "divider" as const },
    {
      key: "create-new",
      icon: <Plus className="h-4 w-4" aria-hidden="true" />,
      label: "Tạo công ty mới",
      onClick: () => router.push(CUSTOMER_ROUTES.SELECT_COMPANY),
    },
  ];

  const currentName = uniqueTenants.find((m) => m.tenantId === user?.tenantId)?.tenantName;

  return (
    <Dropdown menu={{ items }} trigger={["click"]} placement="bottomRight">
      <button
        type="button"
        aria-label="Chuyển đổi công ty"
        aria-haspopup="menu"
        className="flex min-w-0 max-w-48 items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        <Building2 className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
        <span className="truncate">{currentName || "Công ty"}</span>
        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
      </button>
    </Dropdown>
  );
}
