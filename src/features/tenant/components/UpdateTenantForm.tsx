"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { message } from "antd";
import { Save, Building2, Globe, Settings2, Image as ImageIcon } from "lucide-react";
import FormInput from "@/components/forms/FormInput";
import BaseButton from "@/components/ui/BaseButton";
import { useUpdateTenant } from "../hooks/use-tenant";
import { updateTenantSchema, type UpdateTenantFormData } from "../schemas/tenant.schema";
import type { Tenant } from "../types/tenant.type";
import { useTenantStore } from "@/stores/tenant.store";
import ContentCard from "@/components/shared/layout/ContentCard";

export default function UpdateTenantForm({ tenant, tenantId }: { tenant?: Tenant | null, tenantId?: string }) {
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
      name: tenant?.name || "",
      logoUrl: tenant?.logoUrl || "",
      domain: tenant?.domain || "",
      industry: tenant?.industry || "",
      countryCode: tenant?.countryCode || "",
      timezone: tenant?.timezone || "UTC",
      locale: tenant?.locale || "en",
      currencyCode: tenant?.currency || "USD",
    },
  });

  useEffect(() => {
    reset({
      name: tenant?.name || "",
      logoUrl: tenant?.logoUrl || "",
      domain: tenant?.domain || "",
      industry: tenant?.industry || "",
      countryCode: tenant?.countryCode || "",
      timezone: tenant?.timezone || "UTC",
      locale: tenant?.locale || "en",
      currencyCode: tenant?.currency || "USD",
    });
  }, [tenant, reset]);

  const onSubmit = async (data: UpdateTenantFormData) => {
    try {
      // Remove empty string fields so they don't fail backend validation (like @Size for countryCode)
      const payload = Object.fromEntries(
        Object.entries(data).filter(([_, v]) => v !== "")
      ) as UpdateTenantFormData;

      const targetId = tenant?.id || tenantId;
      const updatedTenant = await updateTenant({ payload, id: targetId });
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
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-4xl space-y-6">
      <ContentCard>
        <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4 relative z-10">
          <Building2 className="h-5 w-5 text-brand-primary" />
          <h3 className="text-lg font-bold text-slate-800">Thông tin cơ bản</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
          <FormInput
            control={control}
            name="name"
            label="Tên công ty"
            placeholder="Ví dụ: Công ty TNHH ABC"
            error={errors.name}
            required
            labelClassName="!text-slate-700 !font-semibold !text-sm"
            className="col-span-1 md:col-span-2"
          />

          <FormInput
            control={control}
            name="logoUrl"
            label="Đường dẫn ảnh Logo (URL)"
            placeholder="Ví dụ: https://example.com/logo.png"
            error={errors.logoUrl}
            labelClassName="!text-slate-700 !font-semibold !text-sm"
            className="col-span-1 md:col-span-2"
          />

          <FormInput
            control={control}
            name="industry"
            label="Lĩnh vực hoạt động"
            placeholder="Ví dụ: Bán lẻ, IT, Y tế..."
            error={errors.industry}
            labelClassName="!text-slate-700 !font-semibold !text-sm"
          />
        </div>
      </div>

      {/* Domain Section */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/60 shadow-sm space-y-6">
        <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4 relative z-10">
          <Globe className="h-5 w-5 text-brand-primary" />
          <h3 className="text-lg font-bold text-slate-800">Định danh mạng</h3>
        </div>
        
        <FormInput
          control={control}
          name="domain"
          label="Tên miền riêng"
          placeholder="Ví dụ: workspace.abc.com"
          error={errors.domain}
          labelClassName="!text-slate-700 !font-semibold !text-sm"
        />
      </div>

      {/* Advanced Config Section */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/60 shadow-sm space-y-6">
        <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4 relative z-10">
          <Settings2 className="h-5 w-5 text-brand-primary" />
          <h3 className="text-lg font-bold text-slate-800">Cấu hình khu vực</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
          <FormInput
            control={control}
            name="countryCode"
            label="Mã quốc gia (2 chữ cái)"
            placeholder="Ví dụ: VN, US, JP"
            error={errors.countryCode}
            labelClassName="!text-slate-700 !font-semibold !text-sm"
          />

          <FormInput
            control={control}
            name="timezone"
            label="Múi giờ"
            placeholder="Ví dụ: Asia/Ho_Chi_Minh"
            error={errors.timezone}
            labelClassName="!text-slate-700 !font-semibold !text-sm"
          />

          <FormInput
            control={control}
            name="locale"
            label="Ngôn ngữ mặc định"
            placeholder="Ví dụ: vi-VN, en-US"
            error={errors.locale}
            labelClassName="!text-slate-700 !font-semibold !text-sm"
          />

          <FormInput
            control={control}
            name="currencyCode"
            label="Mã tiền tệ (3 chữ cái)"
            placeholder="Ví dụ: VND, USD"
            error={errors.currencyCode}
            labelClassName="!text-slate-700 !font-semibold !text-sm"
          />
        </div>
      </ContentCard>

      <div className="flex justify-end pt-4 pb-10">
        <BaseButton
          type="primary"
          htmlType="submit"
          icon={<Save className="w-4 h-4" />}
          loading={isPending}
          disabled={!isDirty}
          className="!bg-brand-primary !text-white hover:opacity-90 !border-0 shadow-lg shadow-brand-primary/25 h-11 px-8 rounded-xl font-bold hover:-translate-y-0.5 transition-all disabled:!bg-slate-300 disabled:!shadow-none disabled:!translate-y-0"
        >
          Lưu thay đổi
        </BaseButton>
      </div>
    </form>
  );
}
