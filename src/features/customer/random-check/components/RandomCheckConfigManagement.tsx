"use client";

import { useMemo, useState } from "react";
import { Alert, App, Card, Empty, Space, Spin, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import Link from "next/link";
import { Building2, Edit3, ExternalLink, Plus, Trash2 } from "lucide-react";
import BaseButton from "@/components/ui/BaseButton";
import DataTable from "@/components/tables/DataTable";
import { useAuthStore } from "@/stores/auth.store";
import { useSitesQuery } from "@/features/customer/site/hooks/use-site";
import {
  useDeleteRandomCheckConfig,
  useRandomCheckConfigs,
} from "../hooks/use-random-check";
import type { RandomCheckConfigResponse } from "../types";
import RandomCheckConfigFormModal from "./RandomCheckConfigFormModal";
import RandomCheckConfigSummary from "./RandomCheckConfigSummary";

export default function RandomCheckConfigManagement() {
  const { message, modal } = App.useApp();
  const tenantId = useAuthStore((state) => state.user?.tenantId) || "";
  const [editing, setEditing] = useState<RandomCheckConfigResponse | null>(null);
  const [creatingDefault, setCreatingDefault] = useState(false);
  const { data: configs, isLoading, isError, error } = useRandomCheckConfigs(tenantId);
  const { data: sitePage } = useSitesQuery({
    tenantId,
    page: 0,
    size: 100,
    sortBy: "name",
    sortDir: "asc",
  });
  const remove = useDeleteRandomCheckConfig();
  const sites = useMemo(() => sitePage?.data?.content ?? [], [sitePage?.data?.content]);
  const siteNames = useMemo(
    () => new Map(sites.map((site) => [site.id, site.name])),
    [sites],
  );
  const tenantDefault = configs?.find((config) => !config.siteId);
  const overrides = configs?.filter((config) => Boolean(config.siteId)) ?? [];

  const confirmDelete = (config: RandomCheckConfigResponse) => {
    modal.confirm({
      title: config.siteId
        ? "Xóa cấu hình riêng của công trình?"
        : "Xóa cấu hình mặc định công ty?",
      content: config.siteId
        ? "Công trình sẽ tự động quay về cấu hình mặc định công ty nếu cấu hình mặc định đang tồn tại."
        : "Các công trình có override riêng vẫn tiếp tục dùng override; các công trình còn lại sẽ không được sinh random check.",
      okText: "Xóa cấu hình",
      okButtonProps: { danger: true },
      cancelText: "Hủy",
      onOk: async () => {
        try {
          await remove.mutateAsync({ tenantId, configId: config.id });
          message.success("Đã xóa cấu hình kiểm tra ngẫu nhiên.");
        } catch (deleteError: unknown) {
          message.error(
            (deleteError as { response?: { data?: { message?: string } } }).response
              ?.data?.message || "Không thể xóa cấu hình.",
          );
          throw deleteError;
        }
      },
    });
  };

  const columns: ColumnsType<RandomCheckConfigResponse> = [
    {
      title: "Công trình",
      key: "site",
      render: (_, record) => siteNames.get(record.siteId || "") || record.siteId,
    },
    {
      title: "Mode",
      dataIndex: "checkMode",
      key: "checkMode",
      render: (value) => (
        <Tag color={value === "location_only" ? "blue" : value === "location_face" ? "purple" : "magenta"}>
          {value}
        </Tag>
      ),
    },
    {
      title: "Tần suất",
      key: "frequency",
      render: (_, record) => `${record.checksPerShift} lần/ca · cách ${record.minIntervalMinutes}p`,
    },
    {
      title: "Khung giờ",
      key: "window",
      render: (_, record) => record.windowMode === "full_shift"
        ? "Toàn bộ từng ca"
        : record.allowedStartTime && record.allowedEndTime
          ? `${record.allowedStartTime.slice(0, 5)}–${record.allowedEndTime.slice(0, 5)}`
          : "Chưa cấu hình",
    },
    {
      title: "Trạng thái",
      dataIndex: "active",
      key: "active",
      render: (active) => <Tag color={active ? "success" : "default"}>{active ? "Bật" : "Tắt"}</Tag>,
    },
    {
      title: "Thao tác",
      key: "actions",
      fixed: "right",
      render: (_, record) => (
        <Space>
          <BaseButton size="small" icon={<Edit3 className="h-4 w-4" />} onClick={() => setEditing(record)}>
            Sửa
          </BaseButton>
          <Link href={`/customer/sites/${record.siteId}`}>
            <BaseButton size="small" icon={<ExternalLink className="h-4 w-4" />}>Mở site</BaseButton>
          </Link>
          <BaseButton size="small" danger icon={<Trash2 className="h-4 w-4" />} onClick={() => confirmDelete(record)}>
            Xóa
          </BaseButton>
        </Space>
      ),
    },
  ];

  if (isLoading) {
    return <div className="flex justify-center py-16"><Spin size="large" /></div>;
  }

  return (
    <div className="space-y-6">
      <Alert
        type="info"
        showIcon
        title="Hai tầng cấu hình, không merge từng field"
        description="Site override ghi đè toàn bộ policy mặc định. Nếu xóa override, site tự quay về cấu hình mặc định công ty. Random check chỉ là tín hiệu audit và không tự trừ công/lương."
      />

      {isError && (
        <Alert
          type="error"
          showIcon
          title="Không thể tải cấu hình"
          description={(error as { response?: { data?: { message?: string } } }).response?.data?.message || "Vui lòng thử lại."}
        />
      )}

      <Card
        title={<span className="flex items-center gap-2"><Building2 className="h-5 w-5 text-blue-600" />Cấu hình mặc định công ty</span>}
        extra={tenantDefault ? (
          <Space>
            <BaseButton icon={<Edit3 className="h-4 w-4" />} onClick={() => setEditing(tenantDefault)}>Sửa</BaseButton>
            <BaseButton danger icon={<Trash2 className="h-4 w-4" />} onClick={() => confirmDelete(tenantDefault)}>Xóa</BaseButton>
          </Space>
        ) : (
          <BaseButton type="primary" icon={<Plus className="h-4 w-4" />} onClick={() => setCreatingDefault(true)}>
            Tạo cấu hình mặc định
          </BaseButton>
        )}
      >
        {tenantDefault ? (
          <RandomCheckConfigSummary config={tenantDefault} />
        ) : (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Chưa có policy mặc định; site không có override sẽ không được kiểm tra ngẫu nhiên."
          />
        )}
      </Card>

      <Card
        title="Cấu hình riêng theo công trình"
        extra={<span className="text-sm text-slate-500">Tạo mới trong tab Random Check tại chi tiết công trình</span>}
      >
        <DataTable
          ariaLabel="Danh sách cấu hình random check theo công trình"
          columns={columns}
          data={overrides}
          showPagination={false}
          emptyTitle="Chưa có site override"
          emptyDescription="Các công trình hiện dùng cấu hình mặc định công ty."
          scroll={{ x: 1000 }}
        />
      </Card>

      <RandomCheckConfigFormModal
        tenantId={tenantId}
        scope="tenant_default"
        open={creatingDefault}
        onClose={() => setCreatingDefault(false)}
        onSaved={() => message.success("Đã tạo cấu hình mặc định công ty.")}
      />
      {editing && (
        <RandomCheckConfigFormModal
          tenantId={tenantId}
          siteId={editing.siteId || undefined}
          scope={editing.siteId ? "site_override" : "tenant_default"}
          config={editing}
          open
          onClose={() => setEditing(null)}
          onSaved={() => message.success("Đã cập nhật cấu hình.")}
        />
      )}
    </div>
  );
}
