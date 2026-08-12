"use client";

import { useEffect, useState } from "react";
import { Form, Alert, message } from "antd";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { BaseModal, BaseSelect } from "@/components/ui";
import { useAssignPlatformRoleMutation, useRolesQuery } from "../hooks/use-role-permission";
import { useSearchUsers } from "@/hooks/use-user";
import { useDebounce } from "@/hooks/useDebounce";
import type { UserProfile } from "@/features/customer/auth/types/auth.type";
import { getApiErrorMessage } from "@/utils/api-error.util";

const schema = z.object({
  userId: z.uuid("User ID phải là UUID hợp lệ"),
  roleId: z.string().min(1, "Vui lòng chọn role"),
});

type FormValues = z.infer<typeof schema>;

export function AssignPlatformRoleModal({
  open,
  onClose,
  initialUser,
}: {
  open: boolean;
  onClose: () => void;
  initialUser?: UserProfile;
}) {
  const [messageApi, contextHolder] = message.useMessage();
  const mutation = useAssignPlatformRoleMutation();
  const { data, isLoading } = useRolesQuery({ isActive: true, size: 100 });
  const [userSearch, setUserSearch] = useState("");
  const debouncedUserSearch = useDebounce(userSearch, 300);
  const { data: userResults, isFetching: isSearchingUsers } = useSearchUsers(
    { search: debouncedUserSearch, size: 8, sortBy: "displayName", sortDir: "asc" },
    open && !initialUser,
  );
  const { control, handleSubmit, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { userId: "", roleId: "" },
  });

  const roles = data?.data?.content.filter(
    (role) => role.tenantId === null && role.isActive !== false && role.name !== "PLATFORM_ADMIN",
  ) || [];

  useEffect(() => {
    if (open) {
      reset({ userId: initialUser?.id || "", roleId: "" });
    }
  }, [initialUser, open, reset]);

  const submit = async (values: FormValues) => {
    try {
      await mutation.mutateAsync(values);
      messageApi.success("Đã gán role cấp nền tảng");
      reset();
      onClose();
    } catch (error: unknown) {
      messageApi.error(getApiErrorMessage(error, "Không thể gán role cấp nền tảng"));
    }
  };

  return (
    <>
      {contextHolder}
      <BaseModal
        title="Gán role cấp nền tảng"
        isOpen={open}
        onClose={onClose}
        confirmText="Gán role"
        cancelText="Hủy"
        confirmLoading={mutation.isPending}
        confirmButtonProps={{ onClick: handleSubmit(submit) }}
      >
        <Alert
          className="mb-5"
          type="warning"
          showIcon
          title="Quyền áp dụng trên toàn hệ thống"
          description="Chỉ gán cho nhân sự FAMS đã có tài khoản. Backend sẽ chặn role thuộc một công ty hoặc lượt gán trùng."
        />
        <Form layout="vertical">
          <Controller
            name="userId"
            control={control}
            render={({ field, fieldState }) => (
              <Form.Item label="Nhân sự FAMS" required validateStatus={fieldState.error ? "error" : ""} help={fieldState.error?.message}>
                <BaseSelect
                  {...field}
                  aria-label="Tài khoản nhân sự FAMS"
                  disabled={Boolean(initialUser)}
                  showSearch
                  filterOption={false}
                  onSearch={setUserSearch}
                  loading={isSearchingUsers}
                  placeholder="Tìm theo tên hoặc email"
                  notFoundContent={
                    debouncedUserSearch.length < 2
                      ? "Nhập ít nhất 2 ký tự để tìm"
                      : "Không tìm thấy tài khoản"
                  }
                  options={
                    initialUser
                      ? [{
                          value: initialUser.id,
                          label: `${initialUser.displayName} — ${initialUser.email || "không có email"}`,
                        }]
                      : (userResults?.content || []).map((user) => ({
                          value: user.id,
                          label: `${user.displayName || "Chưa đặt tên"} — ${user.email || "không có email"}`,
                        }))
                  }
                />
              </Form.Item>
            )}
          />
          <Controller
            name="roleId"
            control={control}
            render={({ field, fieldState }) => (
              <Form.Item label="Role nền tảng" required validateStatus={fieldState.error ? "error" : ""} help={fieldState.error?.message}>
                <BaseSelect
                  {...field}
                  loading={isLoading}
                  options={roles.map((role) => ({
                    value: role.id,
                    label: `${role.name}${role.isSystem ? " (Hệ thống)" : ""}`,
                  }))}
                  placeholder="Chọn role"
                  showSearch
                  optionFilterProp="label"
                />
              </Form.Item>
            )}
          />
        </Form>
      </BaseModal>
    </>
  );
}
