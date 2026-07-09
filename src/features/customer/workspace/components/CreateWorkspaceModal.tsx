import React, { useEffect } from "react";
import { App } from "antd";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import FormInput from "@/components/forms/FormInput";
import FormSelect from "@/components/forms/FormSelect";
import FormTreeSelect from "@/components/forms/FormTreeSelect";
import BaseModal from "@/components/ui/BaseModal";
import { Building2 } from "lucide-react";
import { CreateWorkspaceFormData, createWorkspaceSchema } from "../schemas/workspace.schema";
import { useCreateWorkspaceMutation, useWorkspaceTreeQuery } from "../hooks/use-workspace";
import { useAuthStore } from "@/stores/auth.store";
import { WorkspaceTreeResponse } from "../types";

interface CreateWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateWorkspaceModal({ isOpen, onClose }: CreateWorkspaceModalProps) {
  const { message } = App.useApp();
  const user = useAuthStore((state) => state.user);
  const tenantId = user?.tenantId;

  const { data: treeResponse } = useWorkspaceTreeQuery({ tenantId: tenantId || undefined });
  const treeData = treeResponse?.data || [];

  const createMutation = useCreateWorkspaceMutation();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateWorkspaceFormData>({
    resolver: zodResolver(createWorkspaceSchema),
    defaultValues: {
      name: "",
      description: "",
      type: "department",
      parentId: undefined,
    },
  });

  useEffect(() => {
    if (isOpen) {
      reset();
    }
  }, [isOpen, reset]);

  const onSubmit = async (data: CreateWorkspaceFormData) => {
    if (!tenantId) return;
    try {
      await createMutation.mutateAsync({ tenantId, data });
      message.success("Tạo phòng ban thành công!");
      onClose();
    } catch (error: any) {
      const msg = error.response?.data?.message || "Có lỗi xảy ra khi tạo phòng ban";
      message.error(msg);
    }
  };

  // Convert TreeResponse to TreeSelect data format
  const formatTreeData = (nodes: WorkspaceTreeResponse[]): any[] => {
    return nodes.map((node) => ({
      title: node.name,
      value: node.id,
      key: node.id,
      children: node.children ? formatTreeData(node.children) : [],
    }));
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={() => handleSubmit(onSubmit)()}
      confirmLoading={createMutation.isPending}
      title={
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-brand-600" />
          <span>Thêm Phòng ban / Đội nhóm mới</span>
        </div>
      }
      confirmText="Thêm mới"
      width={500}
    >
      <form className="mt-6 space-y-5">
        <FormInput
          control={control}
          name="name"
          label="Tên phòng ban / đội nhóm"
          placeholder="Ví dụ: Phòng Marketing, Nhóm UI/UX..."
          error={errors.name}
          required
        />

        <FormSelect
          control={control}
          name="type"
          label="Loại tổ chức"
          error={errors.type}
          options={[
            { value: "department", label: "Phòng ban (Department)" },
            { value: "team", label: "Đội nhóm (Team)" },
          ]}
        />

        <FormTreeSelect
          control={control}
          name="parentId"
          label="Trực thuộc (Phòng ban cha)"
          allowClear
          placeholder="Chọn phòng ban quản lý (nếu có)"
          treeData={formatTreeData(treeData)}
          treeDefaultExpandAll
          helperText="Bỏ trống nếu đây là phòng ban độc lập cấp cao nhất."
        />

        <FormInput
          control={control}
          name="description"
          label="Mô tả"
          placeholder="Mô tả ngắn về chức năng, nhiệm vụ..."
          error={errors.description}
          type="text"
        />
      </form>
    </BaseModal>
  );
}
