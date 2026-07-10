"use client";

import { message, Divider, Form, AutoComplete } from "antd";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import FormInput from "@/components/forms/FormInput";
import BaseButton from "@/components/ui/BaseButton";
import BaseModal from "@/components/ui/BaseModal";
import { useCreateTenant } from "../hooks/use-tenant";
import { createTenantSchema, type CreateTenantFormData } from "../schemas/tenant.schema";
import { useEffect, useState } from "react";
import { Building2, Globe, Settings2, UserCog } from "lucide-react";
import { useRolesQuery, useAssignRoleMutation } from "@/features/admin/role-permission/hooks/use-role-permission";
import { useSendInvitation } from "@/features/customer/employee/hooks/use-employee";
import { useSearchUsers } from "@/hooks/use-user";
import { useDebounce } from "@/hooks/useDebounce";
import { UserProfile } from "@/features/customer/auth/types/auth.type";

interface CreateTenantModalProps {
  open: boolean;
  onClose: () => void;
}

export default function CreateTenantModal({ open, onClose }: CreateTenantModalProps) {
  const { mutateAsync: createTenant, isPending: isCreating } = useCreateTenant();
  const { mutateAsync: sendInvitation, isPending: isSending } = useSendInvitation();
  const { mutateAsync: assignRole, isPending: isAssigning } = useAssignRoleMutation();
  const { data: rolesData } = useRolesQuery({ isSystem: true, size: 50 });
  
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 500);
  const { data: usersData, isFetching: isSearching } = useSearchUsers({ search: debouncedSearch, size: 10 });
  
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  const isPending = isCreating || isSending || isAssigning;

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
    watch,
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
      adminEmail: "",
    },
  });

  const adminEmailValue = watch("adminEmail");

  useEffect(() => {
    if (open) {
      reset();
      setSearchQuery("");
      setSelectedUser(null);
    }
  }, [open, reset]);

  // Keep selectedUser in sync with the input
  useEffect(() => {
    if (selectedUser && selectedUser.email !== adminEmailValue) {
      setSelectedUser(null);
    }
  }, [adminEmailValue, selectedUser]);

  const onSubmit = async (data: CreateTenantFormData) => {
    try {
      // Remove empty string fields so they don't fail backend validation
      const { adminEmail, ...restData } = data;
      const payload = Object.fromEntries(
        Object.entries(restData).filter(([_, v]) => v !== "")
      ) as CreateTenantFormData;

      const createdTenant = await createTenant(payload);

      if (adminEmail) {
        const tenantAdminRole = rolesData?.data?.content?.find((r) => r.name === "TENANT_ADMIN");
        if (tenantAdminRole) {
          if (selectedUser && selectedUser.email === adminEmail) {
            // User exists, assign role directly
            await assignRole({
              userId: selectedUser.id,
              roleId: tenantAdminRole.id,
              tenantId: createdTenant.id,
            });
          } else {
            // User doesn't exist or wasn't selected, send invitation
            await sendInvitation({
              payload: {
                email: adminEmail,
                roleId: tenantAdminRole.id,
              },
              tenantId: createdTenant.id,
            });
          }
        } else {
          message.warning("Không tìm thấy role TENANT_ADMIN trong hệ thống. Lời mời/Gán quyền chưa được thực hiện.");
        }
      }

      message.success(`Đã tạo công ty ${data.name} thành công!`);
      onClose();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      const errorMessage = err.response?.data?.message || "Không thể tạo công ty. Vui lòng thử lại.";
      message.error(errorMessage);
    }
  };

  const userOptions = usersData?.content?.map((user) => ({
    value: user.email || "",
    label: (
      <div className="flex flex-col py-1">
        <span className="font-semibold text-slate-800">{user.displayName}</span>
        <span className="text-xs text-slate-500">{user.email}</span>
      </div>
    ),
    user,
  })) || [];

  return (
    <BaseModal
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
      isOpen={open}
      onClose={onClose}
      destroyOnClose
      centered
      width={760}
      confirmText="Tạo mới"
      cancelText="Hủy bỏ"
      confirmLoading={isPending}
      confirmButtonProps={{
        htmlType: "submit",
        form: "create-tenant-form",
        className: "!bg-blue-600 hover:!bg-blue-700 !border-0 text-white font-bold shadow-lg shadow-blue-500/25 transition-all h-10 px-6 rounded-lg"
      }}
      cancelButtonProps={{
        disabled: isPending,
        className: "!bg-white !text-slate-700 !border-slate-300 hover:!bg-slate-50 hover:!text-slate-900 h-10 px-6 rounded-lg font-semibold transition-all"
      }}
    >
      <form id="create-tenant-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6 pt-2">
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

        {/* Admin Setup Section */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm space-y-5">
          <div className="flex items-center gap-2 mb-2">
            <UserCog className="h-4 w-4 text-brand-primary" />
            <h4 className="font-bold text-slate-800 text-[15px]">Quản trị viên (Tùy chọn)</h4>
          </div>

          <Controller
            name="adminEmail"
            control={control}
            render={({ field }) => (
              <Form.Item
                label={<span className="text-slate-700 font-semibold text-sm">Email Quản trị viên</span>}
                validateStatus={errors.adminEmail ? "error" : ""}
                help={errors.adminEmail?.message || "Nhập Email để Gán quyền (nếu đã có tài khoản) hoặc Gửi lời mời (nếu chưa có)."}
              >
                <AutoComplete
                  {...field}
                  options={userOptions}
                  onSearch={setSearchQuery}
                  onSelect={(value, option: any) => setSelectedUser(option.user)}
                  placeholder="Ví dụ: ceo@abc.com"
                  size="large"
                  className="w-full"
                />
              </Form.Item>
            )}
          />
        </div>

      </form>
    </BaseModal>
  );
}
