"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, App } from "antd";
import { ArrowLeft, Save } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import FormInput from "@/components/forms/FormInput";
import BaseButton from "@/components/ui/BaseButton";
import { useCreateRole, useUpdateRole } from "../hooks/use-role";
import { roleSchema, type RoleFormData } from "../schemas/role.schema";
import type { RoleDetailResponse } from "../types/role.type";
import PermissionMatrix from "./PermissionMatrix";
import { ADMIN_ROUTES } from "@/constants/routes";

interface RoleFormProps {
  initialData?: RoleDetailResponse;
  isEditMode?: boolean;
}

export default function RoleForm({ initialData, isEditMode = false }: RoleFormProps) {
  const { message } = App.useApp();
  const router = useRouter();
  const { mutateAsync: createRole, isPending: isCreating } = useCreateRole();
  const { mutateAsync: updateRole, isPending: isUpdating } = useUpdateRole();

  const isPending = isCreating || isUpdating;

  // System roles cannot be updated via UI
  const isSystemRole = initialData?.isSystem === true;

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RoleFormData>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      name: "",
      description: "",
      permissionIds: [],
    },
  });

  useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name || "",
        description: initialData.description || "",
        permissionIds: initialData.permissions.map(p => p.id),
      });
    }
  }, [initialData, reset]);

  const onSubmit = async (data: RoleFormData) => {
    if (isSystemRole) {
      message.error("Không thể chỉnh sửa vai trò hệ thống!");
      return;
    }

    try {
      if (isEditMode && initialData) {
        await updateRole({ id: initialData.id, payload: data });
        message.success("Cập nhật vai trò thành công");
      } else {
        await createRole(data);
        message.success("Thêm mới vai trò thành công");
        router.push(ADMIN_ROUTES.ROLES);
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      const errorMessage = err.response?.data?.message || "Đã xảy ra lỗi, vui lòng thử lại sau";
      message.error(errorMessage);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            type="button"
            aria-label="Quay lại danh sách vai trò"
            onClick={() => router.push(ADMIN_ROUTES.ROLES)}
            className="p-2 rounded-lg hover:bg-brand-200 text-brand-700 transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-brand-950">
              {isEditMode ? "Chỉnh sửa vai trò" : "Thêm vai trò mới"}
            </h1>
            <p className="text-sm text-brand-600 mt-1">
              Định nghĩa tên vai trò và thiết lập các quyền hạn tương ứng
            </p>
          </div>
        </div>
        
        {!isSystemRole && (
          <BaseButton 
            type="primary"
            icon={<Save className="h-4 w-4" />}
            loading={isPending}
            onClick={handleSubmit(onSubmit)}
            className="bg-brand-600 hover:bg-brand-700 w-full sm:w-auto"
          >
            Lưu thay đổi
          </BaseButton>
        )}
      </div>

      {isSystemRole && (
        <Alert
          type="info"
          showIcon
          title="Vai trò hệ thống"
          description="Đây là vai trò mặc định của hệ thống. Bạn chỉ có thể xem, không thể chỉnh sửa tên hay phân quyền của vai trò này."
          className="bg-blue-50 border-blue-200"
        />
      )}

      {/* Form Content */}
      <form id="role-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <GlassCard className="border-brand-200 bg-white shadow-sm p-6 sm:p-8">
          <div className="pb-4 mb-4 border-b border-brand-100">
            <h3 className="font-semibold text-brand-800 text-lg">Thông tin vai trò</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormInput
              control={control}
              name="name"
              label="Tên vai trò"
              placeholder="Ví dụ: Kế toán, Trưởng phòng..."
              error={errors.name}
              required
              disabled={isSystemRole}
              className="text-brand-900 border-brand-300 focus:border-brand-500"
            />

            <FormInput
              control={control}
              name="description"
              label="Mô tả"
              placeholder="Mô tả ngắn gọn chức năng của vai trò này"
              error={errors.description}
              disabled={isSystemRole}
              className="text-brand-900 border-brand-300 focus:border-brand-500"
            />
          </div>
        </GlassCard>

        <GlassCard className="border-brand-200 bg-white shadow-sm p-6 sm:p-8">
          <Controller
            name="permissionIds"
            control={control}
            render={({ field }) => (
              <PermissionMatrix 
                value={field.value} 
                onChange={field.onChange} 
                disabled={isSystemRole}
              />
            )}
          />
          {errors.permissionIds && (
            <p className="text-sm text-rose-500 mt-2">{errors.permissionIds.message}</p>
          )}
        </GlassCard>
      </form>
    </div>
  );
}
