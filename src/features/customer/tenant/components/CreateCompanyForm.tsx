"use client";

import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { App } from "antd";
import { Building2 } from "lucide-react";
import FormInput from "@/components/forms/FormInput";
import BaseButton from "@/components/ui/BaseButton";
import { useCreateTenant } from "@/features/admin/tenant/hooks/use-tenant";
import { useSwitchTenant } from "@/features/customer/auth/hooks/use-auth";
import { authService } from "@/features/customer/auth/services/auth.service";
import { authMapper } from "@/features/customer/auth/utils/auth.mapper";
import { rolePermissionService } from "@/features/admin/role-permission/services/role-permission.service";
import { authTokenService } from "@/services/auth-token.service";
import { useAuthStore } from "@/stores/auth.store";
import { CUSTOMER_ROUTES } from "@/constants/routes";
import { createCompanySchema, type CreateCompanyFormData } from "../schemas/create-company.schema";

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

interface CreateCompanyFormProps {
  onCreated?: () => void;
}

/**
 * Issue #3 (docs/issues/ISSUES.md): self-serve "create a company" form for any authenticated
 * user (not just Platform Admin). After creation the creator is auto-assigned TENANT_ADMIN —
 * we immediately switch the session to the new company so they land straight in its dashboard.
 */
export default function CreateCompanyForm({ onCreated }: CreateCompanyFormProps) {
  const { message } = App.useApp();
  const { setAuth } = useAuthStore();
  const { mutateAsync: createTenant, isPending: isCreating } = useCreateTenant();
  const { mutateAsync: switchTenant, isPending: isSwitching } = useSwitchTenant();

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateCompanyFormData>({
    resolver: zodResolver(createCompanySchema),
    defaultValues: { name: "", slug: "", industry: "", ownerEmail: "" },
  });

  const nameValue = watch("name");
  const slugValue = watch("slug");
  const lastAutoSlugRef = useRef("");

  // Auto-derive the slug from the company name as the user types, but stop once they've
  // customized it directly (slug value diverges from what we last auto-generated).
  useEffect(() => {
    if (slugValue === "" || slugValue === lastAutoSlugRef.current) {
      const autoSlug = slugify(nameValue || "");
      lastAutoSlugRef.current = autoSlug;
      setValue("slug", autoSlug);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nameValue]);

  const isPending = isCreating || isSwitching;

  const onSubmit = async (data: CreateCompanyFormData) => {
    try {
      const payload = Object.fromEntries(
        Object.entries(data).filter(([, v]) => v !== "")
      ) as CreateCompanyFormData;

      const createdTenant = await createTenant(payload);

      // Switch into the newly created company right away (creator is auto-assigned
      // TENANT_ADMIN there) so they land in its dashboard, not the old/no-company view.
      const refreshToken = authTokenService.getRefreshToken();
      if (refreshToken) {
        const switchResponse = await switchTenant({ tenantId: createdTenant.id, refreshToken });
        authTokenService.setAccessToken(switchResponse.accessToken);
        authTokenService.setRefreshToken(switchResponse.refreshToken);

        const profile = await authService.getProfile();
        let rolesResponse;
        try {
          rolesResponse = await rolePermissionService.getMyRoles();
        } catch {
          // authMapper falls back gracefully when roles can't be fetched
        }
        const authUser = authMapper.toAuthUser(profile, switchResponse.accessToken, rolesResponse?.data);
        setAuth(authUser, switchResponse.accessToken, switchResponse.refreshToken);
      }

      message.success(`Đã tạo công ty "${createdTenant.name}" thành công!`);
      onCreated?.();
      window.location.assign(CUSTOMER_ROUTES.DASHBOARD);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { userMessage?: string; message?: string } } };
      message.error(err.response?.data?.userMessage || err.response?.data?.message || "Không thể tạo công ty. Vui lòng thử lại.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
        helpText="Mã định danh trên URL — tự động tạo từ tên công ty, có thể chỉnh lại"
      />

      <FormInput
        control={control}
        name="industry"
        label="Lĩnh vực hoạt động"
        placeholder="Ví dụ: Xây dựng, Sản xuất, Logistics..."
        error={errors.industry}
      />

      <FormInput
        control={control}
        name="ownerEmail"
        label="Mời người khác làm chủ công ty (tùy chọn)"
        placeholder="Ví dụ: ceo@abc.com"
        error={errors.ownerEmail}
        helpText="Để trống nếu bạn là người quản lý công ty này. Nếu điền, người được mời sẽ nhận email lời mời; bạn vẫn giữ quyền quản trị."
      />

      <BaseButton htmlType="submit" loading={isPending} disabled={!nameValue} className="w-full" size="large">
        <Building2 className="mr-2 h-4 w-4" aria-hidden="true" />
        Tạo công ty
      </BaseButton>
    </form>
  );
}
