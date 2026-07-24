"use client";
import { getDashboardRoute } from "@/utils/route.util";

import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth.store";
import { SystemRole } from "@/features/customer/auth/types/auth.type";
import { Result } from "antd";
import BaseButton from "@/components/ui/BaseButton";

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles?: SystemRole[];
  allowedPermissions?: string[];
}

/**
 * Component bảo vệ các trang yêu cầu quyền hạn cụ thể.
 * Nếu user không có quyền, sẽ hiển thị lỗi 403.
 */
export default function RoleGuard({ children, allowedRoles = [], allowedPermissions = [] }: RoleGuardProps) {
  const router = useRouter();
  const { user, isInitialized } = useAuthStore();
  const hasRole = Boolean(user?.role && allowedRoles.includes(user.role));
  const hasPermission = Boolean(
    user?.permissions?.some((permission) => allowedPermissions.includes(permission)),
  );
  const hasAccess = hasRole || hasPermission;

  if (!isInitialized) {
    return (
      <div className="flex h-full min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="flex h-full min-h-[60vh] flex-col items-center justify-center p-6">
        <Result
          status="403"
          title="403 Access Denied"
          subTitle="Xin lỗi, bạn không có quyền truy cập vào trang này."
          extra={
            <BaseButton
              customVariant="default"
              onClick={() => router.push(getDashboardRoute(user?.role))}
            >
              Về Trang chủ
            </BaseButton>
          }
        />
      </div>
    );
  }

  return <>{children}</>;
}
