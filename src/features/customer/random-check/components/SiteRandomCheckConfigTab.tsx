"use client";

import { useState } from "react";
import { Alert, App, Empty, Spin, Tag } from "antd";
import { Edit3, Plus, Trash2 } from "lucide-react";
import BaseButton from "@/components/ui/BaseButton";
import {
  useDeleteRandomCheckConfig,
  useEffectiveRandomCheckConfig,
  useSiteRandomCheckOverride,
} from "../hooks/use-random-check";
import RandomCheckConfigFormModal from "./RandomCheckConfigFormModal";
import RandomCheckConfigSummary from "./RandomCheckConfigSummary";

interface Props {
  tenantId?: string;
  siteId: string;
}

export default function SiteRandomCheckConfigTab({ tenantId, siteId }: Props) {
  const { message, modal } = App.useApp();
  const [formOpen, setFormOpen] = useState(false);
  const effective = useEffectiveRandomCheckConfig(tenantId, siteId);
  const override = useSiteRandomCheckOverride(tenantId, siteId);
  const remove = useDeleteRandomCheckConfig();
  const ownConfig = override.data;
  const displayedConfig = ownConfig || effective.data;
  const effectiveNotFound = (effective.error as { response?: { status?: number } } | null)?.response?.status === 404;

  const deleteOverride = () => {
    if (!tenantId || !ownConfig) return;
    modal.confirm({
      title: "Xóa cấu hình riêng của công trình?",
      content: "Sau khi xóa, công trình tự quay về policy mặc định công ty. Lịch đã sinh trước đây không bị thay đổi.",
      okText: "Xóa override",
      okButtonProps: { danger: true },
      cancelText: "Hủy",
      onOk: async () => {
        await remove.mutateAsync({ tenantId, configId: ownConfig.id });
        message.success("Đã xóa override; công trình dùng lại policy mặc định.");
      },
    });
  };

  if (effective.isLoading || override.isLoading) {
    return <div className="flex justify-center py-12"><Spin /></div>;
  }

  return (
    <div className="space-y-4">
      <Alert
        type={ownConfig ? "success" : effective.data ? "info" : "warning"}
        showIcon
        title={ownConfig ? "Công trình đang có policy riêng" : effective.data ? "Đang kế thừa policy mặc định công ty" : "Công trình chưa được áp dụng random check"}
        description={ownConfig
          ? "Override là policy hoàn chỉnh và ghi đè toàn bộ cấu hình mặc định."
          : effective.data
            ? "Tạo override nếu công trình có mức rủi ro hoặc yêu cầu kiểm soát khác policy chung."
            : "Tenant chưa có mặc định và site chưa có override; hệ thống sẽ không sinh lịch kiểm tra cho site này."}
        action={displayedConfig ? (
          <Tag color={ownConfig ? "purple" : "blue"}>
            {ownConfig ? "SITE OVERRIDE" : "TENANT DEFAULT"}
          </Tag>
        ) : undefined}
      />

      {effective.isError && !effectiveNotFound && (
        <Alert type="error" showIcon title="Không thể tải policy hiệu lực" description="Kiểm tra quyền site-scope hoặc thử lại." />
      )}

      {displayedConfig ? (
        <RandomCheckConfigSummary config={displayedConfig} />
      ) : (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có cấu hình kiểm tra ngẫu nhiên" />
      )}

      <div className="flex flex-wrap justify-end gap-2">
        {ownConfig ? (
          <>
            <BaseButton icon={<Edit3 className="h-4 w-4" />} onClick={() => setFormOpen(true)}>Sửa policy riêng</BaseButton>
            <BaseButton danger icon={<Trash2 className="h-4 w-4" />} onClick={deleteOverride} loading={remove.isPending}>Xóa override</BaseButton>
          </>
        ) : (
          <BaseButton type="primary" icon={<Plus className="h-4 w-4" />} onClick={() => setFormOpen(true)}>
            Tùy chỉnh riêng cho site
          </BaseButton>
        )}
      </div>

      {tenantId && (
        <RandomCheckConfigFormModal
          tenantId={tenantId}
          siteId={siteId}
          scope="site_override"
          config={ownConfig}
          seedConfig={!ownConfig ? effective.data : undefined}
          open={formOpen}
          onClose={() => setFormOpen(false)}
          onSaved={() => message.success(ownConfig ? "Đã cập nhật policy riêng." : "Đã tạo policy riêng cho công trình.")}
        />
      )}
    </div>
  );
}
