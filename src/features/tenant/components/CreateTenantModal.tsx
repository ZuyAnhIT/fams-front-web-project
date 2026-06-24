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
      await createTenant(data);
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
      title="Thêm công ty/chi nhánh mới"
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
          <div className="md:col-span-2">
            <h4 className="font-semibold text-brand-800">Thông tin công ty</h4>
          </div>

          <FormInput
            control={control}
            name="name"
            label="Tên công ty"
            placeholder="Ví dụ: Công ty TNHH ABC"
            error={errors.name}
            required
          />

          <FormInput
            control={control}
            name="slug"
            label="Đường dẫn (Slug)"
            placeholder="Ví dụ: abc-company"
            error={errors.slug}
            required
            helpText="Được dùng để định danh công ty trên URL"
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

        <div className="flex justify-end gap-3 pt-4 border-t border-brand-100 mt-6">
          <BaseButton onClick={onClose} disabled={isPending}>
            Hủy
          </BaseButton>
          <BaseButton type="primary" htmlType="submit" loading={isPending} className="bg-brand-600">
            Tạo công ty
          </BaseButton>
        </div>
      </form>
    </Modal>
  );
}
