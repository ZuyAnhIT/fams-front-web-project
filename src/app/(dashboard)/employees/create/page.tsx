import EmployeeForm from "@/features/employee/components/EmployeeForm";

export const metadata = {
  title: "Thêm nhân viên | FAMS",
};

export default function CreateEmployeePage() {
  return (
    <div className="py-2">
      <EmployeeForm isEditMode={false} />
    </div>
  );
}
