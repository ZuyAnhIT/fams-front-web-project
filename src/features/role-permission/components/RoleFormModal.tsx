"use client";

import React, { useEffect, useState } from "react";
import { Modal, Form, Input, Checkbox, Spin, message, Row, Col, Card, Select } from "antd";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Shield } from "lucide-react";
import BaseButton from "@/components/ui/BaseButton";
import { usePermissionsGroupedQuery, useCreateRoleMutation, useUpdateRoleMutation } from "../hooks/use-role-permission";
import { RoleDetailResponse } from "../types";
import { useQuery } from "@tanstack/react-query";
import { tenantService } from "@/features/tenant/services/tenant.service";

const roleSchema = z.object({
  name: z.string().min(1, "Role name is required").max(100, "Role name must be between 1 and 100 characters"),
  description: z.string().max(500, "Description must be at most 500 characters").optional(),
  permissionIds: z.array(z.string()).optional(),
  selectedTenantId: z.string().optional(),
});

type RoleFormValues = z.infer<typeof roleSchema>;

interface RoleFormModalProps {
  open: boolean;
  onClose: () => void;
  tenantId: string;
  initialData?: RoleDetailResponse;
}

export const RoleFormModal: React.FC<RoleFormModalProps> = ({ open, onClose, tenantId, initialData }) => {
  const [messageApi, contextHolder] = message.useMessage();
  const { data: permissionsResponse, isLoading: isLoadingPermissions, isError: isErrorPermissions, error: permissionsError } = usePermissionsGroupedQuery();
  const createRole = useCreateRoleMutation();
  const updateRole = useUpdateRoleMutation();

  const isEdit = !!initialData;
  const showTenantSelector = !tenantId && !isEdit;

  const { data: tenantsData, isLoading: isLoadingTenants } = useQuery({
    queryKey: ["tenants", "all"],
    queryFn: () => tenantService.listTenants({ size: 100 }),
    enabled: showTenantSelector && open,
  });

  const { control, handleSubmit, reset, setValue, watch, setError } = useForm<RoleFormValues>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      name: "",
      description: "",
      permissionIds: [],
      selectedTenantId: undefined,
    },
  });

  const selectedPermissionIds = watch("permissionIds") || [];

  useEffect(() => {
    if (open) {
      if (isEdit && initialData) {
        reset({
          name: initialData.name,
          description: initialData.description || "",
          permissionIds: initialData.permissions?.map((p) => p.id) || [],
          selectedTenantId: initialData.tenantId || undefined,
        });
      } else {
        reset({
          name: "",
          description: "",
          permissionIds: [],
          selectedTenantId: undefined,
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
        const finalTenantId = tenantId || values.selectedTenantId;
        if (!finalTenantId) {
          setError("selectedTenantId", { type: "manual", message: "Vui lòng chọn công ty" });
          return;
        }

        await createRole.mutateAsync({
          tenantId: finalTenantId,
          name: values.name,
          description: values.description,
          permissionIds: values.permissionIds || [],
        });
        messageApi.success("Role created successfully");
      }
      onClose();
    } catch (error: any) {
      messageApi.error(error?.response?.data?.message || "Đã có lỗi xảy ra");
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

  const handleSelectAllGroup = (permissions: any[], checked: boolean) => {
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
  // Let's handle both cases to be safe!
  const permissionGroups = Array.isArray(permissionsResponse) 
    ? permissionsResponse 
    : (permissionsResponse?.data || []);

  const tenantOptions = tenantsData?.content?.map((t) => ({ label: t.name, value: t.id })) || [];

  return (
    <>
      {contextHolder}
      <Modal
        title={
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-brand-primary/10 rounded-xl flex items-center justify-center">
              <Shield className="h-5 w-5 text-brand-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight leading-tight">
                {isEdit ? "Sửa Role" : "Tạo Role Tùy Chỉnh"}
              </h2>
              <p className="text-sm text-slate-500 font-normal mt-0.5">
                Thiết lập quyền hạn cho nhóm người dùng
              </p>
            </div>
          </div>
        }
        open={open}
        onCancel={onClose}
        width={800}
        destroyOnHidden={true}
        footer={
          <div className="flex justify-end gap-3 mt-4">
            <BaseButton
              onClick={onClose}
              disabled={createRole.isPending || updateRole.isPending}
              className="!bg-white !text-slate-700 !border-slate-300 hover:!bg-slate-50 hover:!text-slate-900 h-11 px-6 rounded-xl font-semibold transition-all"
            >
              Hủy bỏ
            </BaseButton>
            <BaseButton
              type="primary"
              htmlType="submit"
              form="role-form"
              loading={createRole.isPending || updateRole.isPending}
              className="!bg-brand-primary !text-white hover:opacity-90 !border-0 shadow-lg shadow-brand-primary/25 h-11 px-8 rounded-xl font-bold hover:-translate-y-0.5 transition-all"
            >
              {isEdit ? "Cập nhật" : "Tạo mới"}
            </BaseButton>
          </div>
        }
        classNames={{
          content: "!bg-white !rounded-3xl !p-0 overflow-hidden shadow-2xl shadow-brand-primary/10",
          header: "!bg-white border-b border-slate-100 px-8 py-5 m-0",
          body: "!bg-slate-50/50 p-6 md:p-8 overflow-y-auto max-h-[60vh] scrollbar-thin scrollbar-thumb-slate-200",
          footer: "!bg-white border-t border-slate-100 px-8 py-4 m-0",
          close: "mt-4 mr-4 hover:!bg-slate-100 !rounded-full transition-colors",
        }}
      >
        <Form id="role-form" layout="vertical" onFinish={handleSubmit(onSubmit)} requiredMark={(label, info) => info.required ? <>{label} <span className="text-red-500 ml-1">*</span></> : label}>
          {showTenantSelector && (
            <Controller
              name="selectedTenantId"
              control={control}
              render={({ field, fieldState }) => (
                <Form.Item
                  label="Chọn Công ty (Tenant)"
                  validateStatus={fieldState.error ? "error" : ""}
                  help={fieldState.error?.message}
                  required
                >
                  <Select
                    {...field}
                    placeholder="-- Chọn công ty --"
                    options={tenantOptions}
                    loading={isLoadingTenants}
                    showSearch
                    optionFilterProp="label"
                  />
                </Form.Item>
              )}
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
                <Input {...field} placeholder="Nhập tên role" disabled={isEdit && initialData?.isSystem} />
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
                <Input.TextArea {...field} placeholder="Nhập mô tả cho role này" rows={3} disabled={isEdit && initialData?.isSystem} />
              </Form.Item>
            )}
          />

          <div className="mt-6 mb-2">
            <h3 className="text-base font-medium mb-4">Phân quyền (Permissions)</h3>
            {isLoadingPermissions ? (
              <div className="flex justify-center p-4"><Spin /></div>
            ) : isErrorPermissions ? (
              <div className="text-red-500 p-4 border border-red-200 rounded-md bg-red-50">
                <p>Lỗi khi tải danh sách phân quyền.</p>
                <pre className="text-xs mt-2 overflow-auto max-w-full">
                  {JSON.stringify(permissionsError, null, 2)}
                </pre>
              </div>
            ) : permissionGroups.length === 0 ? (
              <div className="text-gray-500 p-4 border border-gray-200 rounded-md bg-gray-50">
                <p>Không có dữ liệu phân quyền. (Debug info:)</p>
                <pre className="text-xs mt-2 overflow-auto max-w-full">
                  {JSON.stringify(permissionsResponse, null, 2)}
                </pre>
              </div>
            ) : (
              <div className="max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {permissionGroups.map((group) => (
                  <Card 
                    key={group.resource} 
                    size="small" 
                    className="mb-4 shadow-sm border-gray-200" 
                    title={<span className="font-semibold text-gray-700 capitalize">{group.resource}</span>}
                    extra={
                      <Checkbox
                        disabled={isEdit && initialData?.isSystem}
                        checked={group.permissions.length > 0 && group.permissions.every((p: any) => selectedPermissionIds.includes(p.id))}
                        onChange={(e) => handleSelectAllGroup(group.permissions, e.target.checked)}
                      >
                        Chọn tất cả
                      </Checkbox>
                    }
                  >
                    <Row gutter={[16, 16]}>
                      {group.permissions.map((permission) => (
                        <Col span={12} key={permission.id}>
                          <Checkbox
                            checked={selectedPermissionIds.includes(permission.id)}
                            onChange={(e) => handlePermissionChange(permission.id, e.target.checked)}
                            disabled={isEdit && initialData?.isSystem}
                          >
                            <div className="flex flex-col">
                              <span className="font-medium text-sm">{permission.action}</span>
                              <span className="text-xs text-gray-500">{permission.description}</span>
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
      </Modal>
    </>
  );
};
