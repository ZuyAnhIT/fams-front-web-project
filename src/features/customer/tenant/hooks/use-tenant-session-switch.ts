import { useQueryClient } from "@tanstack/react-query";
import { authService } from "@/features/customer/auth/services/auth.service";
import { authMapper } from "@/features/customer/auth/utils/auth.mapper";
import { rolePermissionService } from "@/features/admin/role-permission/services/role-permission.service";
import { useSwitchTenant } from "@/features/customer/auth/hooks/use-auth";
import { authTokenService } from "@/services/auth-token.service";
import { useAuthStore } from "@/stores/auth.store";
import { useNotificationStore } from "@/features/customer/notification/stores/notification.store";
import { ROUTES } from "@/constants/routes";

/**
 * Transaction chuyển tenant dùng chung cho picker, header và flow tạo công ty.
 * Sau switch, mọi request bootstrap chạy bằng cặp token mới; cache tenant cũ bị
 * xóa trước khi UI mới được công bố vào auth store.
 */
export function useTenantSessionSwitch() {
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((state) => state.user);
  const setAuth = useAuthStore((state) => state.setAuth);
  const logout = useAuthStore((state) => state.logout);
  const resetNotifications = useNotificationStore((state) => state.reset);
  const mutation = useSwitchTenant();

  const switchTenantSession = async (tenantId: string) => {
    const refreshToken = authTokenService.getRefreshToken();
    if (!refreshToken) {
      throw new Error("Phiên đăng nhập không còn refresh token.");
    }

    // apiClient tự gắn access token hiện tại vào Authorization; refresh token
    // bắt buộc được gửi trong body theo contract Backend.
    let response;
    try {
      response = await mutation.mutateAsync({ tenantId, refreshToken });
    } catch (error: unknown) {
      const status = (error as { response?: { status?: number } }).response?.status;
      if (status === 401) {
        queryClient.clear();
        resetNotifications();
        logout();
        window.location.assign(ROUTES.LOGIN);
      }
      throw error;
    }
    authTokenService.setAccessToken(response.accessToken);
    authTokenService.setRefreshToken(response.refreshToken);

    const [profileResult, rolesResult] = await Promise.allSettled([
      authService.getProfile(),
      rolePermissionService.getMyRoles(),
    ]);
    if (!currentUser && profileResult.status === "rejected") {
      throw profileResult.reason;
    }

    const profile =
      profileResult.status === "fulfilled" ? profileResult.value : currentUser!;
    const roles =
      rolesResult.status === "fulfilled"
        ? rolesResult.value.data
        : currentUser?.memberships;
    const authUser = authMapper.toAuthUser(profile, response.accessToken, roles);

    queryClient.clear();
    resetNotifications();
    setAuth(authUser, response.accessToken, response.refreshToken);

    return { response, authUser };
  };

  return {
    switchTenantSession,
    isPending: mutation.isPending,
  };
}
