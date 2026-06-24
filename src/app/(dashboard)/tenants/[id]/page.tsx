import TenantDetailPage from "@/features/tenant/components/TenantDetailPage";
import RoleGuard from "@/components/guards/RoleGuard";
import { SystemRole } from "@/features/auth/types/auth.type";

export const metadata = {
  title: "Chi tiết Công ty | FAMS",
};

export default async function TenantDetailRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="max-w-[1600px] mx-auto py-2">
      <RoleGuard allowedRoles={[SystemRole.PLATFORM_ADMIN]}>
        <TenantDetailPage id={id} />
      </RoleGuard>
    </div>
  );
}
