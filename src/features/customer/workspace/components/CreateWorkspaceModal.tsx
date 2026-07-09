import React, { useEffect } from "react";
import { Modal, Select, TreeSelect, App } from "antd";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import FormInput from "@/components/forms/FormInput";
import FormSelect from "@/components/forms/FormSelect";
import { CreateWorkspaceFormData, createWorkspaceSchema } from "../schemas/workspace.schema";
import { useCreateWorkspaceMutation, useWorkspaceTreeQuery } from "../hooks/use-workspace";
import { useAuthStore } from "@/stores/auth.store";
import { WorkspaceTreeResponse } from "../types";
import { Building2 } from "lucide-react";

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
    <Modal
      open={isOpen}
      onCancel={onClose}
      onOk={() => handleSubmit(onSubmit)()}
      confirmLoading={createMutation.isPending}
      title={
        <div className="flex items-center gap-2 text-slate-800">
          <Building2 className="h-5 w-5 text-brand-600" />
          <span>Thêm Phòng ban / Đội nhóm mới</span>
        </div>
      }
      okText="Thêm mới"
      cancelText="Hủy"
      width={500}
      okButtonProps={{ className: "bg-brand-600 hover:bg-brand-700" }}
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
          size="large"
          options={[
            { value: "department", label: "Phòng ban (Department)" },
            { value: "team", label: "Đội nhóm (Team)" },
          ]}
        />

        <div className="flex flex-col space-y-1.5">
          <label className="text-[13px] font-semibold text-slate-700">Trực thuộc (Phòng ban cha)</label>
          <Controller
            control={control}
            name="parentId"
            render={({ field }) => (
              <TreeSelect
                {...field}
                className="w-full"
                size="large"
                allowClear
                placeholder="Chọn phòng ban quản lý (nếu có)"
                treeData={formatTreeData(treeData)}
                treeDefaultExpandAll
              />
            )}
          />
          <p className="text-xs text-slate-500">Bỏ trống nếu đây là phòng ban độc lập cấp cao nhất.</p>
        </div>

        <FormInput
          control={control}
          name="description"
          label="Mô tả"
          placeholder="Mô tả ngắn về chức năng, nhiệm vụ..."
          error={errors.description}
          type="text"
        />
      </form>
    </Modal>
  );
}
