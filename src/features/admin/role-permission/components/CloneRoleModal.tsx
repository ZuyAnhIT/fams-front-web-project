"use client";

import React, { useEffect } from "react";
import { Form, message } from "antd";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { BaseInput, BaseTextArea, BaseModal } from "@/components/ui";
import { useCloneRoleMutation } from "../hooks/use-role-permission";
import type { RoleResponse } from "../types";
import { getApiErrorMessage } from "@/utils/api-error.util";

const cloneRoleSchema = z.object({
  name: z.string().min(1, "Vui lòng nhập tên role").max(100, "Tên role tối đa 100 ký tự"),
  description: z.string().max(500, "Mô tả tối đa 500 ký tự").optional(),
});

type CloneRoleFormValues = z.infer<typeof cloneRoleSchema>;

interface CloneRoleModalProps {
  open: boolean;
  onClose: () => void;
  sourceRole?: RoleResponse;
  /** Tenant to own the clone; omit for a platform-scoped clone (Platform Admin only). */
  tenantId?: string;
}

export const CloneRoleModal: React.FC<CloneRoleModalProps> = ({ open, onClose, sourceRole, tenantId }) => {
  const [messageApi, contextHolder] = message.useMessage();
  const cloneRole = useCloneRoleMutation();

  const { control, handleSubmit, reset } = useForm<CloneRoleFormValues>({
    resolver: zodResolver(cloneRoleSchema),
    defaultValues: { name: "", description: "" },
  });

  useEffect(() => {
    if (open && sourceRole) {
      reset({
        name: `${sourceRole.name} (Bản sao)`,
        description: sourceRole.description || "",
      });
    }
  }, [open, sourceRole, reset]);

  const onSubmit = async (values: CloneRoleFormValues) => {
    if (!sourceRole) return;
    try {
      await cloneRole.mutateAsync({
        sourceRoleId: sourceRole.id,
        data: { name: values.name, description: values.description, tenantId },
      });
      messageApi.success(`Đã sao chép "${sourceRole.name}" — chỉnh sửa role mới thoải mái, không ảnh hưởng bản gốc`);
      onClose();
    } catch (error: unknown) {
      messageApi.error(getApiErrorMessage(error, "Không thể sao chép role"));
    }
  };

  return (
    <>
      {contextHolder}
      <BaseModal
        title="Sao chép Role"
        isOpen={open}
        onClose={onClose}
        centered
        width={480}
        confirmText="Sao chép"
        cancelText="Hủy"
        confirmLoading={cloneRole.isPending}
        confirmButtonProps={{ onClick: handleSubmit(onSubmit) }}
        cancelButtonProps={{ disabled: cloneRole.isPending }}
      >
        <p className="mb-4 text-sm text-slate-500">
          Tạo 1 role mới với đúng {sourceRole?.permissionCount ?? 0} quyền của{" "}
          <span className="font-semibold text-slate-700">{sourceRole?.name}</span> — sau khi sao chép, bạn
          chỉnh sửa role mới hoàn toàn độc lập, không ảnh hưởng đến role gốc (kể cả nếu role gốc là role hệ
          thống dùng chung mọi công ty).
        </p>
        <Form layout="vertical">
          <Controller
            name="name"
            control={control}
            render={({ field, fieldState }) => (
              <Form.Item label="Tên role mới" required validateStatus={fieldState.error ? "error" : ""} help={fieldState.error?.message}>
                <BaseInput {...field} placeholder="VD: Nhân viên — Công ty A" />
              </Form.Item>
            )}
          />
          <Controller
            name="description"
            control={control}
            render={({ field, fieldState }) => (
              <Form.Item label="Mô tả" validateStatus={fieldState.error ? "error" : ""} help={fieldState.error?.message}>
                <BaseTextArea {...field} rows={3} />
              </Form.Item>
            )}
          />
        </Form>
      </BaseModal>
    </>
  );
};
