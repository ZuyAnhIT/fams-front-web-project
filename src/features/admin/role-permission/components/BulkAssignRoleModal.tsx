"use client";

import React, { useState } from "react";
import { Alert, App, Form, List, Tag } from "antd";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CheckCircleFilled, CloseCircleFilled } from "@ant-design/icons";
import { BaseModal, BaseSelect } from "@/components/ui";
import { useRolesQuery, useBulkAssignRoleMutation } from "../hooks/use-role-permission";
import { useEmployees } from "@/features/customer/employee/hooks/use-employee";
import { getEmployeeDisplayName } from "@/utils/name.util";
import { useDebounce } from "@/hooks/useDebounce";
import type { BulkAssignRoleResponse } from "../types";
import { getApiErrorMessage } from "@/utils/api-error.util";

const bulkAssignSchema = z.object({
  roleId: z.string().min(1, "Vui lòng chọn role cần gán"),
  revokeRoleId: z.string().optional(),
  userIds: z.array(z.string()).min(1, "Vui lòng chọn ít nhất một nhân viên"),
});

type BulkAssignFormValues = z.infer<typeof bulkAssignSchema>;

interface BulkAssignRoleModalProps {
  open: boolean;
  onClose: () => void;
  tenantId: string;
}

export const BulkAssignRoleModal: React.FC<BulkAssignRoleModalProps> = ({ open, onClose, tenantId }) => {
  const { message } = App.useApp();
  const bulkAssign = useBulkAssignRoleMutation();
  const [result, setResult] = useState<BulkAssignRoleResponse | null>(null);
  const [employeeSearch, setEmployeeSearch] = useState("");
  const debouncedEmployeeSearch = useDebounce(employeeSearch, 300);

  const { data: rolesData, isLoading: isLoadingRoles } = useRolesQuery({
    tenantId,
    isActive: true,
    size: 100,
  });
  const { data: employeesData, isFetching: isSearchingEmployees } = useEmployees(
    { search: debouncedEmployeeSearch, size: 50, sortBy: "lastName", sortDir: "asc" },
    { enabled: open },
  );

  const { control, handleSubmit, reset } = useForm<BulkAssignFormValues>({
    resolver: zodResolver(bulkAssignSchema),
    defaultValues: { roleId: "", revokeRoleId: undefined, userIds: [] },
  });

  const closeModal = () => {
    reset({ roleId: "", revokeRoleId: undefined, userIds: [] });
    setResult(null);
    setEmployeeSearch("");
    onClose();
  };

  const assignableRoles = (rolesData?.data?.content || []).filter(
    (role) => role.isActive !== false && !["PLATFORM_ADMIN", "PLATFORM_STAFF"].includes(role.name),
  );
  const roleOptions = assignableRoles.map((role) => ({
    label: role.name + (role.isSystem ? " (Hệ thống)" : ""),
    value: role.id,
  }));
  const revokeRoleId = useWatch({ control, name: "revokeRoleId" });
  const roleId = useWatch({ control, name: "roleId" });
  const revokeRoleOptions = roleOptions.filter((option) => option.value !== roleId);

  // Roles attach to a user ACCOUNT — an employee record with no linked account (userId is
  // null) cannot be assigned one. Filtering them out is what fixes both the "undefined —
  // email" labels and the bulk-assign silently doing nothing (an undefined value in the
  // multi-select fails the zod string check with no visible error). #11
  const employeeOptions = (employeesData?.content || [])
    .filter((employee) => Boolean(employee.userId))
    .map((employee) => ({
      value: employee.userId as string,
      label: `${getEmployeeDisplayName(employee) || "(chưa có tên)"} — ${employee.email || "không có email"}`,
    }));

  const onSubmit = async (values: BulkAssignFormValues) => {
    try {
      const response = await bulkAssign.mutateAsync({
        tenantId,
        roleId: values.roleId,
        revokeRoleId: values.revokeRoleId || undefined,
        userIds: values.userIds,
      });
      setResult(response.data);
      const data = response.data;
      if (data.failureCount === 0) {
        message.success(`Đã gán role cho ${data.successCount} người thành công`);
      } else {
        message.warning(`Thành công ${data.successCount}/${data.successCount + data.failureCount} người — xem chi tiết bên dưới`);
      }
    } catch (error: unknown) {
      message.error(getApiErrorMessage(error, "Không thể gán role hàng loạt"));
    }
  };

  const employeesById = new Map((employeesData?.content || []).map((e) => [e.userId, e]));

  return (
    <BaseModal
        title="Gán Role Hàng Loạt"
        isOpen={open}
        onClose={closeModal}
        centered
        width={560}
        confirmText={result ? "Đóng" : "Gán role"}
        cancelText={result ? undefined : "Hủy"}
        onConfirm={result ? closeModal : undefined}
        confirmLoading={bulkAssign.isPending}
        confirmButtonProps={result ? { onClick: closeModal } : { onClick: handleSubmit(onSubmit) }}
        cancelButtonProps={{ disabled: bulkAssign.isPending, className: result ? "hidden" : "" }}
      >
        {result ? (
          <div className="space-y-3">
            <Alert
              showIcon
              type={result.failureCount === 0 ? "success" : "warning"}
              title={`Hoàn tất: ${result.successCount} thành công, ${result.failureCount} thất bại`}
            />
            <List
              size="small"
              bordered
              dataSource={result.results}
              renderItem={(item) => {
                const employee = employeesById.get(item.userId);
                return (
                  <List.Item>
                    <div className="flex w-full items-center justify-between gap-2">
                      <span>{(employee && getEmployeeDisplayName(employee)) || item.userId}</span>
                      {item.success ? (
                        <Tag color="success" icon={<CheckCircleFilled />}>Thành công</Tag>
                      ) : (
                        <span className="text-right">
                          <Tag color="error" icon={<CloseCircleFilled />}>Lỗi</Tag>
                          <div className="text-xs text-slate-400">{item.message}</div>
                        </span>
                      )}
                    </div>
                  </List.Item>
                );
              }}
            />
          </div>
        ) : (
          <Form layout="vertical" className="mt-2">
            <Alert
              className="mb-4"
              type="info"
              showIcon
              title="Chuyển nhiều người cùng lúc"
              description="Chọn role muốn gán, tùy chọn thêm role cũ muốn thu hồi (VD: chuyển mọi người từ EMPLOYEE sang role mới), rồi chọn danh sách nhân viên. Một người lỗi (VD: đã có role) không ảnh hưởng những người còn lại."
            />
            <Controller
              name="roleId"
              control={control}
              render={({ field, fieldState }) => (
                <Form.Item label="Role cần gán" required validateStatus={fieldState.error ? "error" : ""} help={fieldState.error?.message}>
                  <BaseSelect {...field} placeholder="-- Chọn role --" options={roleOptions} loading={isLoadingRoles} showSearch optionFilterProp="label" />
                </Form.Item>
              )}
            />
            <Controller
              name="revokeRoleId"
              control={control}
              render={({ field }) => (
                <Form.Item label="Đồng thời thu hồi role cũ (tùy chọn)">
                  <BaseSelect {...field} allowClear placeholder="-- Không thu hồi role nào --" options={revokeRoleOptions} loading={isLoadingRoles} showSearch optionFilterProp="label" />
                </Form.Item>
              )}
            />
            {revokeRoleId && (
              <Alert
                className="mb-4"
                type="warning"
                showIcon
                title={`Mỗi người trong danh sách bên dưới sẽ bị thu hồi role "${roleOptions.find((o) => o.value === revokeRoleId)?.label}" trước khi được gán role mới.`}
              />
            )}
            <Controller
              name="userIds"
              control={control}
              render={({ field, fieldState }) => (
                <Form.Item label="Nhân viên (chọn nhiều)" required validateStatus={fieldState.error ? "error" : ""} help={fieldState.error?.message}>
                  <BaseSelect
                    {...field}
                    mode="multiple"
                    showSearch
                    filterOption={false}
                    onSearch={setEmployeeSearch}
                    loading={isSearchingEmployees}
                    placeholder="Gõ tên để tìm nhân viên"
                    notFoundContent={debouncedEmployeeSearch.length < 1 ? "Nhập tên để tìm" : "Không tìm thấy"}
                    options={employeeOptions}
                  />
                </Form.Item>
              )}
            />
          </Form>
        )}
    </BaseModal>
  );
};
