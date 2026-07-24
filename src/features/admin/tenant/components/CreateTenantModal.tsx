"use client";

import { useEffect } from "react";
import { Alert, App } from "antd";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2 } from "lucide-react";
import FormInput from "@/components/forms/FormInput";
import BaseModal from "@/components/ui/BaseModal";
import BaseSelect from "@/components/ui/BaseSelect";
import { usePlans } from "@/features/admin/subscription/hooks/use-subscription";
import { useCreateTenant } from "../hooks/use-tenant";
import { createTenantSchema, type CreateTenantFormData } from "../schemas/tenant.schema";
import type { CreateTenantPayload } from "../types/tenant.type";

interface CreateTenantModalProps {
  open: boolean;
  onClose: () => void;
}

const optionalFields = [
  "domain",
  "industry",
  "countryCode",
  "timezone",
  "locale",
  "currencyCode",
  "planId",
] as const;

export default function CreateTenantModal({ open, onClose }: CreateTenantModalProps) {
  const { message } = App.useApp();
  const { mutateAsync: createTenant, isPending } = useCreateTenant();
  const { data: plansData, isLoading: isLoadingPlans } = usePlans(true, { page: 0, size: 100 });
  const plans = plansData?.content ?? [];

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
      countryCode: "VN",
      timezone: "Asia/Ho_Chi_Minh",
      locale: "vi-VN",
      currencyCode: "VND",
      ownerEmail: "",
      planId: "",
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        name: "",
        slug: "",
        domain: "",
        industry: "",
        countryCode: "VN",
        timezone: "Asia/Ho_Chi_Minh",
        locale: "vi-VN",
        currencyCode: "VND",
        ownerEmail: "",
        planId: "",
      });
    }
  }, [open, reset]);

  const onSubmit = async (data: CreateTenantFormData) => {
    const payload: CreateTenantPayload = { ...data };
    for (const field of optionalFields) {
      if (payload[field] === "") delete payload[field];
    }

    try {
      await createTenant(payload);
      message.success(`Đã cấp phát công ty "${data.name}" cho ${data.ownerEmail}.`);
      onClose();
    } catch (error: unknown) {
      const response = (error as {
        response?: { status?: number; data?: { userMessage?: string; message?: string } };
      }).response;
      const fallback: Record<number, string> = {
        400: "Dữ liệu chưa hợp lệ hoặc thiếu chủ sở hữu.",
        403: "Bạn không có quyền cấp phát công ty.",
        404: "Không tìm thấy tài khoản chủ sở hữu hoặc gói dịch vụ.",
        409: "Slug hoặc tên miền đã được sử dụng.",
      };
      message.error(
        response?.data?.userMessage
          || response?.data?.message
          || fallback[response?.status ?? 0]
          || "Không thể tạo công ty.",
      );
    }
  };

  return (
    <BaseModal
      title={
        <span className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-blue-600" aria-hidden="true" />
          Cấp phát công ty
        </span>
      }
      isOpen={open}
      onClose={onClose}
      centered
      width={760}
      confirmText="Tạo và gán chủ sở hữu"
      cancelText="Hủy"
      confirmLoading={isPending}
      confirmButtonProps={{ htmlType: "submit", form: "create-tenant-form" }}
      cancelButtonProps={{ disabled: isPending }}
    >
      <form id="create-tenant-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5 pt-2">
        <Alert
          showIcon
          type="info"
          message="Chế độ platform provisioning"
          description="Chủ sở hữu phải là tài khoản FAMS đã tồn tại. Hệ thống gán trực tiếp TENANT_ADMIN; không gửi lời mời và người cấp phát không trở thành thành viên."
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormInput control={control} name="name" label="Tên công ty" error={errors.name} required />
          <FormInput control={control} name="slug" label="Slug" error={errors.slug} required />
          <FormInput
            control={control}
            name="ownerEmail"
            label="Email chủ sở hữu đã đăng ký"
            error={errors.ownerEmail}
            required
            className="md:col-span-2"
          />
          <FormInput control={control} name="domain" label="Tên miền" error={errors.domain} />
          <FormInput control={control} name="industry" label="Lĩnh vực" error={errors.industry} />
          <FormInput control={control} name="countryCode" label="Mã quốc gia" error={errors.countryCode} />
          <FormInput control={control} name="timezone" label="Múi giờ" error={errors.timezone} />
          <FormInput control={control} name="locale" label="Ngôn ngữ" error={errors.locale} />
          <FormInput control={control} name="currencyCode" label="Tiền tệ" error={errors.currencyCode} />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700" htmlFor="provision-plan">
            Gói dịch vụ
          </label>
          <Controller
            name="planId"
            control={control}
            render={({ field }) => (
              <BaseSelect
                {...field}
                id="provision-plan"
                allowClear
                loading={isLoadingPlans}
                className="w-full"
                placeholder="Mặc định: gói active có thứ tự thấp nhất"
                options={plans.map((plan) => ({
                  value: plan.id,
                  label: `${plan.displayName || plan.name} — ${plan.priceMonthly.toLocaleString("vi-VN")}/tháng`,
                }))}
              />
            )}
          />
        </div>
      </form>
    </BaseModal>
  );
}
