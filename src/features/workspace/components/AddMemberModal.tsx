import React, { useState } from "react";
import { Modal, Form, Select, Button, message, Spin } from "antd";
import { useAuthStore } from "@/stores/auth.store";
import { useEmployees } from "@/features/employee/hooks/use-employee";
import { useAssignMemberMutation } from "../hooks/use-workspace";
import { AssignWorkspaceMemberRequest } from "../types";

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
  const [form] = Form.useForm();
  const user = useAuthStore((state) => state.user);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: employeesData, isLoading: isLoadingEmployees } = useEmployees({
    size: 100, // Fetch up to 100 for dropdown (could be paginated/searched in real app)
    search: searchTerm,
  });

  const { mutateAsync: assignMember, isPending } = useAssignMemberMutation();

  const handleFinish = async (values: any) => {
    try {
      if (!user?.tenantId) {
        message.error("Lỗi: Không xác định được Tenant ID");
        return;
      }

      const payload: AssignWorkspaceMemberRequest = {
        employeeId: values.employeeId,
        role: values.role,
      };

      await assignMember({
        tenantId: user.tenantId,
        workspaceId,
        data: payload,
      });

      message.success("Thêm nhân sự thành công!");
      form.resetFields();
      onClose();
    } catch (error: any) {
      message.error(error.response?.data?.message || "Có lỗi xảy ra khi thêm nhân sự");
    }
  };

  return (
    <Modal
      title={<span className="text-lg font-bold">Thêm Nhân Sự</span>}
      open={isOpen}
      onCancel={onClose}
      footer={null}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        initialValues={{ role: "member" }}
        className="mt-4"
      >
        <Form.Item
          name="employeeId"
          label={<span className="font-medium text-slate-700">Chọn nhân viên</span>}
          rules={[{ required: true, message: "Vui lòng chọn nhân viên!" }]}
        >
          <Select
            showSearch
            placeholder="Tìm kiếm theo tên hoặc mã NV..."
            optionFilterProp="children"
            onSearch={setSearchTerm}
            filterOption={false} // Use backend search
            notFoundContent={isLoadingEmployees ? <Spin size="small" /> : "Không tìm thấy nhân viên"}
            options={employeesData?.content?.map((emp) => ({
              value: emp.id,
              label: `${emp.employeeCode ? `[${emp.employeeCode}] ` : ""}${emp.fullName || emp.firstName + ' ' + emp.lastName}`,
            })) || []}
            className="h-10"
          />
        </Form.Item>

        <Form.Item
          name="role"
          label={<span className="font-medium text-slate-700">Vai trò</span>}
          rules={[{ required: true, message: "Vui lòng chọn vai trò!" }]}
        >
          <Select
            options={[
              { value: "member", label: "Nhân viên (Member)" },
              { value: "lead", label: "Trưởng nhóm (Lead)" },
              { value: "manager", label: "Quản lý (Manager)" },
            ]}
            className="h-10"
          />
        </Form.Item>

        <div className="flex justify-end gap-3 mt-8">
          <Button onClick={onClose} disabled={isPending}>
            Hủy
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={isPending}
            className="bg-brand-600 hover:bg-brand-700"
          >
            Thêm
          </Button>
        </div>
      </Form>
    </Modal>
  );
}
