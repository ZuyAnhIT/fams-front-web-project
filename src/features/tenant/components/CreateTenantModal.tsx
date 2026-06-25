"use client";

import { Modal, message, Divider } from "antd";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import FormInput from "@/components/forms/FormInput";
import BaseButton from "@/components/ui/BaseButton";
import { useCreateTenant } from "../hooks/use-tenant";
import { createTenantSchema, type CreateTenantFormData } from "../schemas/tenant.schema";
import { useEffect } from "react";
import { Building2, Globe, Settings2, Link } from "lucide-react";

interface CreateTenantModalProps {
  open: boolean;
  onClose: () => void;
}

export default function CreateTenantModal({ open, onClose }: CreateTenantModalProps) {
  const { mutateAsync: createTenant, isPending } = useCreateTenant();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateTenantFormData>({
    resolver: zodResolver(createTenantSchema),
    defaultValues: {
      name: "",
      slug: "",
      domain: "",
      industry: "",
      countryCode: "",
      timezone: "UTC",
      locale: "en",
      currencyCode: "USD",
    },
  });

  useEffect(() => {
    if (open) {
      reset();
    }
  }, [open, reset]);

  const onSubmit = async (data: CreateTenantFormData) => {
    try {
      // Remove empty string fields so they don't fail backend validation (like @Size for countryCode)
      const payload = Object.fromEntries(
        Object.entries(data).filter(([_, v]) => v !== "")
      ) as CreateTenantFormData;
      
      await createTenant(payload);
      message.success(`Đã tạo công ty ${data.name} thành công!`);
      onClose();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      const errorMessage = err.response?.data?.message || "Không thể tạo công ty. Vui lòng thử lại.";
      message.error(errorMessage);
    }
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-brand-primary/10 rounded-xl flex items-center justify-center">
            <Building2 className="h-5 w-5 text-brand-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight leading-tight">Thêm công ty mới</h2>
            <p className="text-sm text-slate-500 font-normal mt-0.5">Tạo không gian làm việc cho một khách hàng mới</p>
          </div>
        </div>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      destroyOnClose
      centered
      width={760}
      classNames={{
        wrapper: "!bg-white !rounded-3xl !p-0 overflow-hidden shadow-2xl shadow-brand-primary/10",
        header: "!bg-white border-b border-slate-100 px-8 py-6 m-0",
        body: "!bg-slate-50/50 p-8",
        close: "mt-4 mr-4 hover:!bg-slate-100 !rounded-full transition-colors",
      }}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Basic Info Section */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm space-y-5">
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="h-4 w-4 text-brand-primary" />
            <h4 className="font-bold text-slate-800 text-[15px]">Thông tin cơ bản</h4>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4">
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
              name="slug"
              label="Đường dẫn (Slug)"
              placeholder="Ví dụ: abc-company"
              error={errors.slug}
              required
              helpText="Dùng làm mã định danh trên URL (chữ thường, không dấu)"
              labelClassName="!text-slate-700 !font-semibold !text-sm"
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
        <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm space-y-5">
          <div className="flex items-center gap-2 mb-2">
            <Globe className="h-4 w-4 text-brand-primary" />
            <h4 className="font-bold text-slate-800 text-[15px]">Định danh mạng (Tùy chọn)</h4>
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
        <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm space-y-5">
          <div className="flex items-center gap-2 mb-2">
            <Settings2 className="h-4 w-4 text-brand-primary" />
            <h4 className="font-bold text-slate-800 text-[15px]">Cấu hình khu vực (Tùy chọn)</h4>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4">
            <FormInput
              control={control}
              name="countryCode"
              label="Mã quốc gia"
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
              label="Ngôn ngữ"
              placeholder="Ví dụ: vi-VN, en-US"
              error={errors.locale}
              labelClassName="!text-slate-700 !font-semibold !text-sm"
            />

            <FormInput
              control={control}
              name="currencyCode"
              label="Mã tiền tệ"
              placeholder="Ví dụ: VND, USD"
              error={errors.currencyCode}
              labelClassName="!text-slate-700 !font-semibold !text-sm"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t border-slate-200/60 mt-8">
          <BaseButton 
            onClick={onClose} 
            disabled={isPending} 
            className="!bg-white !text-slate-700 !border-slate-300 hover:!bg-slate-50 hover:!text-slate-900 h-11 px-6 rounded-xl font-semibold transition-all"
          >
            Hủy bỏ
          </BaseButton>
          <BaseButton 
            type="primary" 
            htmlType="submit" 
            loading={isPending} 
            className="!bg-brand-primary !text-white hover:opacity-90 !border-0 shadow-lg shadow-brand-primary/25 h-11 px-8 rounded-xl font-bold hover:-translate-y-0.5 transition-all"
          >
            Tạo mới
          </BaseButton>
        </div>
      </form>
    </Modal>
  );
}
