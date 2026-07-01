import RoleForm from "@/features/admin/role/components/RoleForm";

export const metadata = {
  title: "Thêm vai trò | FAMS",
};

export default function CreateRolePage() {
  return (
    <div className="py-2">
      <RoleForm isEditMode={false} />
    </div>
  );
}
