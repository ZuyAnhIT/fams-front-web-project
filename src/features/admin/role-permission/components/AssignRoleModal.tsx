"use client";

import React, { useEffect } from "react";
import { Alert, Form, message, Radio } from "antd";
import BaseModal from "@/components/ui/BaseModal";
import BaseSelect from "@/components/ui/BaseSelect";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRolesQuery, useAssignRoleMutation } from "../hooks/use-role-permission";
import { useSitesQuery } from "@/features/customer/site/hooks/use-site";
import { getApiErrorMessage } from "@/utils/api-error.util";

const assignRoleSchema = z.object({
  roleId: z.string().min(1, "Vui lòng chọn một role"),
  scope: z.enum(["tenant", "sites"]),
  siteIds: z.array(z.string()),
}).superRefine((values, context) => {
  if (values.scope === "sites" && values.siteIds.length === 0) {
    context.addIssue({
      code: "custom",
      path: ["siteIds"],
      message: "Vui lòng chọn ít nhất một công trình",
    });
  }
});

type AssignRoleValues = z.infer<typeof assignRoleSchema>;

interface AssignRoleModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  tenantId: string;
  onSuccess?: () => void;
}

export const AssignRoleModal: React.FC<AssignRoleModalProps> = ({
  open,
  onClose,
  userId,
  tenantId,
  onSuccess,
}) => {
  const [messageApi, contextHolder] = message.useMessage();
  const assignRole = useAssignRoleMutation();

  // Fetch roles for the dropdown (no pagination, large size to get all for simplicity, or implement search/scroll)
  const { data: rolesData, isLoading: isLoadingRoles } = useRolesQuery({
    tenantId,
    isActive: true,
    size: 100,
  });
  const { data: sitesData, isLoading: isLoadingSites } = useSitesQuery({
    tenantId,
    status: "active",
    size: 100,
  });

  const { control, handleSubmit, reset, setValue } = useForm<AssignRoleValues>({
    resolver: zodResolver(assignRoleSchema),
    defaultValues: {
      roleId: "",
      scope: "tenant",
      siteIds: [],
    },
  });

  useEffect(() => {
    if (open) {
      reset({ roleId: "", scope: "tenant", siteIds: [] });
    }
  }, [open, reset]);

  const onSubmit = async (values: AssignRoleValues) => {
    try {
      await assignRole.mutateAsync({
        userId,
        roleId: values.roleId,
        tenantId,
        siteIds: values.scope === "sites" ? values.siteIds : [],
      });
      messageApi.success("Đã gán role thành công");
      if (onSuccess) onSuccess();
      onClose();
    } catch (error: unknown) {
      messageApi.error(getApiErrorMessage(error, "Lỗi khi gán role"));
    }
  };

  const assignableRoles = rolesData?.data?.content.filter(
    (role) => role.isActive !== false && !["PLATFORM_ADMIN", "PLATFORM_STAFF"].includes(role.name),
  ) || [];
  const roleOptions = assignableRoles.map((role) => ({
    label: role.name + (role.isSystem ? " (Hệ thống)" : ""),
    value: role.id,
  })) || [];
  const selectedRoleId = useWatch({ control, name: "roleId" });
  const selectedRole = assignableRoles.find((role) => role.id === selectedRoleId);
  const supportsSiteScope = Boolean(
    selectedRole && (selectedRole.name === "SITE_SUPERVISOR" || !selectedRole.isSystem),
  );
  const selectedScope = useWatch({ control, name: "scope" });
  const siteOptions = sitesData?.data?.content.map((site) => ({
    label: `${site.name}${site.code ? ` (${site.code})` : ""}`,
    value: site.id,
  })) || [];

  return (
    <>
      {contextHolder}
      <BaseModal
        title="Gán Role cho Người Dùng"
        isOpen={open}
        onClose={onClose}
        destroyOnHidden
        centered
        width={500}
        confirmText="Lưu"
        cancelText="Hủy"
        confirmLoading={assignRole.isPending}
        confirmButtonProps={{
          onClick: handleSubmit(onSubmit),
          className: "!bg-blue-600 hover:!bg-blue-700 !border-0 text-white font-bold shadow-lg shadow-blue-500/25 transition-all h-10 px-6 rounded-lg"
        }}
        cancelButtonProps={{
          disabled: assignRole.isPending,
          className: "!bg-white !text-slate-700 !border-slate-300 hover:!bg-slate-50 hover:!text-slate-900 h-10 px-6 rounded-lg font-semibold transition-all"
        }}
      >
        <Form layout="vertical" className="mt-4">
          <Controller
            name="roleId"
            control={control}
            render={({ field, fieldState }) => (
              <Form.Item
                label={<span className="text-sm font-semibold text-slate-700">Chọn Role</span>}
                validateStatus={fieldState.error ? "error" : ""}
                help={fieldState.error?.message}
                required
              >
                <BaseSelect
                  {...field}
                  placeholder="-- Chọn Role --"
                  options={roleOptions}
                  loading={isLoadingRoles}
                  showSearch
                  optionFilterProp="label"
                  size="large"
                  onChange={(value) => {
                    field.onChange(value);
                    setValue("scope", "tenant");
                    setValue("siteIds", []);
                  }}
                />
              </Form.Item>
            )}
          />
          {supportsSiteScope && (
            <>
              <Controller
                name="scope"
                control={control}
                render={({ field }) => (
                  <Form.Item label={<span className="text-sm font-semibold text-slate-700">Phạm vi áp dụng</span>}>
                    <Radio.Group {...field}>
                      <Radio value="tenant">Toàn công ty</Radio>
                      <Radio value="sites">Công trình cụ thể</Radio>
                    </Radio.Group>
                  </Form.Item>
                )}
              />
              {selectedScope === "sites" && (
                <Controller
                  name="siteIds"
                  control={control}
                  render={({ field, fieldState }) => (
                    <Form.Item
                      label="Chọn công trình"
                      required
                      validateStatus={fieldState.error ? "error" : ""}
                      help={fieldState.error?.message}
                    >
                      <BaseSelect
                        {...field}
                        mode="multiple"
                        options={siteOptions}
                        loading={isLoadingSites}
                        placeholder="Chọn một hoặc nhiều công trình"
                        optionFilterProp="label"
                        showSearch
                      />
                    </Form.Item>
                  )}
                />
              )}
              <Alert
                type="info"
                showIcon
                title="Quy tắc phạm vi"
                description="Nếu người dùng có một role khác áp dụng toàn công ty, phạm vi không giới hạn sẽ được ưu tiên."
              />
            </>
          )}
        </Form>
      </BaseModal>
    </>
  );
};
