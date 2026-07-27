"use client";

import { useRouter } from "next/navigation";
import RoleGuard from "@/components/guards/RoleGuard";
import { SystemRole } from "@/features/customer/auth/types/auth.type";
import CreateSiteModal from "@/features/customer/site/components/CreateSiteModal";

function CreateSiteRouteContent() {
  const router = useRouter();
  return (
    <CreateSiteModal
      isOpen
      onClose={() => router.push("/customer/sites")}
    />
  );
}

export default function CreateSitePage() {
  return (
    <RoleGuard
      allowedRoles={[SystemRole.PLATFORM_ADMIN]}
      allowedPermissions={["sites:create"]}
    >
      <CreateSiteRouteContent />
    </RoleGuard>
  );
}
