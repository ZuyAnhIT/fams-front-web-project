import React, { useState } from "react";
import { App, DatePicker, Form, Spin, Switch } from "antd";
import type { Dayjs } from "dayjs";
import BaseModal from "@/components/ui/BaseModal";
import BaseSelect from "@/components/ui/BaseSelect";
import { useAuthStore } from "@/stores/auth.store";
import { useEmployees } from "@/features/customer/employee/hooks/use-employee";
import { useAssignMemberMutation } from "../hooks/use-workspace";
import { AssignWorkspaceMemberRequest } from "../types";
import { formatVietnameseName } from "@/utils/name.util";
import { getApiErrorMessage } from "@/utils/api-error.util";
import type { Employee } from "@/features/customer/employee/types/employee.type";

interface AddMemberFormValues {
  employeeId: string;
  role: AssignWorkspaceMemberRequest["role"];
  effectiveFrom?: Dayjs;
  isPrimary: boolean;
}

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
}

export default function AddMemberModal({
  isOpen,
  onClose,
  workspaceId,
}: AddMemberModalProps) {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const user = useAuthStore((state) => state.user);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: employeesData, isLoading: isLoadingEmployees } = useEmployees({
    size: 100, // Fetch up to 100 for dropdown (could be paginated/searched in real app)
    search: searchTerm,
    status: "active",
  });

  const { mutateAsync: assignMember, isPending } = useAssignMemberMutation();

  const handleFinish = async (values: AddMemberFormValues) => {
    try {
      if (!user?.tenantId) {
        message.error("Lỗi: Không xác định được Tenant ID");
        return;
      }

      const payload: AssignWorkspaceMemberRequest = {
        employeeId: values.employeeId,
        role: values.role,
        effectiveFrom: values.effectiveFrom?.format("YYYY-MM-DD"),
        // Only sent when explicitly turned on — omitted (undefined) otherwise so the backend's
        // own default applies (auto-primary only when the employee has no other active primary
        // workspace yet), instead of the switch's "off" state overriding that auto-detection.
        isPrimary: values.isPrimary ? true : undefined,
      };

      await assignMember({
        tenantId: user.tenantId,
        workspaceId,
        data: payload,
      });

      message.success("Thêm nhân sự thành công!");
      form.resetFields();
      onClose();
    } catch (error: unknown) {
      message.error(getApiErrorMessage(error, "Có lỗi xảy ra khi thêm nhân sự"));
    }
  };

  return (
    <BaseModal
      title="Thêm Nhân Sự"
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={() => form.submit()}
      confirmLoading={isPending}
      confirmText="Thêm"
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        initialValues={{ role: "member", isPrimary: false }}
        className="mt-4"
      >
        <Form.Item
          name="employeeId"
          label={<span className="font-medium text-slate-700">Chọn nhân viên</span>}
          rules={[{ required: true, message: "Vui lòng chọn nhân viên!" }]}
        >
          <BaseSelect
            showSearch
            placeholder="Tìm kiếm theo tên hoặc mã NV..."
            optionFilterProp="children"
            onSearch={setSearchTerm}
            filterOption={false} // Use backend search
            notFoundContent={isLoadingEmployees ? <Spin size="small" /> : "Không tìm thấy nhân viên"}
            options={employeesData?.content?.map((emp: Employee) => ({
              value: emp.id,
              label: `${emp.employeeCode ? `[${emp.employeeCode}] ` : ""}${emp.fullName || formatVietnameseName(emp.firstName, emp.lastName)}`,
            })) || []}
            className="h-10"
          />
        </Form.Item>

        <Form.Item
          name="role"
          label={<span className="font-medium text-slate-700">Vai trò</span>}
          rules={[{ required: true, message: "Vui lòng chọn vai trò!" }]}
        >
          <BaseSelect
            options={[
              { value: "member", label: "Nhân viên (Member)" },
              { value: "lead", label: "Trưởng nhóm (Lead)" },
              { value: "manager", label: "Quản lý (Manager)" },
            ]}
            className="h-10"
          />
        </Form.Item>

        <Form.Item
          name="effectiveFrom"
          label={<span className="font-medium text-slate-700">Ngày hiệu lực (Tùy chọn)</span>}
          extra="Để trống nếu áp dụng ngay hôm nay. Có thể chọn ngày trong quá khứ hoặc tương lai."
        >
          <DatePicker className="h-10 w-full" format="DD/MM/YYYY" />
        </Form.Item>

        <Form.Item
          name="isPrimary"
          label={<span className="font-medium text-slate-700">Đặt làm workspace chính</span>}
          valuePropName="checked"
          extra="Nếu đây là workspace đầu tiên của nhân viên, hệ thống sẽ tự động đặt làm chính dù không bật ở đây. Bật lên nếu muốn thay thế workspace chính hiện tại."
        >
          <Switch />
        </Form.Item>

      </Form>
    </BaseModal>
  );
}
