import TenantMembersPage from "@/features/admin/tenant/components/TenantMembersPage";

export const metadata = {
  title: "Thành viên công ty | FAMS",
};

// Không bọc RoleGuard(allowedPermissions=[...]) ở đây — quyền thật của trang này là "chủ sở
// hữu tenant HOẶC có 1 trong các permission roles:read/roles:update/employees:list" (xem
// TenantMemberService#listMembers ở backend). RoleGuard chỉ so khớp permissions trong JWT,
// không biết về ownership, nên sẽ chặn nhầm chủ sở hữu không giữ các permission trên — cùng
// lỗi đã gặp ở /customer/settings/tenant (xem ghi chú ở page.tsx đó). TenantMembersPage tự xử
// lý 403 dựa trên phản hồi thật từ backend.
export default function CompanyMembersPage() {
  return (
    <div className="mx-auto max-w-[1600px] py-1">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Thành viên công ty</h1>
        <p className="mt-1 text-sm text-slate-600">
          Danh sách tổng quát toàn bộ người thuộc công ty, kèm vai trò và quyền hạn của họ
        </p>
      </div>
      <TenantMembersPage />
    </div>
  );
}
