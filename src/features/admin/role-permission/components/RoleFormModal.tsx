"use client";

import React, { useEffect, useState } from "react";
import { Alert, Form, Checkbox, Spin, message, Row, Col, Card } from "antd";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Shield } from "lucide-react";
import { BaseInput, BaseTextArea, BaseSelect, BaseModal } from "@/components/ui";
import { usePermissionsGroupedQuery, useCreateRoleMutation, useUpdateRoleMutation } from "../hooks/use-role-permission";
import type { PermissionGroupResponse, PermissionResponse, RoleDetailResponse } from "../types";
import { formatResource, formatAction, formatDescription } from "../utils/permission.mapper";
import { useAuthStore } from "@/stores/auth.store";
import { SystemRole } from "@/features/customer/auth/types/auth.type";
import { getApiErrorMessage } from "@/utils/api-error.util";


const roleSchema = z.object({
  name: z.string().min(1, "Role name is required").max(100, "Role name must be between 1 and 100 characters"),
  description: z.string().max(500, "Description must be at most 500 characters").optional(),
  permissionIds: z.array(z.string()).optional(),
});

type RoleFormValues = z.infer<typeof roleSchema>;

interface RoleFormModalProps {
  open: boolean;
  onClose: () => void;
  tenantId?: string;
  scope: "tenant" | "platform";
  initialData?: RoleDetailResponse;
}

export const RoleFormModal: React.FC<RoleFormModalProps> = ({ open, onClose, tenantId, scope, initialData }) => {
  const [messageApi, contextHolder] = message.useMessage();
  const user = useAuthStore((state) => state.user);
  const { data: permissionsResponse, isLoading: isLoadingPermissions, isError: isErrorPermissions, error: permissionsError } = usePermissionsGroupedQuery();
  const createRole = useCreateRoleMutation();
  const updateRole = useUpdateRoleMutation();

  const isEdit = !!initialData;
  const isSystemRole = isEdit && initialData?.isSystem;

  const [filterResources, setFilterResources] = useState<string[]>([]);

  const { control, handleSubmit, reset, setValue } = useForm<RoleFormValues>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      name: "",
      description: "",
      permissionIds: [],
    },
  });

  const selectedPermissionIds = useWatch({ control, name: "permissionIds" }) || [];

  useEffect(() => {
    if (open) {
      if (isEdit && initialData) {
        reset({
          name: initialData.name,
          description: initialData.description || "",
          permissionIds: initialData.permissions?.map((p) => p.id) || [],
        });
      } else {
        reset({
          name: "",
          description: "",
          permissionIds: [],
        });
      }
    }
  }, [open, isEdit, initialData, reset]);

  const onSubmit = async (values: RoleFormValues) => {
    try {
      if (isEdit) {
        await updateRole.mutateAsync({
          id: initialData.id,
          data: {
            name: values.name,
            description: values.description,
            permissionIds: values.permissionIds || [],
          },
        });
        messageApi.success("Role updated successfully");
      } else {
        await createRole.mutateAsync({
          ...(scope === "tenant" && tenantId ? { tenantId } : {}),
          name: values.name,
          description: values.description,
          permissionIds: values.permissionIds || [],
        });
        messageApi.success("Role created successfully");
      }
      onClose();
    } catch (error: unknown) {
      messageApi.error(getApiErrorMessage(error, "Đã có lỗi xảy ra"));
    }
  };

  const handlePermissionChange = (permissionId: string, checked: boolean) => {
    const current = [...selectedPermissionIds];
    if (checked) {
      current.push(permissionId);
    } else {
      const index = current.indexOf(permissionId);
      if (index > -1) current.splice(index, 1);
    }
    setValue("permissionIds", current, { shouldDirty: true });
  };

  const handleSelectAllGroup = (permissions: { id: string }[], checked: boolean) => {
    let current = [...selectedPermissionIds];
    const groupPermIds = permissions.map((p) => p.id);
    
    if (checked) {
      const toAdd = groupPermIds.filter((id) => !current.includes(id));
      current = [...current, ...toAdd];
    } else {
      current = current.filter((id) => !groupPermIds.includes(id));
    }
    
    setValue("permissionIds", current, { shouldDirty: true });
  };

  // If response is just an array, permissionsResponse will be the array. 
  // If it's wrapped in ApiResponse, it will be permissionsResponse.data.
  let permissionGroups: PermissionGroupResponse[] = Array.isArray(permissionsResponse)
    ? permissionsResponse 
    : (permissionsResponse?.data || []);

  // Filter out platform-only permissions (tenants, plans) if caller is not PLATFORM_ADMIN
  if (user?.role !== SystemRole.PLATFORM_ADMIN) {
    permissionGroups = permissionGroups.filter((group) => group.resource !== "tenants" && group.resource !== "plans");
  }

  const filteredPermissionGroups = filterResources.length > 0 
    ? permissionGroups.filter((group) => filterResources.includes(group.resource))
    : permissionGroups;

  return (
    <>
      {contextHolder}
      <BaseModal
        title={
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Shield className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <div className="text-xl font-bold text-slate-900 tracking-tight leading-tight">
                {isSystemRole ? "Chi tiết Role Hệ thống" : (isEdit ? "Sửa Role" : "Tạo Role Tùy Chỉnh")}
              </div>
              <p className="text-sm text-slate-500 font-normal mt-0.5">
                {scope === "platform"
                  ? "Vai trò nội bộ FAMS, áp dụng trên toàn nền tảng"
                  : "Thiết lập quyền hạn trong công ty hiện tại"}
              </p>
            </div>
          </div>
        }
        isOpen={open}
        onClose={onClose}
        width={800}
        centered
        confirmText={isSystemRole ? "Đóng" : (isEdit ? "Cập nhật" : "Tạo mới")}
        cancelText="Hủy bỏ"
        onConfirm={isSystemRole ? onClose : handleSubmit(onSubmit)}
        confirmLoading={createRole.isPending || updateRole.isPending}
        confirmButtonProps={{
          className: isSystemRole ? "hidden" : "!bg-blue-600 hover:!bg-blue-700 !border-0 text-white font-bold shadow-lg shadow-blue-500/25 px-8",
          form: "role-form",
          htmlType: "submit"
        }}
        cancelButtonProps={
          isSystemRole
            ? { className: "!bg-slate-100 !text-slate-700 hover:!bg-slate-200 !border-0 font-semibold px-8 h-10" }
            : { disabled: createRole.isPending || updateRole.isPending }
        }
      >
        <Form id="role-form" layout="vertical" onFinish={handleSubmit(onSubmit)} requiredMark={(label, info) => info.required ? <>{label} <span className="text-red-500 ml-1">*</span></> : label}>
          {scope === "platform" && !isSystemRole && (
            <Alert
              className="mb-5"
              type="warning"
              showIcon
              title="Vai trò cấp nền tảng"
              description="Role này không thuộc công ty nào và chỉ Platform Admin được tạo, sửa hoặc gán cho nhân sự FAMS."
            />
          )}

          <Controller
            name="name"
            control={control}
            render={({ field, fieldState }) => (
              <Form.Item
                label="Tên Role"
                validateStatus={fieldState.error ? "error" : ""}
                help={fieldState.error?.message}
                required
              >
                <BaseInput {...field} placeholder="Nhập tên role" disabled={isSystemRole} />
              </Form.Item>
            )}
          />

          <Controller
            name="description"
            control={control}
            render={({ field, fieldState }) => (
              <Form.Item
                label="Mô tả"
                validateStatus={fieldState.error ? "error" : ""}
                help={fieldState.error?.message}
              >
                <BaseTextArea {...field} placeholder="Nhập mô tả cho role này" rows={3} disabled={isSystemRole} />
              </Form.Item>
            )}
          />

          <div className="mt-6 mb-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
              <div className="flex items-center gap-4 flex-wrap">
                <h3 className="text-base font-medium">Phân quyền</h3>
                <BaseSelect
                  mode="multiple"
                  placeholder="Lọc theo nhóm quyền..."
                  value={filterResources}
                  onChange={setFilterResources}
                  style={{ minWidth: 250, maxWidth: 400 }}
                  options={permissionGroups.map((group) => ({
                    label: formatResource(group.resource),
                    value: group.resource,
                  }))}
                  allowClear
                  maxTagCount="responsive"
                />
              </div>
              <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium border border-blue-200 whitespace-nowrap">
                Tổng quyền đã chọn: {selectedPermissionIds.length} / {permissionGroups.reduce((count, group) => count + group.permissions.length, 0)}
              </div>
            </div>
            {isLoadingPermissions ? (
              <div className="flex justify-center p-4"><Spin /></div>
            ) : isErrorPermissions ? (
              <div className="text-red-500 p-4 border border-red-200 rounded-md bg-red-50">
                <p>Lỗi khi tải danh sách phân quyền.</p>
                <p className="text-xs mt-1">{permissionsError instanceof Error ? permissionsError.message : "Vui lòng thử lại."}</p>
              </div>
            ) : permissionGroups.length === 0 ? (
              <div className="text-gray-500 p-4 border border-gray-200 rounded-md bg-gray-50">
                <p>Không có dữ liệu phân quyền.</p>
              </div>
            ) : filteredPermissionGroups.length === 0 ? (
              <div className="text-gray-500 p-4 border border-gray-200 rounded-md bg-gray-50 text-center">
                <p>Không tìm thấy quyền nào phù hợp với bộ lọc.</p>
              </div>
            ) : (
              <div className="max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {filteredPermissionGroups.map((group) => (
                  <Card 
                    key={group.resource} 
                    size="small" 
                    className="mb-4 shadow-sm border-gray-200" 
                    title={<span className="font-semibold text-gray-700">{formatResource(group.resource)}</span>}
                    extra={
                      <Checkbox
                        disabled={isSystemRole}
                        checked={group.permissions.length > 0 && group.permissions.every((permission: PermissionResponse) => selectedPermissionIds.includes(permission.id))}
                        indeterminate={
                          group.permissions.some((permission: PermissionResponse) => selectedPermissionIds.includes(permission.id))
                          && !group.permissions.every((permission: PermissionResponse) => selectedPermissionIds.includes(permission.id))
                        }
                        onChange={(e) => handleSelectAllGroup(group.permissions, e.target.checked)}
                      >
                        <span className="font-medium !text-gray-700">Chọn tất cả</span>
                      </Checkbox>
                    }
                  >
                    <Row gutter={[16, 16]}>
                      {group.permissions.map((permission: PermissionResponse) => (
                        <Col span={12} key={permission.id}>
                          <Checkbox
                            checked={selectedPermissionIds.includes(permission.id)}
                            onChange={(e) => handlePermissionChange(permission.id, e.target.checked)}
                            disabled={isSystemRole}
                          >
                            <div className="flex flex-col">
                              <span className="font-semibold text-sm !text-gray-800">{formatAction(permission.action)}</span>
                              <span className="text-xs !text-gray-500">{formatDescription(permission)}</span>
                            </div>
                          </Checkbox>
                        </Col>
                      ))}
                    </Row>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </Form>
      </BaseModal>
    </>
  );
};
