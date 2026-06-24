"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { message } from "antd";
import { Save } from "lucide-react";
import FormInput from "@/components/forms/FormInput";
import BaseButton from "@/components/ui/BaseButton";
import GlassCard from "@/components/ui/GlassCard";
import { useUpdateTenant } from "../hooks/use-tenant";
import { updateTenantSchema, type UpdateTenantFormData } from "../schemas/tenant.schema";
import type { Tenant } from "../types/tenant.type";
import { useTenantStore } from "@/stores/tenant.store";

export default function UpdateTenantForm({ tenant }: { tenant: Tenant }) {
  const { mutateAsync: updateTenant, isPending } = useUpdateTenant();
  const setActiveTenant = useTenantStore((state) => state.setActiveTenant);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<UpdateTenantFormData>({
    resolver: zodResolver(updateTenantSchema),
    defaultValues: {
      name: tenant.name,
      domain: tenant.domain || "",
      industry: tenant.industry || "",
      countryCode: tenant.countryCode || "",
      timezone: tenant.timezone || "UTC",
      locale: tenant.locale || "en",
      currencyCode: tenant.currency || "USD",
    },
  });

  useEffect(() => {
    reset({
      name: tenant.name,
      domain: tenant.domain || "",
      industry: tenant.industry || "",
      countryCode: tenant.countryCode || "",
      timezone: tenant.timezone || "UTC",
      locale: tenant.locale || "en",
      currencyCode: tenant.currency || "USD",
    });
  }, [tenant, reset]);

  const onSubmit = async (data: UpdateTenantFormData) => {
    try {
      const updatedTenant = await updateTenant({ payload: data, id: tenant.id });
      message.success("Cập nhật thông tin công ty thành công");
      // Cập nhật lại store để UI ở Header tự động ăn theo
      setActiveTenant(updatedTenant);
      reset(data); // Đưa isDirty về false
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      message.error(err.response?.data?.message || "Lỗi khi cập nhật thông tin");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-3xl">
      <GlassCard className="p-6">
        <h3 className="text-lg font-semibold text-brand-900 mb-6">Thông tin cơ bản</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormInput
            control={control}
            name="name"
            label="Tên công ty"
            placeholder="Ví dụ: Công ty TNHH ABC"
            error={errors.name}
            required
            className="md:col-span-2"
          />

          <FormInput
            control={control}
            name="domain"
            label="Tên miền riêng"
            placeholder="Ví dụ: acme.com"
            error={errors.domain}
          />

          <FormInput
            control={control}
            name="industry"
            label="Lĩnh vực hoạt động"
            placeholder="Ví dụ: Bán lẻ, IT..."
            error={errors.industry}
          />

          <FormInput
            control={control}
            name="countryCode"
            label="Mã quốc gia (2 chữ cái)"
            placeholder="Ví dụ: VN"
            error={errors.countryCode}
          />

          <FormInput
            control={control}
            name="timezone"
            label="Múi giờ"
            placeholder="Ví dụ: Asia/Ho_Chi_Minh"
            error={errors.timezone}
          />

          <FormInput
            control={control}
            name="locale"
            label="Ngôn ngữ mặc định"
            placeholder="Ví dụ: vi-VN"
            error={errors.locale}
          />

          <FormInput
            control={control}
            name="currencyCode"
            label="Mã tiền tệ (3 chữ cái)"
            placeholder="Ví dụ: VND"
            error={errors.currencyCode}
          />
        </div>

        <div className="flex justify-end mt-8 border-t border-brand-100 pt-6">
          <BaseButton
            type="primary"
            htmlType="submit"
            icon={<Save className="w-4 h-4" />}
            loading={isPending}
            disabled={!isDirty}
            className="bg-brand-600"
          >
            Lưu thay đổi
          </BaseButton>
        </div>
      </GlassCard>
    </form>
  );
}
