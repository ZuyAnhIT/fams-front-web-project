"use client";

import { useEffect } from "react";
import { Drawer, App, Checkbox, Spin } from "antd";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import FormInput from "@/components/forms/FormInput";
import BaseButton from "@/components/ui/BaseButton";
import { usePlanLimits, useUpdatePlanLimits } from "../hooks/use-subscription";
import { planLimitsSchema, type PlanLimitsFormData } from "../schemas/subscription.schema";
import type { PlanResponse } from "../types/subscription.type";

interface PlanLimitsDrawerProps {
  open: boolean;
  onClose: () => void;
  plan: PlanResponse | null;
}

export default function PlanLimitsDrawer({ open, onClose, plan }: PlanLimitsDrawerProps) {
  const { message } = App.useApp();
  const { data: limits, isLoading } = usePlanLimits(plan?.id as string, open && !!plan?.id);
  const { mutateAsync: updateLimits, isPending } = useUpdatePlanLimits();

  const {
    control,
    handleSubmit,
    reset,
  } = useForm<PlanLimitsFormData>({
    resolver: zodResolver(planLimitsSchema),
    defaultValues: {
      maxEmployees: null,
      maxSites: null,
      maxStorageGb: null,
      maxRandomChecksPerMonth: null,
      isUnlimitedEmployees: true,
      isUnlimitedSites: true,
      isUnlimitedStorage: true,
      isUnlimitedChecks: true,
    },
  });

  const watchIsUnlimitedEmployees = useWatch({ control, name: "isUnlimitedEmployees" });
  const watchIsUnlimitedSites = useWatch({ control, name: "isUnlimitedSites" });
  const watchIsUnlimitedStorage = useWatch({ control, name: "isUnlimitedStorage" });
  const watchIsUnlimitedChecks = useWatch({ control, name: "isUnlimitedChecks" });

  useEffect(() => {
    if (limits && open) {
      reset({
        maxEmployees: limits.maxEmployees ?? null,
        maxSites: limits.maxSites ?? null,
        maxStorageGb: limits.maxStorageGb ?? null,
        maxRandomChecksPerMonth: limits.maxRandomChecksPerMonth ?? null,
        isUnlimitedEmployees: limits.maxEmployees === null || limits.maxEmployees === undefined,
        isUnlimitedSites: limits.maxSites === null || limits.maxSites === undefined,
        isUnlimitedStorage: limits.maxStorageGb === null || limits.maxStorageGb === undefined,
        isUnlimitedChecks: limits.maxRandomChecksPerMonth === null || limits.maxRandomChecksPerMonth === undefined,
      });
    }
  }, [limits, open, reset]);

  const onSubmit = async (data: PlanLimitsFormData) => {
    if (!plan) return;

    try {
      await updateLimits({
        planId: plan.id,
        payload: {
          maxEmployees: data.isUnlimitedEmployees ? null : data.maxEmployees,
          maxSites: data.isUnlimitedSites ? null : data.maxSites,
          maxStorageGb: data.isUnlimitedStorage ? null : data.maxStorageGb,
          maxRandomChecksPerMonth: data.isUnlimitedChecks ? null : data.maxRandomChecksPerMonth,
          clearMaxEmployees: data.isUnlimitedEmployees,
          clearMaxSites: data.isUnlimitedSites,
          clearMaxStorageGb: data.isUnlimitedStorage,
          clearMaxRandomChecksPerMonth: data.isUnlimitedChecks,
        },
      });
      message.success("Cập nhật giới hạn tài nguyên thành công!");
      onClose();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      message.error(err.response?.data?.message || "Đã xảy ra lỗi khi lưu giới hạn.");
    }
  };

  return (
    <Drawer
      title={
        <div>
          <h3 className="text-lg font-semibold text-brand-900">Giới hạn tài nguyên</h3>
          {plan && <p className="text-sm font-normal text-brand-500">Gói: {plan.name}</p>}
        </div>
      }
      placement="right"
      onClose={onClose}
      open={open}
      size="large"
      footer={
        <div className="flex justify-end gap-3">
          <BaseButton onClick={onClose} disabled={isPending} className="!bg-red-500 !text-white hover:!bg-red-600 !border-0">
            Hủy
          </BaseButton>
          <BaseButton type="primary" onClick={handleSubmit(onSubmit)} loading={isPending} className="!bg-blue-600 !text-white hover:!bg-blue-700 !border-0">
            Lưu giới hạn
          </BaseButton>
        </div>
      }
    >
      {isLoading ? (
        <div className="flex justify-center py-10">
          <Spin />
        </div>
      ) : (
        <form className="space-y-6">
          <div className="p-4 bg-brand-50 rounded-lg border border-brand-300">
            <div className="flex items-center justify-between mb-2">
              <label className="font-medium text-brand-900">Số lượng nhân viên tối đa</label>
              <Controller
                name="isUnlimitedEmployees"
                control={control}
                render={({ field }) => (
                  <Checkbox checked={field.value} onChange={(e) => field.onChange(e.target.checked)}>
                    Không giới hạn
                  </Checkbox>
                )}
              />
            </div>
            {!watchIsUnlimitedEmployees && (
              <FormInput
                control={control}
                name="maxEmployees"
                type="number"
                placeholder="VD: 50"
              />
            )}
          </div>

          <div className="p-4 bg-brand-50 rounded-lg border border-brand-300">
            <div className="flex items-center justify-between mb-2">
              <label className="font-medium text-brand-900">Số lượng điểm làm việc tối đa (Sites)</label>
              <Controller
                name="isUnlimitedSites"
                control={control}
                render={({ field }) => (
                  <Checkbox checked={field.value} onChange={(e) => field.onChange(e.target.checked)}>
                    Không giới hạn
                  </Checkbox>
                )}
              />
            </div>
            {!watchIsUnlimitedSites && (
              <FormInput
                control={control}
                name="maxSites"
                type="number"
                placeholder="VD: 10"
              />
            )}
          </div>

          <div className="p-4 bg-brand-50 rounded-lg border border-brand-300">
            <div className="flex items-center justify-between mb-2">
              <label className="font-medium text-brand-900">Dung lượng lưu trữ tối đa (GB)</label>
              <Controller
                name="isUnlimitedStorage"
                control={control}
                render={({ field }) => (
                  <Checkbox checked={field.value} onChange={(e) => field.onChange(e.target.checked)}>
                    Không giới hạn
                  </Checkbox>
                )}
              />
            </div>
            {!watchIsUnlimitedStorage && (
              <FormInput
                control={control}
                name="maxStorageGb"
                type="number"
                placeholder="VD: 10 (10GB)"
              />
            )}
          </div>

          <div className="p-4 bg-brand-50 rounded-lg border border-brand-300">
            <div className="flex items-center justify-between mb-2">
              <label className="font-medium text-brand-900">Số lần kiểm tra đột xuất/Tháng</label>
              <Controller
                name="isUnlimitedChecks"
                control={control}
                render={({ field }) => (
                  <Checkbox checked={field.value} onChange={(e) => field.onChange(e.target.checked)}>
                    Không giới hạn
                  </Checkbox>
                )}
              />
            </div>
            {!watchIsUnlimitedChecks && (
              <FormInput
                control={control}
                name="maxRandomChecksPerMonth"
                type="number"
                placeholder="VD: 100"
              />
            )}
          </div>
        </form>
      )}
    </Drawer>
  );
}
