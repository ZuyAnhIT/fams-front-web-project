"use client";

import { useEffect } from "react";
import { Modal, message } from "antd";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import FormInput from "@/components/forms/FormInput";
import BaseButton from "@/components/ui/BaseButton";
import { useCreatePlan, useUpdatePlan } from "../hooks/use-subscription";
import { planSchema, type PlanFormData } from "../schemas/subscription.schema";
import type { PlanResponse } from "../types/subscription.type";

interface PlanFormModalProps {
  open: boolean;
  onClose: () => void;
  initialData?: PlanResponse | null;
}

export default function PlanFormModal({ open, onClose, initialData }: PlanFormModalProps) {
  const { mutateAsync: createPlan, isPending: isCreating } = useCreatePlan();
  const { mutateAsync: updatePlan, isPending: isUpdating } = useUpdatePlan();

  const isPending = isCreating || isUpdating;
  const isEditMode = !!initialData;

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PlanFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(planSchema) as any,
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
        await updatePlan({ id: initialData.id, payload: data });
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
    <Modal
      title={isEditMode ? "Chỉnh sửa Gói dịch vụ" : "Thêm Gói dịch vụ mới"}
      open={open}
      onCancel={onClose}
      footer={null}
      destroyOnClose
      centered
      classNames={{
        header: "border-b pb-3",
        body: "pt-4",
      }}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormInput
            control={control}
            name="name"
            label="Mã định danh (System Key)"
            placeholder="VD: basic-plan, pro_tier"
            error={errors.name}
            required
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

        <div className="flex justify-end gap-3 pt-4 border-t border-brand-100 mt-6">
          <BaseButton onClick={onClose} disabled={isPending} className="!bg-red-500 !text-white hover:!bg-red-600 !border-0">
            Hủy
          </BaseButton>
          <BaseButton type="primary" htmlType="submit" loading={isPending} className="!bg-blue-600 !text-white hover:!bg-blue-700 !border-0">
            {isEditMode ? "Lưu thay đổi" : "Tạo gói mới"}
          </BaseButton>
        </div>
      </form>
    </Modal>
  );
}
