import TenantConfigurationPage from "@/features/admin/tenant/components/TenantConfigurationPage";

export const metadata = {
  title: "Cấu hình Công ty | FAMS",
};

// Không bọc RoleGuard(allowedRoles=[TENANT_ADMIN]) ở đây nữa — quyền thật của trang này là
// "chủ sở hữu tenant" (kiểm tra bằng tenant.ownerId, xem TenantConfigurationPage), KHÔNG phải
// role. RoleGuard chỉ so khớp 1 role "chính" duy nhất trong JWT (user.role) — nếu 1 người giữ
// nhiều role trong cùng tenant (VD vừa được chuyển quyền owner nên tự động có thêm TENANT_ADMIN
// cạnh role cũ), JWT có thể không chọn đúng TENANT_ADMIN làm role chính, khiến chủ sở hữu thật
// bị chặn ngay từ vòng ngoài dù backend cho phép — đã xác nhận lỗi này thật (2026-08-14).
// TenantConfigurationPage đã tự kiểm tra owner chính xác theo dữ liệu backend, có màn 403 riêng.
export default function SettingsTenantPage() {
  return (
    <div className="mx-auto max-w-[1600px] py-1">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Cấu hình công ty</h1>
        <p className="mt-1 text-sm text-slate-600">
          Thiết lập định dạng hiển thị, màu thương hiệu và danh sách IP truy cập an toàn
        </p>
      </div>
      <TenantConfigurationPage />
    </div>
  );
}
