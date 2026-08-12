"use client";

import { useMemo, useState } from "react";
import { Alert, App, AutoComplete, Form, Input, Modal, Select, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { Braces, Edit3, Languages, MessageSquareText, Plus, Trash2 } from "lucide-react";
import ContentCard from "@/components/shared/layout/ContentCard";
import DataTable from "@/components/tables/DataTable";
import { BaseButton } from "@/components/ui";
import { SystemRole } from "@/features/customer/auth/types/auth.type";
import { useAuthStore } from "@/stores/auth.store";
import {
  useCreateNotificationTemplate,
  useDeleteNotificationTemplate,
  useNotificationEventTypes,
  useNotificationTemplates,
  useUpdateNotificationTemplate,
} from "../hooks/use-notification";
import type { NotificationTemplate, NotificationTemplatePayload } from "../types/notification.type";

const LOCALES = [
  { value: "vi", label: "Tiếng Việt (vi)" },
  { value: "en", label: "English (en)" },
];

const VARIABLES: Record<string, string[]> = {
  RANDOM_CHECK_SENT: ["checkId", "siteId", "expiresAt"],
};

const SAMPLE_VALUES: Record<string, string> = {
  checkId: "rc-20260806-001",
  siteId: "site-hanoi-01",
  expiresAt: "14:30 06/08/2026",
};

function errorMessage(error: unknown) {
  const response = (error as { response?: { status?: number; data?: { message?: string } } })?.response;
  if (response?.status === 409) return "Đã tồn tại template cùng loại sự kiện và ngôn ngữ.";
  if (response?.status === 403) return "Bạn không có quyền quản lý template thông báo của công ty này.";
  return response?.data?.message || "Không thể lưu template thông báo.";
}

function renderPreview(value?: string) {
  if (!value) return "Nội dung xem trước sẽ hiển thị tại đây.";
  return value.replace(/\{([^{}]+)\}/g, (token, name: string) => SAMPLE_VALUES[name] ?? token);
}

export default function NotificationTemplateManagementPage() {
  const { message, modal } = App.useApp();
  const user = useAuthStore((state) => state.user);
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const tenantId = user?.tenantId || "";
  const canManage = user?.role === SystemRole.PLATFORM_ADMIN
    || hasPermission("notifications:manage")
    || hasPermission("tenant:admin");
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [editing, setEditing] = useState<NotificationTemplate | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm<NotificationTemplatePayload>();
  const eventType = Form.useWatch("eventType", form);
  const titleTemplate = Form.useWatch("titleTemplate", form);
  const bodyTemplate = Form.useWatch("bodyTemplate", form);
  const templatesQuery = useNotificationTemplates(tenantId, page, size);
  const eventTypesQuery = useNotificationEventTypes();
  const createMutation = useCreateNotificationTemplate();
  const updateMutation = useUpdateNotificationTemplate();
  const deleteMutation = useDeleteNotificationTemplate();
  const isSaving = createMutation.isPending || updateMutation.isPending;

  const eventOptions = useMemo(
    () => (eventTypesQuery.data || []).map((item) => ({ value: item.eventType, label: `${item.label} (${item.eventType})` })),
    [eventTypesQuery.data],
  );

  const openCreate = () => {
    setEditing(null);
    form.setFieldsValue({ eventType: "RANDOM_CHECK_SENT", locale: "vi", titleTemplate: "", bodyTemplate: "" });
    setModalOpen(true);
  };

  const openEdit = (template: NotificationTemplate) => {
    setEditing(template);
    form.setFieldsValue({
      eventType: template.eventType,
      locale: template.locale,
      titleTemplate: template.titleTemplate,
      bodyTemplate: template.bodyTemplate,
    });
    setModalOpen(true);
  };

  const save = async () => {
    const values = await form.validateFields();
    try {
      if (editing) {
        await updateMutation.mutateAsync({ tenantId, templateId: editing.id, payload: values });
        message.success("Đã cập nhật template. Nội dung mới áp dụng từ lần gửi tiếp theo.");
      } else {
        await createMutation.mutateAsync({ tenantId, payload: values });
        message.success("Đã tạo template. Không cần thao tác kích hoạt thêm.");
      }
      setModalOpen(false);
      form.resetFields();
    } catch (error) {
      message.error(errorMessage(error));
    }
  };

  const confirmDelete = (template: NotificationTemplate) => {
    modal.confirm({
      title: "Xóa template thông báo?",
      content: `Sau khi xóa, ${template.eventType}/${template.locale} sẽ quay về nội dung mặc định của hệ thống.`,
      okText: "Xóa template",
      okButtonProps: { danger: true },
      cancelText: "Hủy",
      async onOk() {
        try {
          await deleteMutation.mutateAsync({ tenantId, templateId: template.id });
          message.success("Đã xóa template và khôi phục nội dung mặc định.");
        } catch (error) {
          message.error(errorMessage(error));
        }
      },
    });
  };

  const columns: ColumnsType<NotificationTemplate> = [
    {
      title: "Loại sự kiện",
      dataIndex: "eventType",
      width: 240,
      render: (value: string) => <code className="text-xs font-semibold text-blue-700">{value}</code>,
    },
    {
      title: "Ngôn ngữ",
      dataIndex: "locale",
      width: 120,
      render: (value: string) => <Tag icon={<Languages className="h-3 w-3" />}>{value.toUpperCase()}</Tag>,
    },
    {
      title: "Tiêu đề",
      dataIndex: "titleTemplate",
      width: 260,
      ellipsis: true,
    },
    {
      title: "Nội dung",
      dataIndex: "bodyTemplate",
      width: 380,
      ellipsis: true,
    },
    {
      title: "Cập nhật",
      dataIndex: "updatedAt",
      width: 170,
      render: (value: string) => dayjs(value).format("DD/MM/YYYY HH:mm"),
    },
    {
      title: "Thao tác",
      key: "actions",
      fixed: "right",
      width: 180,
      render: (_, template) => (
        <div className="flex gap-1">
          <BaseButton type="link" icon={<Edit3 className="h-4 w-4" />} onClick={() => openEdit(template)}>Sửa</BaseButton>
          <BaseButton type="link" danger icon={<Trash2 className="h-4 w-4" />} onClick={() => confirmDelete(template)}>Xóa</BaseButton>
        </div>
      ),
    },
  ];

  if (!tenantId) {
    return <Alert showIcon type="warning" title="Chưa chọn công ty" description="Hãy chuyển sang công ty cần cấu hình trước khi quản lý template thông báo." />;
  }

  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-bold text-slate-900 sm:text-3xl">
            <MessageSquareText className="h-7 w-7 text-blue-600" /> Mẫu thông báo
          </h1>
          <p className="mt-1 text-sm text-slate-500">Cấu hình nội dung theo loại sự kiện và ngôn ngữ của công ty.</p>
        </div>
        <BaseButton icon={<Plus className="h-4 w-4" />} disabled={!canManage} onClick={openCreate}>Tạo template</BaseButton>
      </div>

      <Alert
        showIcon
        type="info"
        title="Template có hiệu lực ngay lần gửi tiếp theo"
        description="Hệ thống chọn template khớp event type và locale của công ty. Nếu không có template phù hợp hoặc template bị xóa, nội dung mặc định vẫn được gửi bình thường."
      />

      <ContentCard className="space-y-3 p-5">
        <div className="flex items-start gap-3">
          <Braces className="mt-0.5 h-5 w-5 text-violet-600" />
          <div>
            <p className="font-semibold text-slate-800">Biến khả dụng</p>
            <p className="mt-1 text-sm text-slate-500">
              <code>RANDOM_CHECK_SENT</code>: <code>{"{checkId}"}</code>, <code>{"{siteId}"}</code>, <code>{"{expiresAt}"}</code>. Biến không có trong metadata sẽ được giữ nguyên để dễ phát hiện cấu hình sai.
            </p>
          </div>
        </div>
      </ContentCard>

      {templatesQuery.isError && <Alert showIcon type="error" title="Không thể tải template" description={errorMessage(templatesQuery.error)} />}
      <DataTable
        ariaLabel="Danh sách template thông báo"
        columns={columns}
        data={templatesQuery.data?.content || []}
        loading={templatesQuery.isLoading || templatesQuery.isFetching}
        totalElements={templatesQuery.data?.totalElements || 0}
        currentPage={page}
        pageSize={size}
        onPageChange={(nextPage, nextSize) => { setPage(nextPage); setSize(nextSize); }}
        emptyTitle="Chưa có template tùy chỉnh"
        emptyDescription="Thông báo hiện dùng nội dung mặc định của hệ thống."
        scroll={{ x: 1300 }}
      />

      <Modal
        title={editing ? "Cập nhật template" : "Tạo template thông báo"}
        open={modalOpen}
        width={820}
        okText={editing ? "Lưu thay đổi" : "Tạo template"}
        cancelText="Hủy"
        confirmLoading={isSaving}
        onOk={() => void save()}
        onCancel={() => { setModalOpen(false); form.resetFields(); }}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" className="pt-3">
          <div className="grid gap-4 sm:grid-cols-2">
            <Form.Item name="eventType" label="Loại sự kiện" rules={[{ required: true, whitespace: true, message: "Nhập loại sự kiện" }]}>
              <AutoComplete options={eventOptions} placeholder="Ví dụ RANDOM_CHECK_SENT" filterOption={(input, option) => String(option?.label || "").toLowerCase().includes(input.toLowerCase())} />
            </Form.Item>
            <Form.Item name="locale" label="Ngôn ngữ" rules={[{ required: true, message: "Chọn ngôn ngữ" }]}>
              <Select options={LOCALES} />
            </Form.Item>
          </div>
          <Form.Item name="titleTemplate" label="Tiêu đề" rules={[{ required: true, whitespace: true, message: "Nhập tiêu đề" }]}>
            <Input maxLength={255} showCount placeholder="Kiểm tra ngẫu nhiên tại {siteId}" />
          </Form.Item>
          <Form.Item name="bodyTemplate" label="Nội dung" rules={[{ required: true, whitespace: true, message: "Nhập nội dung" }]}>
            <Input.TextArea rows={5} showCount placeholder="Vui lòng phản hồi trước {expiresAt}." />
          </Form.Item>
          <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-blue-700">Xem trước với dữ liệu mẫu</p>
            <p className="mt-2 font-semibold text-slate-900">{renderPreview(titleTemplate)}</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">{renderPreview(bodyTemplate)}</p>
            {eventType && !VARIABLES[eventType] && <p className="mt-3 text-xs text-amber-700">Backend chưa công bố danh sách biến cho event type này. Hãy chỉ dùng biến đã xác nhận trong metadata thực tế.</p>}
          </div>
        </Form>
      </Modal>
    </div>
  );
}
