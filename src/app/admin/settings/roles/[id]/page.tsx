"use client";

import { use } from "react";
import RoleForm from "@/features/admin/role/components/RoleForm";
import { useRoleDetail } from "@/features/admin/role/hooks/use-role";
import RoleGuard from "@/components/guards/RoleGuard";
import { SystemRole } from "@/features/customer/auth/types/auth.type";

function EditRoleContent({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { data, isLoading } = useRoleDetail(resolvedParams.id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-brand-500">
        Không tìm thấy thông tin vai trò
      </div>
    );
  }

  return <div className="py-2"><RoleForm isEditMode={true} initialData={data} /></div>;
}

export default function EditRolePage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <RoleGuard allowedRoles={[SystemRole.PLATFORM_ADMIN]}>
      <EditRoleContent params={params} />
    </RoleGuard>
  );
}
