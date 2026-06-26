"use client";

import { useState } from "react";
import { Plus, Trash2, Globe } from "lucide-react";
import { Switch, Popconfirm, message, Modal } from "antd";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import DataTable from "@/components/tables/DataTable";
import BaseButton from "@/components/ui/BaseButton";
import FormInput from "@/components/forms/FormInput";
import { useIpWhitelists, useAddIpWhitelist, useUpdateIpWhitelist, useDeleteIpWhitelist } from "../hooks/use-tenant";
import { createIpWhitelistSchema, type CreateIpWhitelistFormData } from "../schemas/tenant.schema";
import type { IpWhitelistResponse } from "../types/tenant.type";
import { format } from "date-fns";

export default function IpWhitelistTable({ tenantId }: { tenantId?: string }) {
  const { data: list, isLoading } = useIpWhitelists(tenantId);
  const { mutateAsync: addIp } = useAddIpWhitelist();
  const { mutate: updateIp } = useUpdateIpWhitelist();
  const { mutateAsync: deleteIp } = useDeleteIpWhitelist();

  const [isModalOpen, setIsModalOpen] = useState(false);

  const { control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<CreateIpWhitelistFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(createIpWhitelistSchema) as any,
    defaultValues: { ipAddress: "", label: "", scope: "global" }
  });

  const handleAdd = async (data: CreateIpWhitelistFormData) => {
    try {
      await addIp({ payload: data, id: tenantId });
      message.success("Thêm IP thành công");
      reset();
      setIsModalOpen(false);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      message.error(err.response?.data?.message || "Lỗi khi thêm IP");
    }
  };

  const handleToggleActive = (record: IpWhitelistResponse, checked: boolean) => {
    updateIp(
      { entryId: record.id, payload: { isActive: checked }, id: tenantId },
      {
        onSuccess: () => message.success(`Đã ${checked ? 'bật' : 'tắt'} IP ${record.ipAddress}`),
        onError: () => message.error("Cập nhật thất bại")
      }
    );
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteIp({ entryId: id, id: tenantId });
      message.success("Xóa IP thành công");
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      message.error(err.response?.data?.message || "Lỗi khi xóa IP");
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
      title: "Nhãn (Label)",
      dataIndex: "label",
      key: "label",
      render: (text: string) => text || "---",
    },
    {
      title: "Trạng thái",
      key: "isActive",
      render: (_: unknown, record: IpWhitelistResponse) => (
        <Switch 
          checked={record.isActive} 
          onChange={(checked) => handleToggleActive(record, checked)} 
        />
      ),
    },
    {
      title: "Ngày thêm",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (dateStr: string) => format(new Date(dateStr), "dd/MM/yyyy HH:mm"),
    },
    {
      title: "Thao tác",
      key: "actions",
      render: (_: unknown, record: IpWhitelistResponse) => (
        <Popconfirm
          title="Xóa địa chỉ IP"
          description={`Bạn có chắc chắn muốn xóa IP ${record.ipAddress} khỏi danh sách trắng?`}
          onConfirm={() => handleDelete(record.id)}
          okText="Xóa"
          cancelText="Hủy"
          okButtonProps={{ danger: true }}
        >
          <BaseButton size="small" danger icon={<Trash2 className="h-4 w-4" />} />
        </Popconfirm>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-brand-800">
          <Globe className="h-5 w-5 text-brand-500" />
          <h3 className="text-lg font-semibold">Danh sách IP được phép truy cập (Whitelist)</h3>
        </div>
        <BaseButton 
          type="primary" 
          icon={<Plus className="h-4 w-4" />}
          onClick={() => setIsModalOpen(true)}
          className="bg-brand-600"
        >
          Thêm IP
        </BaseButton>
      </div>
      
      <p className="text-sm text-brand-600">
        Chỉ những người dùng truy cập từ các địa chỉ IP có trong danh sách này mới có thể đăng nhập vào hệ thống.
        Nếu danh sách trống, hệ thống sẽ không giới hạn IP.
      </p>

      <DataTable
        columns={columns}
        data={list || []}
        loading={isLoading}
        totalElements={list?.length || 0}
        currentPage={0}
        pageSize={100}
        onPageChange={() => {}}
      />

      <Modal
        title="Thêm địa chỉ IP vào Whitelist"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        destroyOnHidden
      >
        <form onSubmit={handleSubmit(handleAdd)} className="space-y-4 pt-4">
          <FormInput
            control={control}
            name="ipAddress"
            label="Địa chỉ IP (hoặc dải CIDR)"
            placeholder="Ví dụ: 192.168.1.1 hoặc 10.0.0.0/24"
            error={errors.ipAddress}
            required
          />
          <FormInput
            control={control}
            name="label"
            label="Mô tả/Nhãn"
            placeholder="Ví dụ: Văn phòng chính"
            error={errors.label}
          />
          
          <div className="flex justify-end gap-3 pt-4 border-t border-brand-100">
            <BaseButton onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>Hủy</BaseButton>
            <BaseButton type="primary" htmlType="submit" loading={isSubmitting} className="bg-brand-600">
              Lưu địa chỉ IP
            </BaseButton>
          </div>
        </form>
      </Modal>
    </div>
  );
}
