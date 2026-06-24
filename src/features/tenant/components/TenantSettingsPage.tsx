"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Tabs, message, Spin } from "antd";
import { Save, Palette } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import FormInput from "@/components/forms/FormInput";
import BaseButton from "@/components/ui/BaseButton";
import { useTenantSettings, useUpdateTenantSettings } from "../hooks/use-tenant";
import { updateTenantSettingsSchema, type UpdateTenantSettingsFormData } from "../schemas/tenant.schema";

export default function TenantSettingsPage({ tenantId }: { tenantId?: string }) {
  const { data: settings, isLoading } = useTenantSettings(tenantId);
  const { mutateAsync: updateSettings, isPending } = useUpdateTenantSettings();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<UpdateTenantSettingsFormData>({
    resolver: zodResolver(updateTenantSettingsSchema),
    defaultValues: {
      dateFormat: "DD/MM/YYYY",
      timeFormat: "24h",
      primaryColor: "#0F172A",
    },
  });

  useEffect(() => {
    if (settings) {
      reset({
        dateFormat: settings.dateFormat || "DD/MM/YYYY",
        timeFormat: settings.timeFormat || "24h",
        primaryColor: settings.primaryColor || "#0F172A",
      });
    }
  }, [settings, reset]);

  const onSubmitUiSettings = async (data: UpdateTenantSettingsFormData) => {
    try {
      await updateSettings({ payload: data, id: tenantId });
      message.success("Lưu cấu hình giao diện thành công");
      reset(data); // reset isDirty state
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      message.error(err.response?.data?.message || "Lỗi khi lưu cấu hình");
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="pt-4 max-w-3xl">
      <form onSubmit={handleSubmit(onSubmitUiSettings)} className="space-y-6">
        <GlassCard className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormInput
              control={control}
              name="dateFormat"
              label="Định dạng hiển thị ngày"
              placeholder="Ví dụ: DD/MM/YYYY"
              error={errors.dateFormat}
              required
            />
            
            <FormInput
              control={control}
              name="timeFormat"
              label="Định dạng hiển thị giờ"
              placeholder="Ví dụ: 24h hoặc 12h"
              error={errors.timeFormat}
              required
            />
            
            <FormInput
              control={control}
              name="primaryColor"
              label="Màu chủ đạo (Hex Code)"
              placeholder="Ví dụ: #0F172A"
              error={errors.primaryColor}
              type="color"
              className="h-12 cursor-pointer p-1"
            />
          </div>

          <div className="flex justify-end mt-6 pt-6 border-t border-brand-100">
            <BaseButton 
              type="primary" 
              htmlType="submit" 
              loading={isPending}
              disabled={!isDirty}
              icon={<Save className="h-4 w-4" />}
              className="bg-brand-600"
            >
              Lưu thiết lập
            </BaseButton>
          </div>
        </GlassCard>
      </form>
    </div>
  );
}
