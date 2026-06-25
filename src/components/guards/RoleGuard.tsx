"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth.store";
import { SystemRole } from "@/features/auth/types/auth.type";
import { Result } from "antd";
import BaseButton from "@/components/ui/BaseButton";
import { ROUTES } from "@/constants/routes";

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: SystemRole[];
}

/**
 * Component bảo vệ các trang yêu cầu quyền hạn cụ thể.
 * Nếu user không có quyền, sẽ hiển thị lỗi 403.
 */
export default function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const router = useRouter();
  const { user, isInitialized } = useAuthStore();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);

  useEffect(() => {
    if (!isInitialized) return;

    if (!user) {
      setHasAccess(false);
      return;
    }

    if (!user.role) {
      setHasAccess(false);
      return;
    }

    if (allowedRoles.includes(user.role as SystemRole)) {
      setHasAccess(true);
    } else {
      setHasAccess(false);
    }
  }, [user, isInitialized, allowedRoles]);

  if (!isInitialized || hasAccess === null) {
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
              onClick={() => router.push(ROUTES.DASHBOARD)}
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
