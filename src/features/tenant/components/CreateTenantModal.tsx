"use client";

import { Modal, message, Divider } from "antd";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import FormInput from "@/components/forms/FormInput";
import BaseButton from "@/components/ui/BaseButton";
import { useCreateTenant } from "../hooks/use-tenant";
import { createTenantSchema, type CreateTenantFormData } from "../schemas/tenant.schema";
import { useEffect } from "react";

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
      title={<h2 className="text-xl font-extrabold text-brand-900">Thêm công ty/chi nhánh mới</h2>}
      open={open}
      onCancel={onClose}
      footer={null}
      destroyOnClose
      centered
      width={700}
      classNames={{
        header: "border-b pb-3",
        body: "pt-4",
      }}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <FormInput
            control={control}
            name="name"
            label="Tên công ty"
            placeholder="Ví dụ: Công ty TNHH ABC"
            error={errors.name}
            required
            labelClassName="!text-slate-900"
          />

          <FormInput
            control={control}
            name="slug"
            label="Đường dẫn (Slug)"
            placeholder="Ví dụ: abc-company"
            error={errors.slug}
            required
            helpText="Được dùng để định danh công ty trên URL"
            labelClassName="!text-slate-900"
          />

          {/* Optional Fields Toggle (Bọc trong một section) */}
          <div className="md:col-span-2">
            <Divider className="my-2" />
            <h4 className="font-semibold text-brand-800">Cấu hình nâng cao (Tùy chọn)</h4>
          </div>

          <FormInput
            control={control}
            name="domain"
            label="Tên miền riêng"
            placeholder="Ví dụ: acme.com"
            error={errors.domain}
            labelClassName="!text-slate-900"
          />

          <FormInput
            control={control}
            name="industry"
            label="Lĩnh vực hoạt động"
            placeholder="Ví dụ: Bán lẻ, IT..."
            error={errors.industry}
            labelClassName="!text-slate-900"
          />

          <FormInput
            control={control}
            name="countryCode"
            label="Mã quốc gia (2 chữ cái)"
            placeholder="Ví dụ: VN"
            error={errors.countryCode}
            labelClassName="!text-slate-900"
          />

          <FormInput
            control={control}
            name="timezone"
            label="Múi giờ"
            placeholder="Ví dụ: Asia/Ho_Chi_Minh"
            error={errors.timezone}
            labelClassName="!text-slate-900"
          />

          <FormInput
            control={control}
            name="locale"
            label="Ngôn ngữ mặc định"
            placeholder="Ví dụ: vi-VN"
            error={errors.locale}
            labelClassName="!text-slate-900"
          />

          <FormInput
            control={control}
            name="currencyCode"
            label="Mã tiền tệ (3 chữ cái)"
            placeholder="Ví dụ: VND"
            error={errors.currencyCode}
            labelClassName="!text-slate-900"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-brand-100 mt-6">
          <BaseButton onClick={onClose} disabled={isPending} className="!bg-red-500 !text-white hover:!bg-red-600 !border-0">
            Hủy
          </BaseButton>
          <BaseButton type="primary" htmlType="submit" loading={isPending} className="!bg-blue-600 !text-white hover:!bg-blue-700 !border-0 shadow-md">
            Tạo công ty
          </BaseButton>
        </div>
      </form>
    </Modal>
  );
}
