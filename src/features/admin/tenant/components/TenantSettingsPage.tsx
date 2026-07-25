"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, App, Spin } from "antd";
import { Palette, Save } from "lucide-react";
import FormInput from "@/components/forms/FormInput";
import BaseButton from "@/components/ui/BaseButton";
import { useTenantSettings, useUpdateTenantSettings } from "../hooks/use-tenant";
import { updateTenantSettingsSchema, type UpdateTenantSettingsFormData } from "../schemas/tenant.schema";
import { useAuthStore } from "@/stores/auth.store";

interface TenantSettingsPageProps {
  tenantId?: string;
  canEdit?: boolean;
}

const defaults: UpdateTenantSettingsFormData = {
  dateFormat: "DD/MM/YYYY",
  timeFormat: "HH:mm",
  brandPrimaryColor: "#2563EB",
  brandSecondaryColor: "#10B981",
  brandAccentColor: "#F59E0B",
  employeeCodePrefix: "",
  employeeCodePadding: 4,
};

export default function TenantSettingsPage({ tenantId, canEdit = false }: TenantSettingsPageProps) {
  const { message } = App.useApp();
  const authenticatedTenantId = useAuthStore((state) => state.user?.tenantId);
  const effectiveTenantId = tenantId || authenticatedTenantId || undefined;
  const { data: settings, isLoading, error } = useTenantSettings(effectiveTenantId);
  const { mutateAsync: updateSettings, isPending } = useUpdateTenantSettings();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty, dirtyFields },
  } = useForm<UpdateTenantSettingsFormData>({
    // Zod coercion accepts string input from number fields and returns the typed output.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(updateTenantSettingsSchema) as any,
    defaultValues: defaults,
  });

  useEffect(() => {
    if (settings) {
      reset({
        dateFormat: settings.dateFormat || defaults.dateFormat,
        timeFormat: settings.timeFormat || defaults.timeFormat,
        brandPrimaryColor: settings.brandPrimaryColor || defaults.brandPrimaryColor,
        brandSecondaryColor: settings.brandSecondaryColor || defaults.brandSecondaryColor,
        brandAccentColor: settings.brandAccentColor || defaults.brandAccentColor,
        employeeCodePrefix: settings.employeeCodePrefix || "",
        employeeCodePadding: settings.employeeCodePadding || defaults.employeeCodePadding,
      });
    }
  }, [settings, reset]);

  const onSubmit = async (data: UpdateTenantSettingsFormData) => {
    const payload = Object.fromEntries(
      Object.entries(data).filter(([key]) => dirtyFields[key as keyof UpdateTenantSettingsFormData]),
    );

    try {
      await updateSettings({ payload, id: effectiveTenantId });
      message.success("Lưu cấu hình giao diện thành công");
      reset(data);
    } catch (submitError: unknown) {
      const response = (submitError as {
        response?: { data?: { userMessage?: string; message?: string } };
      }).response;
      message.error(response?.data?.userMessage || response?.data?.message || "Không thể lưu cấu hình.");
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-12"><Spin size="large" /></div>;
  }

  if (error) {
    const status = (error as { response?: { status?: number } }).response?.status;
    return (
      <Alert
        showIcon
        type="error"
        message="Không tải được cấu hình công ty"
        description={status === 403
          ? "Tài khoản không phải thành viên của công ty này."
          : "Vui lòng tải lại trang hoặc thử lại sau."}
      />
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5 pt-2">
      {!canEdit && (
        <Alert
          showIcon
          type="info"
          message="Chế độ chỉ xem"
          description="Chỉ chủ sở hữu công ty được thay đổi cấu hình giao diện và định dạng."
        />
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 lg:p-8">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
            <Palette className="h-5 w-5 text-blue-500" aria-hidden="true" />
            <h3 className="text-lg font-bold text-slate-800">Giao diện và định dạng</h3>
          </div>

          <div className="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2">
            <FormInput
              control={control}
              name="dateFormat"
              label="Định dạng ngày"
              placeholder="DD/MM/YYYY"
              helpText="Ví dụ: DD/MM/YYYY hoặc MM/DD/YYYY"
              error={errors.dateFormat}
              disabled={!canEdit}
              required
            />
            <FormInput
              control={control}
              name="timeFormat"
              label="Định dạng giờ"
              placeholder="HH:mm"
              helpText="Ví dụ: HH:mm hoặc h:mm a"
              error={errors.timeFormat}
              disabled={!canEdit}
              required
            />
            <FormInput
              control={control}
              name="brandPrimaryColor"
              label="Màu chủ đạo"
              error={errors.brandPrimaryColor}
              type="color"
              disabled={!canEdit}
              className="h-20"
            />
            <FormInput
              control={control}
              name="brandSecondaryColor"
              label="Màu phụ"
              error={errors.brandSecondaryColor}
              type="color"
              disabled={!canEdit}
              className="h-20"
            />
            <FormInput
              control={control}
              name="brandAccentColor"
              label="Màu nhấn"
              error={errors.brandAccentColor}
              type="color"
              disabled={!canEdit}
              className="h-20"
            />
          </div>

          <div className="border-t border-slate-100 pt-5">
            <h4 className="mb-4 font-semibold text-slate-800">Mã nhân viên tự động</h4>
            <div className="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2">
              <FormInput
                control={control}
                name="employeeCodePrefix"
                label="Tiền tố mã nhân viên"
                placeholder="EMP"
                helpText="Để trống nếu không dùng mã tự động"
                error={errors.employeeCodePrefix}
                disabled={!canEdit}
              />
              <FormInput
                control={control}
                name="employeeCodePadding"
                label="Số chữ số phần thứ tự"
                type="number"
                error={errors.employeeCodePadding}
                disabled={!canEdit}
              />
            </div>
          </div>

          {canEdit && (
            <div className="flex justify-end border-t border-slate-100 pt-5">
              <BaseButton
                type="primary"
                htmlType="submit"
                loading={isPending}
                disabled={!isDirty}
                icon={<Save className="h-4 w-4" />}
                className="h-11 w-full rounded-xl !border-0 !bg-brand-primary px-8 font-bold !text-white shadow-lg shadow-brand-primary/25 transition-all disabled:!bg-slate-300 disabled:!shadow-none sm:w-auto"
              >
                Lưu thiết lập
              </BaseButton>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
