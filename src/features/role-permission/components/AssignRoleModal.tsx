"use client";

import React, { useEffect } from "react";
import { Modal, Form, Select, message } from "antd";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRolesQuery, useAssignRoleMutation } from "../hooks/use-role-permission";

const assignRoleSchema = z.object({
  roleId: z.string().min(1, "Vui lòng chọn một role"),
});

type AssignRoleValues = z.infer<typeof assignRoleSchema>;

interface AssignRoleModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  tenantId: string;
  onSuccess?: () => void;
}

export const AssignRoleModal: React.FC<AssignRoleModalProps> = ({
  open,
  onClose,
  userId,
  tenantId,
  onSuccess,
}) => {
  const [messageApi, contextHolder] = message.useMessage();
  const assignRole = useAssignRoleMutation();

  // Fetch roles for the dropdown (no pagination, large size to get all for simplicity, or implement search/scroll)
  const { data: rolesData, isLoading: isLoadingRoles } = useRolesQuery({
    tenantId,
    size: 100, // Assuming 100 is enough for roles dropdown, adjust if needed
  });

  const { control, handleSubmit, reset } = useForm<AssignRoleValues>({
    resolver: zodResolver(assignRoleSchema),
    defaultValues: {
      roleId: "",
    },
  });

  useEffect(() => {
    if (open) {
      reset({ roleId: "" });
    }
  }, [open, reset]);

  const onSubmit = async (values: AssignRoleValues) => {
    try {
      await assignRole.mutateAsync({
        userId,
        roleId: values.roleId,
        tenantId,
      });
      messageApi.success("Đã gán role thành công");
      if (onSuccess) onSuccess();
      onClose();
    } catch (error: any) {
      messageApi.error(error?.response?.data?.message || "Lỗi khi gán role");
    }
  };

  const roleOptions = rolesData?.data?.content.map((role) => ({
    label: role.name + (role.isSystem ? " (Hệ thống)" : ""),
    value: role.id,
  })) || [];

  return (
    <>
      {contextHolder}
      <Modal
        title="Gán Role cho Người Dùng"
        open={open}
        onCancel={onClose}
        onOk={handleSubmit(onSubmit)}
        confirmLoading={assignRole.isPending}
        destroyOnHidden
        okText="Lưu"
        cancelText="Hủy"
      >
        <Form layout="vertical" className="mt-4">
          <Controller
            name="roleId"
            control={control}
            render={({ field, fieldState }) => (
              <Form.Item
                label="Chọn Role"
                validateStatus={fieldState.error ? "error" : ""}
                help={fieldState.error?.message}
                required
              >
                <Select
                  {...field}
                  placeholder="-- Chọn Role --"
                  options={roleOptions}
                  loading={isLoadingRoles}
                  showSearch
                  optionFilterProp="label"
                />
              </Form.Item>
            )}
          />
        </Form>
      </Modal>
    </>
  );
};
