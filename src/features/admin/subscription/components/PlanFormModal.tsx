"use client";

import { useEffect } from "react";
import { App } from "antd";
import { BaseModal } from "@/components/ui";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import FormInput from "@/components/forms/FormInput";
import { useCreatePlan, useUpdatePlan } from "../hooks/use-subscription";
import { planSchema, type PlanFormData } from "../schemas/subscription.schema";
import type { PlanResponse } from "../types/subscription.type";

interface PlanFormModalProps {
  open: boolean;
  onClose: () => void;
  initialData?: PlanResponse | null;
}

export default function PlanFormModal({ open, onClose, initialData }: PlanFormModalProps) {
  const { message } = App.useApp();
  const { mutateAsync: createPlan, isPending: isCreating } = useCreatePlan();
  const { mutateAsync: updatePlan, isPending: isUpdating } = useUpdatePlan();

  const isPending = isCreating || isUpdating;
  const isEditMode = !!initialData;

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<PlanFormData>({
    resolver: zodResolver(planSchema),
    defaultValues: {
      name: "",
      displayName: "",
      description: "",
      priceMonthly: 0,
      priceYearly: 0,
      isActive: true,
      sortOrder: 0,
    },
  });

  useEffect(() => {
    if (open) {
      if (initialData) {
        reset({
          name: initialData.name,
          displayName: initialData.displayName,
          description: initialData.description || "",
          priceMonthly: initialData.priceMonthly,
          priceYearly: initialData.priceYearly,
          isActive: initialData.isActive,
          sortOrder: initialData.sortOrder,
        });
      } else {
        reset({
          name: "",
          displayName: "",
          description: "",
          priceMonthly: 0,
          priceYearly: 0,
          isActive: true,
          sortOrder: 0,
        });
      }
    }
  }, [open, initialData, reset]);

  const onSubmit = async (data: PlanFormData) => {
    try {
      if (isEditMode && initialData) {
        const payload = {
          displayName: data.displayName,
          description: data.description,
          priceMonthly: data.priceMonthly,
          priceYearly: data.priceYearly,
          isActive: data.isActive,
          sortOrder: data.sortOrder,
        };
        await updatePlan({ id: initialData.id, payload });
        message.success("Cập nhật gói dịch vụ thành công!");
      } else {
        await createPlan(data);
        message.success("Tạo gói dịch vụ mới thành công!");
      }
      onClose();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      const errorMessage = err.response?.data?.message || "Đã xảy ra lỗi. Vui lòng thử lại.";
      message.error(errorMessage);
    }
  };

  return (
    <BaseModal
      title={isEditMode ? "Chỉnh sửa gói dịch vụ" : "Thêm gói dịch vụ mới"}
      isOpen={open}
      onClose={onClose}
      destroyOnHidden
      centered
      width={600}
      confirmText={isEditMode ? "Lưu thay đổi" : "Tạo gói mới"}
      cancelText="Hủy bỏ"
      confirmLoading={isPending}
      confirmButtonProps={{
        htmlType: "submit",
        form: "plan-form",
        disabled: !isDirty,
        className: "!bg-blue-600 hover:!bg-blue-700 !border-0 text-white font-bold shadow-lg shadow-blue-500/25 transition-all h-10 px-6 rounded-lg disabled:!bg-slate-300 disabled:!text-slate-500 disabled:!shadow-none"
      }}
      cancelButtonProps={{
        disabled: isPending,
        className: "!bg-white !text-slate-700 !border-slate-300 hover:!bg-slate-50 hover:!text-slate-900 h-10 px-6 rounded-lg font-semibold transition-all"
      }}
    >
      <form id="plan-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
        <div className="grid grid-cols-2 gap-4">
          <FormInput
            control={control}
            name="name"
            label="Mã định danh (System Key)"
            placeholder="VD: basic-plan, pro_tier"
            error={errors.name}
            required
            disabled={isEditMode}
            helpText={isEditMode ? "Mã hệ thống không thể thay đổi sau khi tạo" : undefined}
            labelClassName="!text-slate-800"
          />
          <FormInput
            control={control}
            name="displayName"
            label="Tên hiển thị công khai"
            placeholder="VD: Basic Plan, Doanh nghiệp"
            error={errors.displayName}
            required
            labelClassName="!text-slate-800"
          />
        </div>

        <FormInput
          control={control}
          name="description"
          label="Mô tả"
          placeholder="Mô tả ngắn gọn về gói dịch vụ (Tối đa 2000 ký tự)"
          error={errors.description}
          labelClassName="!text-slate-800"
        />

        <div className="grid grid-cols-2 gap-4">
          <FormInput
            control={control}
            name="priceMonthly"
            label="Giá thuê bao tháng ($)"
            placeholder="0.00"
            error={errors.priceMonthly}
            required
            type="number"
            labelClassName="!text-slate-800"
          />
          <FormInput
            control={control}
            name="priceYearly"
            label="Giá thuê bao năm ($)"
            placeholder="0.00"
            error={errors.priceYearly}
            required
            type="number"
            labelClassName="!text-slate-800"
          />
        </div>

        <div className="grid grid-cols-1 gap-4">
          <FormInput
            control={control}
            name="sortOrder"
            label="Thứ tự hiển thị"
            placeholder="0"
            error={errors.sortOrder}
            type="number"
            labelClassName="!text-slate-800"
          />
        </div>


      </form>
    </BaseModal>
  );
}
