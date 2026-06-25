"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { message, Spin } from "antd";
import { Save, Palette } from "lucide-react";
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
      brandPrimaryColor: "#0F172A",
    },
  });

  useEffect(() => {
    if (settings) {
      reset({
        dateFormat: settings.dateFormat || "DD/MM/YYYY",
        timeFormat: settings.timeFormat || "24h",
        brandPrimaryColor: settings.brandPrimaryColor || "#0F172A",
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
    <div className="pt-4 max-w-4xl mx-auto">
      <form onSubmit={handleSubmit(onSubmitUiSettings)} className="space-y-6">
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/60 shadow-sm space-y-6">
          <div className="flex items-center gap-2 mb-2 border-b border-slate-100 pb-4">
            <Palette className="h-5 w-5 text-indigo-500" />
            <h3 className="text-lg font-bold text-slate-800">Tùy biến hiển thị</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
            <FormInput
              control={control}
              name="dateFormat"
              label="Định dạng hiển thị ngày"
              placeholder="Ví dụ: DD/MM/YYYY"
              error={errors.dateFormat}
              required
              labelClassName="!text-slate-700 !font-semibold !text-sm"
            />
            
            <FormInput
              control={control}
              name="timeFormat"
              label="Định dạng hiển thị giờ"
              placeholder="Ví dụ: 24h hoặc 12h"
              error={errors.timeFormat}
              required
              labelClassName="!text-slate-700 !font-semibold !text-sm"
            />
            
            <FormInput
              control={control}
              name="brandPrimaryColor"
              label="Màu chủ đạo (Hex Code)"
              placeholder="Ví dụ: #0F172A"
              error={errors.brandPrimaryColor}
              type="color"
              className="h-12 cursor-pointer p-1"
              labelClassName="!text-slate-700 !font-semibold !text-sm"
            />
          </div>

          <div className="flex justify-end pt-4 pb-2">
            <BaseButton 
              type="primary" 
              htmlType="submit" 
              loading={isPending}
              disabled={!isDirty}
              icon={<Save className="h-4 w-4" />}
              className="!bg-brand-primary !text-white hover:opacity-90 !border-0 shadow-lg shadow-brand-primary/25 h-11 px-8 rounded-xl font-bold transition-all w-full sm:w-auto disabled:!bg-slate-300 disabled:!shadow-none disabled:!translate-y-0"
            >
              Lưu thiết lập
            </BaseButton>
          </div>
        </div>
      </form>
    </div>
  );
}
