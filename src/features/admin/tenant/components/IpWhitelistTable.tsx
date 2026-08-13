"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, App, Modal, Popconfirm, Switch, Tag } from "antd";
import { format } from "date-fns";
import { Globe, Plus, Trash2 } from "lucide-react";
import DataTable from "@/components/tables/DataTable";
import BaseButton from "@/components/ui/BaseButton";
import BaseSelect from "@/components/ui/BaseSelect";
import FormInput from "@/components/forms/FormInput";
import ContentCard from "@/components/shared/layout/ContentCard";
import { useRolesQuery } from "@/features/admin/role-permission/hooks/use-role-permission";
import {
  useAddIpWhitelist,
  useDeleteIpWhitelist,
  useIpWhitelists,
  useUpdateIpWhitelist,
} from "../hooks/use-tenant";
import { createIpWhitelistSchema, type CreateIpWhitelistFormData } from "../schemas/tenant.schema";
import type { IpWhitelistResponse } from "../types/tenant.type";

function errorMessage(error: unknown, fallback: string) {
  const response = (error as {
    response?: { data?: { userMessage?: string; message?: string } };
  }).response;
  return response?.data?.userMessage || response?.data?.message || fallback;
}

export default function IpWhitelistTable({
  tenantId,
  canManage = true,
}: {
  tenantId?: string;
  canManage?: boolean;
}) {
  const { message } = App.useApp();
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data: pageData, isLoading, error } = useIpWhitelists(tenantId, page, size);
  const list = pageData?.content || [];
  const activeCount = list.filter((entry) => entry.isActive).length;
  const { mutateAsync: addIp } = useAddIpWhitelist();
  const { mutateAsync: updateIp, isPending: isUpdating } = useUpdateIpWhitelist();
  const { mutateAsync: deleteIp, isPending: isDeleting } = useDeleteIpWhitelist();
  // System roles + this tenant's own custom roles — the full set an entry can be scoped to.
  const { data: rolesData } = useRolesQuery({ tenantId, isActive: true, size: 100 });
  const roleOptions = (rolesData?.data?.content || []).map((role) => ({
    value: role.name,
    label: role.name,
  }));

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateIpWhitelistFormData>({
    resolver: zodResolver(createIpWhitelistSchema),
    defaultValues: { ipAddress: "", label: "", applicableRoleNames: [] },
  });

  const handleAdd = async (data: CreateIpWhitelistFormData) => {
    try {
      await addIp({ payload: data, id: tenantId });
      message.success("Đã thêm mạng được phép truy cập");
      reset({ ipAddress: "", label: "", applicableRoleNames: [] });
      setIsModalOpen(false);
    } catch (submitError: unknown) {
      message.error(errorMessage(submitError, "Không thể thêm địa chỉ IP."));
    }
  };

  const handleToggleActive = async (record: IpWhitelistResponse, checked: boolean) => {
    try {
      await updateIp({ entryId: record.id, payload: { isActive: checked }, id: tenantId });
      message.success(`Đã ${checked ? "bật" : "tắt"} ${record.ipAddress}`);
    } catch (submitError: unknown) {
      // Self-lockout guard returns a precise recovery instruction; preserve it verbatim.
      message.error(errorMessage(submitError, "Không thể cập nhật địa chỉ IP."));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteIp({ entryId: id, id: tenantId });
      message.success("Đã xóa địa chỉ IP");
    } catch (submitError: unknown) {
      message.error(errorMessage(submitError, "Không thể xóa địa chỉ IP."));
    }
  };

  const columns = [
    {
      title: "Địa chỉ IP / CIDR",
      dataIndex: "ipAddress",
      key: "ipAddress",
      render: (text: string) => <span className="font-mono text-brand-700">{text}</span>,
    },
    {
      title: "Nhãn",
      dataIndex: "label",
      key: "label",
      render: (text: string) => text || "—",
    },
    {
      title: "Áp dụng cho role",
      dataIndex: "applicableRoleNames",
      key: "applicableRoleNames",
      render: (roleNames: string[]) =>
        !roleNames || roleNames.length === 0 ? (
          <Tag>Tất cả role</Tag>
        ) : (
          <div className="flex flex-wrap gap-1">
            {roleNames.map((name) => (
              <Tag key={name} color="blue">{name}</Tag>
            ))}
          </div>
        ),
    },
    {
      title: "Đang áp dụng",
      key: "isActive",
      render: (_: unknown, record: IpWhitelistResponse) => canManage ? (
        <Switch
          aria-label={`Bật hoặc tắt ${record.ipAddress}`}
          checked={record.isActive}
          loading={isUpdating}
          onChange={(checked) => void handleToggleActive(record, checked)}
        />
      ) : (record.isActive ? "Có" : "Không"),
    },
    {
      title: "Ngày thêm",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (dateStr: string) => format(new Date(dateStr), "dd/MM/yyyy HH:mm"),
    },
    ...(canManage ? [{
      title: "Thao tác",
      key: "actions",
      render: (_: unknown, record: IpWhitelistResponse) => (
        <Popconfirm
          title="Xóa địa chỉ IP"
          description={`Xóa ${record.ipAddress}? Backend sẽ chặn nếu thao tác khiến IP hiện tại của bạn bị khóa.`}
          onConfirm={() => handleDelete(record.id)}
          okText="Xóa"
          cancelText="Hủy"
          okButtonProps={{ danger: true, loading: isDeleting }}
        >
          <BaseButton aria-label={`Xóa ${record.ipAddress}`} size="small" danger icon={<Trash2 className="h-4 w-4" />} />
        </Popconfirm>
      ),
    }] : []),
  ];

  if (error) {
    return (
      <Alert
        showIcon
        type="error"
        title="Không tải được danh sách IP"
        description={errorMessage(error, "Vui lòng tải lại trang hoặc thử lại sau.")}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2 text-brand-800">
          <Globe className="h-5 w-5 text-brand-500" aria-hidden="true" />
          <h3 className="text-lg font-semibold">Danh sách IP được phép truy cập</h3>
        </div>
        {canManage && (
          <BaseButton
            type="primary"
            icon={<Plus className="h-4 w-4" />}
            onClick={() => setIsModalOpen(true)}
          >
            Thêm IP hoặc mạng
          </BaseButton>
        )}
      </div>

      {activeCount > 0 ? (
        <Alert
          showIcon
          type="warning"
          title="Whitelist đang được áp dụng"
          description="Chỉ các địa chỉ IP/mạng trong danh sách đang bật mới truy cập được API/hệ thống. Hãy chắc chắn IP hiện tại của bạn nằm trong danh sách trước khi rời trang này."
        />
      ) : (
        <Alert
          showIcon
          type="info"
          title="Chưa giới hạn theo IP"
          description="Khi không có entry active, mọi địa chỉ IP đều có thể truy cập. Whitelist bắt đầu được enforce ngay khi có ít nhất một entry active."
        />
      )}

      <ContentCard noPadding>
        <DataTable
          columns={columns}
          data={list}
          loading={isLoading}
          totalElements={pageData?.totalElements || 0}
          currentPage={pageData?.page || page}
          pageSize={pageData?.size || size}
          onPageChange={(nextPage, nextSize) => {
            setPage(nextSize === size ? nextPage : 0);
            setSize(nextSize);
          }}
          ariaLabel="Danh sách IP whitelist"
          emptyTitle="Chưa giới hạn IP"
          emptyDescription="Thêm IP hoặc CIDR để bắt đầu giới hạn truy cập."
        />
      </ContentCard>

      {canManage && (
        <Modal
          title="Thêm IP hoặc mạng được phép"
          open={isModalOpen}
          onCancel={() => setIsModalOpen(false)}
          footer={null}
          destroyOnHidden
        >
          <form onSubmit={handleSubmit(handleAdd)} className="space-y-4 pt-4">
            <FormInput
              control={control}
              name="ipAddress"
              label="Địa chỉ IP hoặc CIDR"
              placeholder="192.168.1.15 hoặc 10.0.0.0/24"
              error={errors.ipAddress}
              required
            />
            <FormInput
              control={control}
              name="label"
              label="Nhãn"
              placeholder="Văn phòng chính"
              error={errors.label}
            />
            <div>
              <label htmlFor="ip-roles" className="mb-2 block text-sm font-medium text-slate-700">
                Áp dụng cho role
              </label>
              <Controller
                name="applicableRoleNames"
                control={control}
                render={({ field }) => (
                  <BaseSelect
                    {...field}
                    id="ip-roles"
                    mode="multiple"
                    allowClear
                    placeholder="Để trống = áp dụng cho mọi role"
                    options={roleOptions}
                  />
                )}
              />
              <p className="mt-1 text-xs text-slate-500">
                Để trống nếu muốn giới hạn IP cho TẤT CẢ role. Chọn cụ thể (VD: Company Admin, HR)
                nếu chỉ muốn giới hạn nhóm quản trị/văn phòng — nhân viên hiện trường (không được
                chọn) vẫn check-in được từ bất kỳ đâu.
              </p>
            </div>

            <Alert
              type="warning"
              showIcon
              title="Tránh tự khóa truy cập"
              description="Nếu entry này áp dụng cho role của chính bạn, entry active đầu tiên phải bao phủ IP hiện tại của bạn. Backend sẽ từ chối thay đổi không an toàn."
            />

            <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
              <BaseButton onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>Hủy</BaseButton>
              <BaseButton type="primary" htmlType="submit" loading={isSubmitting}>
                Lưu địa chỉ IP
              </BaseButton>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
