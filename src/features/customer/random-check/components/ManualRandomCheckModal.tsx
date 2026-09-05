"use client";

import { Alert, Form, Input, Select } from "antd";
import dayjs from "dayjs";
import BaseModal from "@/components/ui/BaseModal";
import { useEffectiveRandomCheckConfig } from "../hooks/use-random-check";
import { useManualCheckCandidates, useTriggerManualCheck } from "../hooks/use-scheduled-check";
import type { ManualCheckPayload, RandomCheckMode, ScheduledCheckResponse } from "../types";

interface Props {
  tenantId: string;
  sites: Array<{ id: string; name: string }>;
  initialSiteId?: string;
  open: boolean;
  onClose: () => void;
  onCreated: (check: ScheduledCheckResponse) => void;
}

function getErrorMessage(error: unknown) {
  const data = (error as {
    response?: { data?: { userMessage?: string; message?: string } };
  }).response?.data;
  return data?.userMessage || data?.message || "Không thể gửi kiểm tra thủ công.";
}

export default function ManualRandomCheckModal({
  tenantId,
  sites,
  initialSiteId,
  open,
  onClose,
  onCreated,
}: Props) {
  const [form] = Form.useForm<ManualCheckPayload>();
  const siteId = Form.useWatch("siteId", form) || "";
  const selectedMode = Form.useWatch("checkMode", form) as RandomCheckMode | undefined;
  const candidates = useManualCheckCandidates(tenantId, siteId, Boolean(open && siteId));
  const effectiveConfig = useEffectiveRandomCheckConfig(tenantId, siteId, Boolean(open && siteId));
  const trigger = useTriggerManualCheck();

  const employeeOptions = (candidates.data ?? []).map((candidate) => ({
    value: candidate.employeeId,
    label: `${candidate.employeeName}${candidate.employeeCode ? ` (${candidate.employeeCode})` : ""} · ${candidate.shiftName || "Ca làm"} · vào ${dayjs(candidate.checkInAt).format("HH:mm")}`,
  }));

  const mode = selectedMode || effectiveConfig.data?.checkMode;

  const submit = async (values: ManualCheckPayload) => {
    try {
      const response = await trigger.mutateAsync({
        tenantId,
        payload: {
          siteId: values.siteId,
          employeeId: values.employeeId,
          reason: values.reason.trim(),
          checkMode: values.checkMode || undefined,
        },
      });
      onCreated(response.data);
      onClose();
    } catch {
      // Render mutation error below.
    }
  };

  return (
    <BaseModal
      title="Gửi kiểm tra ngẫu nhiên ngay"
      isOpen={open}
      onClose={() => {
        trigger.reset();
        form.resetFields();
        onClose();
      }}
      onConfirm={() => form.submit()}
      confirmText="Gửi kiểm tra ngay"
      confirmLoading={trigger.isPending}
      width={640}
    >
      <div className="space-y-4">
        <Alert
          type="warning"
          showIcon
          title="Đây là kiểm tra nhắm đích danh"
          description="Thao tác chủ động bỏ qua bộ lọc vai trò. Lý do được lưu để audit và hệ thống chỉ gửi khi nhân viên đang có phiên chấm công mở tại đúng công trình."
        />
        {trigger.isError && (
          <Alert type="error" showIcon title="Không thể gửi kiểm tra" description={getErrorMessage(trigger.error)} />
        )}
        {siteId && candidates.isError && (
          <Alert type="error" showIcon title="Không thể tải người đang có mặt" description={getErrorMessage(candidates.error)} />
        )}
        <Form
          form={form}
          layout="vertical"
          onFinish={submit}
          initialValues={{ siteId: initialSiteId }}
        >
          <Form.Item label="Công trình" name="siteId" rules={[{ required: true, message: "Chọn công trình." }]}>
            <Select
              showSearch
              optionFilterProp="label"
              options={sites.map((site) => ({ value: site.id, label: site.name }))}
              onChange={() => {
                form.setFieldValue("employeeId", undefined);
              }}
            />
          </Form.Item>
          {siteId && effectiveConfig.isError && (
            <Alert
              className="mb-4"
              type="error"
              showIcon
              title="Site chưa có policy hiệu lực"
              description="Hãy tạo tenant-default hoặc site override trước khi gửi kiểm tra thủ công."
            />
          )}
          <Form.Item label="Nhân viên đang có mặt và được phép kiểm tra" name="employeeId" rules={[{ required: true, message: "Chọn nhân viên." }]}>
            <Select
              showSearch
              optionFilterProp="label"
              loading={candidates.isLoading}
              disabled={!siteId}
              options={employeeOptions}
              placeholder={siteId ? "Chọn nhân viên đang check-in" : "Chọn công trình trước"}
              notFoundContent="Không có nhân viên đang check-in và đủ điều kiện tại công trình"
            />
          </Form.Item>
          <Form.Item label="Mode cho lần kiểm tra này" name="checkMode" extra="Để trống để dùng mode của policy hiệu lực tại site.">
            <Select
              allowClear
              placeholder={effectiveConfig.data ? `Theo policy: ${effectiveConfig.data.checkMode}` : "Theo policy hiệu lực"}
              options={[
                { value: "location_only", label: "Chỉ GPS" },
                { value: "location_face", label: "GPS + Face ID" },
                { value: "location_face_liveness", label: "GPS + Face ID + Liveness" },
              ]}
            />
          </Form.Item>
          {mode && mode !== "location_only" && (
            <Alert
              className="mb-4"
              type="info"
              showIcon
              title="Mode yêu cầu Face ID đã enrolled"
              description={selectedMode
                ? "Bạn đang chọn mode Face ID rõ ràng; nhân viên không có hồ sơ hợp lệ có thể phát sinh face_fail."
                : "Nếu mode được kế thừa từ policy mà nhân viên chưa có Face ID hợp lệ, backend sẽ hạ an toàn về chỉ GPS."}
            />
          )}
          <Form.Item
            label="Lý do kiểm tra"
            name="reason"
            rules={[
              { required: true, whitespace: true, message: "Nhập lý do kiểm tra." },
              { max: 500, message: "Lý do tối đa 500 ký tự." },
            ]}
          >
            <Input.TextArea rows={4} maxLength={500} showCount placeholder="Nêu dấu hiệu/rủi ro hoặc căn cứ cần kiểm tra đột xuất..." />
          </Form.Item>
        </Form>
      </div>
    </BaseModal>
  );
}
