"use client";

import React, { useState } from "react";
import { Alert, App, Avatar, Form, List, Tag } from "antd";
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
import { BadgeCheck, Mail, UserRound } from "lucide-react";

const bulkAssignSchema = z.object({
  roleId: z.string().min(1, "Vui lòng chọn vai trò cần gán"),
  revokeRoleId: z.string().optional(),
  userIds: z.array(z.string()).min(1, "Vui lòng chọn ít nhất một nhân viên"),
});

type BulkAssignFormValues = z.infer<typeof bulkAssignSchema>;

interface BulkAssignRoleModalProps {
  open: boolean;
  onClose: () => void;
  tenantId: string;
}

const SYSTEM_ROLE_LABELS: Record<string, string> = {
  TENANT_ADMIN: "Quản trị công ty",
  HR_MANAGER: "Quản lý nhân sự",
  SITE_SUPERVISOR: "Giám sát công trường",
  EMPLOYEE: "Nhân viên",
};

function formatBulkRoleError(rawMessage: string | null | undefined): string {
  if (!rawMessage) return "Không thể gán vai trò cho nhân viên này.";
  const duplicate = rawMessage.match(/already has role\s+([^\s]+)\s+in this tenant/i);
  if (duplicate) {
    const roleName = duplicate[1];
    return `Nhân viên đã có vai trò \"${SYSTEM_ROLE_LABELS[roleName] ?? roleName}\" trong công ty này.`;
  }
  return rawMessage;
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
    label: (SYSTEM_ROLE_LABELS[role.name] ?? role.name) + (role.isSystem ? " (Hệ thống)" : ""),
    value: role.id,
  }));
  const revokeRoleId = useWatch({ control, name: "revokeRoleId" });
  const roleId = useWatch({ control, name: "roleId" });
  const revokeRoleOptions = roleOptions.filter((option) => option.value !== roleId);

  // Roles attach to a user ACCOUNT — an employee record with no linked account (userId is
  // null) cannot be assigned one. Filtering them out is what fixes both the "undefined —
  // email" labels and the bulk-assign silently doing nothing (an undefined value in the
  // multi-select fails the zod string check with no visible error). #11
  const selectableEmployees = (employeesData?.content || [])
    .filter((employee) => Boolean(employee.userId));
  const employeesByUserId = new Map(selectableEmployees.map((employee) => [employee.userId as string, employee]));
  const employeeOptions = selectableEmployees
    .map((employee) => ({
      value: employee.userId as string,
      label: getEmployeeDisplayName(employee) || "Nhân viên chưa có tên",
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
        message.success(`Đã gán vai trò cho ${data.successCount} người thành công`);
      } else {
        message.warning(`Thành công ${data.successCount}/${data.successCount + data.failureCount} người — xem chi tiết bên dưới`);
      }
    } catch (error: unknown) {
      message.error(getApiErrorMessage(error, "Không thể gán vai trò hàng loạt"));
    }
  };

  const employeesById = new Map((employeesData?.content || []).map((e) => [e.userId, e]));

  return (
    <BaseModal
        title="Gán vai trò hàng loạt"
        isOpen={open}
        onClose={closeModal}
        centered
        width={560}
        confirmText={result ? "Đóng" : "Gán vai trò"}
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
                          <div className="text-xs text-slate-500">{formatBulkRoleError(item.message)}</div>
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
              description="Chọn vai trò muốn gán, có thể chọn thêm vai trò cũ cần thu hồi, rồi chọn danh sách nhân viên. Một người đã có vai trò không ảnh hưởng những người còn lại."
            />
            <Controller
              name="roleId"
              control={control}
              render={({ field, fieldState }) => (
                <Form.Item label="Vai trò cần gán" required validateStatus={fieldState.error ? "error" : ""} help={fieldState.error?.message}>
                  <BaseSelect {...field} placeholder="-- Chọn vai trò --" options={roleOptions} loading={isLoadingRoles} showSearch optionFilterProp="label" />
                </Form.Item>
              )}
            />
            <Controller
              name="revokeRoleId"
              control={control}
              render={({ field }) => (
                <Form.Item label="Đồng thời thu hồi vai trò cũ (tùy chọn)">
                  <BaseSelect {...field} allowClear placeholder="-- Không thu hồi vai trò nào --" options={revokeRoleOptions} loading={isLoadingRoles} showSearch optionFilterProp="label" />
                </Form.Item>
              )}
            />
            {revokeRoleId && (
              <Alert
                className="mb-4"
                type="warning"
                showIcon
                title={`Mỗi người trong danh sách bên dưới sẽ bị thu hồi vai trò "${roleOptions.find((o) => o.value === revokeRoleId)?.label}" trước khi được gán vai trò mới.`}
              />
            )}
            <Controller
              name="userIds"
              control={control}
              render={({ field, fieldState }) => (
                <Form.Item
                  label="Nhân viên áp dụng"
                  required
                  validateStatus={fieldState.error ? "error" : ""}
                  help={fieldState.error?.message || (field.value.length > 0
                    ? `Đã chọn ${field.value.length} nhân viên`
                    : "Có thể tìm theo tên, email hoặc mã nhân viên")}
                >
                  <BaseSelect
                    {...field}
                    mode="multiple"
                    showSearch
                    filterOption={false}
                    onSearch={setEmployeeSearch}
                    loading={isSearchingEmployees}
                    placeholder="Tìm và chọn nhân viên"
                    notFoundContent={isSearchingEmployees
                      ? "Đang tìm nhân viên..."
                      : debouncedEmployeeSearch.length < 1
                        ? "Nhập tên, email hoặc mã nhân viên"
                        : "Không tìm thấy nhân viên phù hợp"}
                    options={employeeOptions}
                    maxTagCount="responsive"
                    maxTagPlaceholder={(omittedValues) => `+${omittedValues.length} nhân viên`}
                    listHeight={320}
                    optionRender={(option) => {
                      const employee = employeesByUserId.get(String(option.value));
                      if (!employee) return option.label;
                      const displayName = getEmployeeDisplayName(employee) || "Nhân viên chưa có tên";
                      const selected = field.value.includes(employee.userId as string);
                      return (
                        <div className="flex min-w-0 items-center gap-3 py-1.5">
                          <Avatar className="shrink-0 bg-blue-50 text-blue-700" icon={<UserRound className="h-4 w-4" />} />
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-semibold text-slate-800">{displayName}</div>
                            <div className="mt-0.5 flex min-w-0 items-center gap-1.5 truncate text-xs text-slate-500">
                              <Mail className="h-3.5 w-3.5 shrink-0" />
                              <span className="truncate">{employee.email || "Chưa có email"}</span>
                              {employee.employeeCode && <span className="shrink-0">· {employee.employeeCode}</span>}
                            </div>
                          </div>
                          {selected && <BadgeCheck className="h-5 w-5 shrink-0 text-blue-600" aria-label="Đã chọn" />}
                        </div>
                      );
                    }}
                    tagRender={({ label, closable, onClose }) => (
                      <Tag
                        color="blue"
                        closable={closable}
                        onClose={onClose}
                        onMouseDown={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                        }}
                        className="my-0.5 max-w-[220px] rounded-full px-2.5 py-0.5"
                      >
                        <span className="block truncate">{label}</span>
                      </Tag>
                    )}
                    className="!h-auto min-h-12 [&_.ant-select-selector]:!h-auto [&_.ant-select-selector]:!min-h-12 [&_.ant-select-selector]:!items-start [&_.ant-select-selection-overflow]:gap-1 [&_.ant-select-selection-overflow]:py-1.5"
                  />
                </Form.Item>
              )}
            />
          </Form>
        )}
    </BaseModal>
  );
};
