import React, { useEffect } from "react";
import { App } from "antd";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import FormInput from "@/components/forms/FormInput";
import FormSelect from "@/components/forms/FormSelect";
import FormTreeSelect from "@/components/forms/FormTreeSelect";
import BaseModal from "@/components/ui/BaseModal";
import { UpdateWorkspaceFormData, updateWorkspaceSchema } from "../schemas/workspace.schema";
import { useUpdateWorkspaceMutation, useWorkspaceTreeQuery } from "../hooks/use-workspace";
import { useAuthStore } from "@/stores/auth.store";
import { WorkspaceResponse, WorkspaceTreeResponse } from "../types";
import { Edit3 } from "lucide-react";

interface UpdateWorkspaceModalProps {
  workspace: WorkspaceResponse | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function UpdateWorkspaceModal({ workspace, isOpen, onClose }: UpdateWorkspaceModalProps) {
  const { message } = App.useApp();
  const user = useAuthStore((state) => state.user);
  const tenantId = user?.tenantId;

  const { data: treeResponse } = useWorkspaceTreeQuery({ tenantId: tenantId || undefined });
  const treeData = treeResponse?.data || [];

  const updateMutation = useUpdateWorkspaceMutation();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdateWorkspaceFormData>({
    resolver: zodResolver(updateWorkspaceSchema),
    defaultValues: {
      name: "",
      description: "",
      type: "department",
      status: "active",
      parentId: undefined,
    },
  });

  useEffect(() => {
    if (isOpen && workspace) {
      reset({
        name: workspace.name,
        description: workspace.description || "",
        type: workspace.type as "department" | "team",
        status: workspace.status as "active" | "inactive",
        parentId: workspace.parentId || undefined,
      });
    }
  }, [isOpen, workspace, reset]);

  const onSubmit = async (data: UpdateWorkspaceFormData) => {
    if (!tenantId || !workspace) return;
    try {
      // Determine if we need to send clearParent flag
      // If the original workspace had a parent, but the new data has no parentId, it means user cleared it
      const clearParent = !!(workspace.parentId && !data.parentId);
      
      const payload = { ...data, clearParent };
      
      await updateMutation.mutateAsync({ 
        tenantId, 
        workspaceId: workspace.id, 
        data: payload 
      });
      message.success("Cập nhật phòng ban thành công!");
      onClose();
    } catch (error: any) {
      const msg = error.response?.data?.message || "Có lỗi xảy ra khi cập nhật phòng ban";
      message.error(msg);
    }
  };

  // Convert TreeResponse to TreeSelect data format
  const formatTreeData = (nodes: WorkspaceTreeResponse[]): any[] => {
    return nodes
      .filter((node) => node.id !== workspace?.id) // Prevent selecting itself as parent (Circular reference prevention at UI level)
      .map((node) => ({
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
      confirmLoading={updateMutation.isPending}
      title={
        <div className="flex items-center gap-2">
          <Edit3 className="h-5 w-5 text-brand-600" />
          <span>Chỉnh sửa Phòng ban / Đội nhóm</span>
        </div>
      }
      confirmText="Lưu thay đổi"
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

        <div className="grid grid-cols-2 gap-4">
          <FormSelect
            control={control}
            name="type"
            label="Loại tổ chức"
            error={errors.type}
            options={[
              { value: "department", label: "Phòng ban" },
              { value: "team", label: "Đội nhóm" },
            ]}
          />

          <FormSelect
            control={control}
            name="status"
            label="Trạng thái"
            error={errors.status}
            options={[
              { value: "active", label: "Hoạt động" },
              { value: "inactive", label: "Tạm dừng" },
            ]}
          />
        </div>

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
