import TenantListPage from "@/features/tenant/components/TenantListPage";

export const metadata = {
  title: "Quản lý công ty | FAMS",
};

export default function TenantsPage() {
  return (
    <div className="max-w-[1600px] mx-auto py-2">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-brand-950">Danh sách công ty</h1>
        <p className="text-sm text-brand-600 mt-1">
          Quản lý toàn bộ công ty (tenants) đang sử dụng hệ thống
        </p>
      </div>
      <TenantListPage />
    </div>
  );
}
