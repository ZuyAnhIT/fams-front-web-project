"use client";

import { useEffect, useState } from "react";
import { Alert, App, Form } from "antd";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2 } from "lucide-react";
import FormInput from "@/components/forms/FormInput";
import BaseModal from "@/components/ui/BaseModal";
import { useCreateTenant } from "../hooks/use-tenant";
import { createTenantSchema, type CreateTenantFormData } from "../schemas/tenant.schema";
import type { CreateTenantPayload } from "../types/tenant.type";
import BaseSelect from "@/components/ui/BaseSelect";
import { useSearchUsers } from "@/hooks/use-user";
import { useDebounce } from "@/hooks/useDebounce";

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
] as const;

export default function CreateTenantModal({ open, onClose }: CreateTenantModalProps) {
  const { message } = App.useApp();
  const { mutateAsync: createTenant, isPending } = useCreateTenant();
  const [ownerSearch, setOwnerSearch] = useState("");
  const debouncedOwnerSearch = useDebounce(ownerSearch, 300);
  const { data: ownerResults, isFetching: isSearchingOwners } = useSearchUsers(
    { search: debouncedOwnerSearch, size: 8, sortBy: "displayName", sortDir: "asc" },
    open,
  );

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
      ownerUserId: "",
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
        ownerUserId: "",
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
      const selectedOwner = ownerResults?.content.find((user) => user.id === data.ownerUserId);
      message.success(`Đã cấp phát công ty "${data.name}" cho ${selectedOwner?.email || "tài khoản đã chọn"}.`);
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
          description="Chủ sở hữu phải là tài khoản FAMS đã tồn tại. Công ty được tạo với gói trial; đổi gói là thao tác riêng tại trang chi tiết. Người cấp phát không trở thành thành viên."
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormInput control={control} name="name" label="Tên công ty" error={errors.name} required />
          <FormInput control={control} name="slug" label="Slug" error={errors.slug} required />
          <Controller
            control={control}
            name="ownerUserId"
            render={({ field, fieldState }) => (
              <Form.Item
                className="md:col-span-2 !mb-0"
                label="Chủ sở hữu đã đăng ký"
                required
                validateStatus={fieldState.error ? "error" : ""}
                help={fieldState.error?.message}
              >
                <BaseSelect
                  {...field}
                  aria-label="Chủ sở hữu đã đăng ký"
                  showSearch
                  filterOption={false}
                  onSearch={setOwnerSearch}
                  loading={isSearchingOwners}
                  placeholder="Nhập ít nhất 2 ký tự tên hoặc email"
                  notFoundContent={
                    debouncedOwnerSearch.length < 2
                      ? "Nhập ít nhất 2 ký tự để tìm"
                      : "Không tìm thấy tài khoản — người này cần đăng ký FAMS trước"
                  }
                  options={(ownerResults?.content || []).map((user) => ({
                    value: user.id,
                    label: `${user.displayName || "Chưa đặt tên"} — ${user.email || "không có email"}`,
                  }))}
                />
              </Form.Item>
            )}
          />
          <FormInput control={control} name="domain" label="Tên miền" error={errors.domain} />
          <FormInput control={control} name="industry" label="Lĩnh vực" error={errors.industry} />
          <FormInput control={control} name="countryCode" label="Mã quốc gia" error={errors.countryCode} />
          <FormInput control={control} name="timezone" label="Múi giờ" error={errors.timezone} />
          <FormInput control={control} name="locale" label="Ngôn ngữ" error={errors.locale} />
          <FormInput control={control} name="currencyCode" label="Tiền tệ" error={errors.currencyCode} />
        </div>

      </form>
    </BaseModal>
  );
}
