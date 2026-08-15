"use client";

import React, { useEffect, useState } from "react";
import { Alert, Form, message } from "antd";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { BaseModal, BaseSelect } from "@/components/ui";
import { useTransferOwner } from "../hooks/use-tenant";
import { useEmployees } from "@/features/customer/employee/hooks/use-employee";
import { useDebounce } from "@/hooks/useDebounce";
import { getApiErrorMessage } from "@/utils/api-error.util";
import { useTenantStore } from "@/stores/tenant.store";
import type { Tenant, TenantOperationalDetail } from "../types/tenant.type";

const transferOwnerSchema = z.object({
  newOwnerUserId: z.string().min(1, "Vui lòng chọn người nhận quyền chủ sở hữu"),
});

type TransferOwnerFormValues = z.infer<typeof transferOwnerSchema>;

interface TransferOwnerModalProps {
  open: boolean;
  onClose: () => void;
  tenant: Tenant | TenantOperationalDetail;
  tenantId: string;
}

export const TransferOwnerModal: React.FC<TransferOwnerModalProps> = ({ open, onClose, tenant, tenantId }) => {
  const [messageApi, contextHolder] = message.useMessage();
  const transferOwner = useTransferOwner();
  const setActiveTenant = useTenantStore((state) => state.setActiveTenant);
  const [employeeSearch, setEmployeeSearch] = useState("");
  const debouncedSearch = useDebounce(employeeSearch, 300);

  const { data: employeesData, isFetching } = useEmployees(
    { search: debouncedSearch, size: 50, sortBy: "fullName", sortDir: "asc" },
    { enabled: open },
  );

  const { control, handleSubmit, reset } = useForm<TransferOwnerFormValues>({
    resolver: zodResolver(transferOwnerSchema),
    defaultValues: { newOwnerUserId: "" },
  });

  useEffect(() => {
    if (open) {
      reset({ newOwnerUserId: "" });
      setEmployeeSearch("");
    }
  }, [open, reset]);

  const selectedUserId = useWatch({ control, name: "newOwnerUserId" });
  // Chủ sở hữu hiện tại không thể tự chuyển cho chính mình.
  const employeeOptions = (employeesData?.content || [])
    .filter((e) => e.userId !== tenant.ownerId)
    .map((e) => ({ value: e.userId, label: `${e.fullName} — ${e.email || "không có email"}` }));
  const selectedLabel = employeeOptions.find((o) => o.value === selectedUserId)?.label;

  const onSubmit = async (values: TransferOwnerFormValues) => {
    try {
      const updated = await transferOwner.mutateAsync({
        payload: { newOwnerUserId: values.newOwnerUserId },
        id: tenantId,
      });
      messageApi.success("Đã chuyển quyền chủ sở hữu — bạn sẽ không còn quản trị được hồ sơ công ty này nữa.");
      setActiveTenant(updated);
      onClose();
    } catch (error: unknown) {
      messageApi.error(getApiErrorMessage(error, "Không thể chuyển quyền chủ sở hữu"));
    }
  };

  return (
    <>
      {contextHolder}
      <BaseModal
        title="Chuyển quyền chủ sở hữu công ty"
        isOpen={open}
        onClose={onClose}
        centered
        width={520}
        confirmText="Xác nhận chuyển"
        cancelText="Hủy"
        confirmLoading={transferOwner.isPending}
        confirmButtonProps={{ danger: true, onClick: handleSubmit(onSubmit) }}
        cancelButtonProps={{ disabled: transferOwner.isPending }}
      >
        <Alert
          className="mb-4"
          type="warning"
          showIcon
          title="Hành động không thể tự hoàn tác"
          description="Sau khi chuyển, bạn sẽ MẤT quyền sửa hồ sơ công ty, cấu hình hiển thị, IP whitelist và xem thông tin gói/billing — chỉ chủ sở hữu MỚI mới làm được các việc này. Bạn vẫn giữ nguyên các quyền khác đang có (VD role TENANT_ADMIN nếu đang giữ). Chỉ chủ sở hữu mới hoặc Platform Admin mới chuyển lại được sau đó."
        />
        <Form layout="vertical">
          <Controller
            name="newOwnerUserId"
            control={control}
            render={({ field, fieldState }) => (
              <Form.Item
                label="Chuyển cho ai (phải là nhân viên đang có trong công ty)"
                required
                validateStatus={fieldState.error ? "error" : ""}
                help={fieldState.error?.message}
              >
                <BaseSelect
                  {...field}
                  showSearch
                  filterOption={false}
                  onSearch={setEmployeeSearch}
                  loading={isFetching}
                  placeholder="Gõ tên nhân viên để tìm"
                  notFoundContent={debouncedSearch.length < 1 ? "Nhập tên để tìm" : "Không tìm thấy"}
                  options={employeeOptions}
                />
              </Form.Item>
            )}
          />
          {selectedLabel && (
            <Alert type="info" showIcon title={`Sẽ chuyển quyền chủ sở hữu cho: ${selectedLabel}`} />
          )}
        </Form>
      </BaseModal>
    </>
  );
};
