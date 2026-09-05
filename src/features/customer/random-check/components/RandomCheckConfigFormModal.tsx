"use client";

import { useEffect } from "react";
import { Alert, Form, InputNumber, Select, Switch, TimePicker } from "antd";
import dayjs, { type Dayjs } from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import BaseModal from "@/components/ui/BaseModal";
import {
  useCreateSiteRandomCheckOverride,
  useCreateTenantDefaultRandomCheckConfig,
  useUpdateRandomCheckConfig,
} from "../hooks/use-random-check";
import type {
  RandomCheckConfigPayload,
  RandomCheckConfigResponse,
  RandomCheckMode,
  RandomCheckWindowMode,
} from "../types";

dayjs.extend(customParseFormat);

type ConfigScope = "tenant_default" | "site_override";

interface FormValues {
  checksPerShift: number;
  minIntervalMinutes: number;
  allowedStartTime?: Dayjs;
  allowedEndTime?: Dayjs;
  windowMode: RandomCheckWindowMode;
  checkMode: RandomCheckMode;
  applicableRoles: string[];
  responseWindowSeconds: number;
  failureEscalationThreshold: number;
  active?: boolean;
  allRoles: boolean;
  manualChecksAllowed: boolean;
}

interface Props {
  tenantId: string;
  siteId?: string;
  scope: ConfigScope;
  config?: RandomCheckConfigResponse | null;
  seedConfig?: RandomCheckConfigResponse | null;
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

const defaultValues: FormValues = {
  checksPerShift: 2,
  minIntervalMinutes: 60,
  allowedStartTime: dayjs("08:00", "HH:mm"),
  allowedEndTime: dayjs("17:00", "HH:mm"),
  windowMode: "full_shift",
  checkMode: "location_only",
  applicableRoles: [],
  responseWindowSeconds: 300,
  failureEscalationThreshold: 3,
  active: true,
  allRoles: true,
  manualChecksAllowed: true,
};

function validTimeOrFallback(value: Dayjs | undefined, fallback: Dayjs): Dayjs {
  return dayjs.isDayjs(value) && value.isValid() ? value : fallback;
}

function parseConfigTime(value: string | undefined, fallback: Dayjs): Dayjs {
  if (!value) return fallback;
  const parsed = dayjs(value, ["HH:mm:ss", "HH:mm"], true);
  return parsed.isValid() ? parsed : fallback;
}

function backendMessage(error: unknown) {
  const data = (error as {
    response?: { data?: { userMessage?: string; message?: string } };
  }).response?.data;
  return data?.userMessage || data?.message || "Không thể lưu cấu hình.";
}

export default function RandomCheckConfigFormModal({
  tenantId,
  siteId,
  scope,
  config,
  seedConfig,
  open,
  onClose,
  onSaved,
}: Props) {
  const [form] = Form.useForm<FormValues>();
  const checkMode = Form.useWatch("checkMode", form) || "location_only";
  const allRoles = Form.useWatch("allRoles", form) ?? true;
  const windowMode = Form.useWatch("windowMode", form) || "full_shift";
  const createTenantDefault = useCreateTenantDefaultRandomCheckConfig();
  const createSiteOverride = useCreateSiteRandomCheckOverride();
  const update = useUpdateRandomCheckConfig();

  const mutation = config
    ? update
    : scope === "tenant_default"
      ? createTenantDefault
      : createSiteOverride;

  useEffect(() => {
    if (!open) return;
    const source = config || seedConfig;
    const values = source
      ? {
          checksPerShift: source.checksPerShift,
          minIntervalMinutes: source.minIntervalMinutes,
          allowedStartTime: parseConfigTime(
            source.allowedStartTime,
            defaultValues.allowedStartTime!,
          ),
          allowedEndTime: parseConfigTime(
            source.allowedEndTime,
            defaultValues.allowedEndTime!,
          ),
          windowMode: source.windowMode || "full_shift",
          checkMode: source.checkMode,
          applicableRoles: source.applicableRoles,
          responseWindowSeconds: source.responseWindowSeconds,
          failureEscalationThreshold: source.failureEscalationThreshold,
          active: source.active,
          allRoles: source.applicableRoles.length === 0,
          manualChecksAllowed: source.manualChecksAllowed ?? true,
        }
      : defaultValues;
    form.resetFields();
    form.setFieldsValue(values);
  }, [config, form, open, seedConfig]);

  const submit = async (values: FormValues) => {
    const effectiveWindowMode = values.windowMode || "full_shift";
    const hasValidStart =
      dayjs.isDayjs(values.allowedStartTime) && values.allowedStartTime.isValid();
    const hasValidEnd =
      dayjs.isDayjs(values.allowedEndTime) && values.allowedEndTime.isValid();
    const hasValidCustomWindow = hasValidStart && hasValidEnd;

    if (effectiveWindowMode === "custom_window" && !hasValidCustomWindow) {
      form.setFields([
        ...(!hasValidStart
          ? [{ name: "allowedStartTime" as const, errors: ["Chọn giờ bắt đầu."] }]
          : []),
        ...(!hasValidEnd
          ? [{ name: "allowedEndTime" as const, errors: ["Chọn giờ kết thúc."] }]
          : []),
      ]);
      return;
    }

    // full_shift does not use this custom window for scheduling, but the database contract
    // keeps both fields non-null for backwards compatibility. Hidden TimePicker fields may be
    // omitted by Ant Form, so send stable harmless defaults instead of calling .format on
    // undefined. custom_window never falls back silently because it was validated above.
    const startTime = validTimeOrFallback(
      values.allowedStartTime,
      defaultValues.allowedStartTime!,
    );
    const endTime = validTimeOrFallback(
      values.allowedEndTime,
      defaultValues.allowedEndTime!,
    );
    const payload: RandomCheckConfigPayload = {
      checksPerShift: values.checksPerShift,
      minIntervalMinutes: values.minIntervalMinutes,
      allowedStartTime: startTime.format("HH:mm"),
      allowedEndTime: endTime.format("HH:mm"),
      windowMode: effectiveWindowMode,
      checkMode: values.checkMode,
      applicableRoles: values.allRoles ? [] : values.applicableRoles,
      responseWindowSeconds: values.responseWindowSeconds,
      failureEscalationThreshold: values.failureEscalationThreshold,
      manualChecksAllowed: values.manualChecksAllowed,
    };

    try {
      if (config) {
        await update.mutateAsync({
          tenantId,
          configId: config.id,
          payload: { ...payload, isActive: values.active },
        });
      } else if (scope === "tenant_default") {
        await createTenantDefault.mutateAsync({ tenantId, payload });
      } else if (siteId) {
        await createSiteOverride.mutateAsync({ tenantId, siteId, payload });
      }
      onSaved?.();
      onClose();
    } catch {
      // Error state is rendered below with the normalized Backend message.
    }
  };

  const error = mutation.error;

  return (
    <BaseModal
      title={
        config
          ? "Sửa cấu hình kiểm tra ngẫu nhiên"
          : scope === "tenant_default"
            ? "Tạo cấu hình mặc định công ty"
            : "Tạo cấu hình riêng cho công trình"
      }
      isOpen={open}
      onClose={() => {
        mutation.reset();
        onClose();
      }}
      onConfirm={() => form.submit()}
      confirmText={config ? "Lưu cấu hình" : "Tạo cấu hình"}
      confirmLoading={mutation.isPending}
      width={760}
    >
      <div className="space-y-4">
        {scope === "site_override" && !config && seedConfig && (
          <Alert
            type="info"
            showIcon
            title="Đã sao chép cấu hình đang áp dụng"
            description="Override là một cấu hình hoàn chỉnh, không merge từng field. Hãy kiểm tra lại toàn bộ giá trị trước khi tạo."
          />
        )}
        {error && (
          <Alert
            type="error"
            showIcon
            title="Không thể lưu cấu hình"
            description={backendMessage(error)}
          />
        )}

        <Form
          form={form}
          layout="vertical"
          onFinish={submit}
          className="grid gap-x-4 sm:grid-cols-2"
        >
          <Form.Item
            label="Số lần kiểm tra mỗi ca"
            name="checksPerShift"
            rules={[{ required: true }, { type: "number", min: 1, max: 10 }]}
          >
            <InputNumber min={1} max={10} className="w-full" />
          </Form.Item>
          <Form.Item
            label="Khoảng cách tối thiểu (phút)"
            name="minIntervalMinutes"
            rules={[{ required: true }, { type: "number", min: 0 }]}
          >
            <InputNumber min={0} className="w-full" />
          </Form.Item>
          <Form.Item
            className="sm:col-span-2"
            label="Phạm vi thời gian kiểm tra"
            name="windowMode"
            rules={[{ required: true }]}
            extra="Nên dùng toàn bộ ca để ca sáng, chiều và đêm đều được kiểm tra theo đúng giờ làm."
          >
            <Select options={[
              { value: "full_shift", label: "Toàn bộ thời gian của từng ca (khuyến nghị)" },
              { value: "custom_window", label: "Chỉ trong một khung giờ tùy chỉnh" },
            ]} />
          </Form.Item>
          {windowMode === "custom_window" && <>
            <Form.Item
              label="Bắt đầu khung giờ"
              name="allowedStartTime"
              rules={[{ required: true, message: "Chọn giờ bắt đầu." }]}
            >
              <TimePicker format="HH:mm" minuteStep={5} className="w-full" />
            </Form.Item>
            <Form.Item
              label="Kết thúc khung giờ"
              name="allowedEndTime"
              dependencies={["allowedStartTime", "checksPerShift", "minIntervalMinutes"]}
              rules={[
                { required: true, message: "Chọn giờ kết thúc." },
                ({ getFieldValue }) => ({
                  validator(_, end: Dayjs | undefined) {
                    const start = getFieldValue("allowedStartTime") as Dayjs | undefined;
                    const checks = getFieldValue("checksPerShift") as number | undefined;
                    const interval = getFieldValue("minIntervalMinutes") as number | undefined;
                    if (!start || !end || checks == null || interval == null) return Promise.resolve();
                    const raw = end.diff(start, "minute");
                    const available = raw > 0 ? raw : raw + 24 * 60;
                    const required = (checks - 1) * interval;
                    return available < required
                      ? Promise.reject(new Error(`Khung giờ cần tối thiểu ${required} phút cho ${checks} lần kiểm tra.`))
                      : Promise.resolve();
                  },
                }),
              ]}
            >
              <TimePicker format="HH:mm" minuteStep={5} className="w-full" />
            </Form.Item>
          </>}
          <div className="sm:col-span-2 -mt-2 mb-4 text-xs text-slate-500">
            {windowMode === "full_shift"
              ? "Hệ thống phân bổ đủ số lượt trong chính thời gian từng ca, bao gồm ca qua đêm."
              : "Backend kiểm tra từng ca; cấu hình bị từ chối nếu một ca không giao hoặc không đủ chỗ cho số lượt, trừ ca đã được tắt kiểm tra rõ ràng."}
          </div>

          <Form.Item
            className="sm:col-span-2"
            label="Phương thức xác minh"
            name="checkMode"
            rules={[{ required: true }]}
          >
            <Select
              options={[
                { value: "location_only", label: "Chỉ GPS — xác nhận trong geofence" },
                { value: "location_face", label: "GPS + Face ID — xác nhận đúng người" },
                { value: "location_face_liveness", label: "GPS + Face ID + Liveness — chống ảnh/video giả" },
              ]}
            />
          </Form.Item>
          {checkMode !== "location_only" && (
            <Alert
              className="sm:col-span-2 mb-4"
              type="warning"
              showIcon
              title="Nhân viên phải đăng ký Face ID trước"
              description="Nhân viên chưa có Face ID hợp lệ sẽ được hạ an toàn về chỉ GPS cho lượt tự động, tránh tạo vi phạm oan."
            />
          )}

          <Form.Item label="Thời gian phản hồi (giây)" name="responseWindowSeconds" rules={[{ required: true }, { type: "number", min: 30 }]}>
            <InputNumber min={30} step={30} className="w-full" />
          </Form.Item>
          <Form.Item
            label="Ngưỡng cảnh báo trong tháng"
            name="failureEscalationThreshold"
            extra="Chỉ tạo tín hiệu để HR xem xét, không tự trừ công/lương."
            rules={[{ required: true }, { type: "number", min: 1 }]}
          >
            <InputNumber min={1} className="w-full" />
          </Form.Item>

          <Form.Item className="sm:col-span-2" label="Đối tượng áp dụng">
            <div className="mb-3 flex items-center gap-3">
              <Form.Item name="allRoles" valuePropName="checked" noStyle>
                <Switch
                  onChange={(checked) => {
                    if (checked) form.setFieldValue("applicableRoles", []);
                  }}
                />
              </Form.Item>
              <span>Áp dụng cho tất cả vai trò tại công trình</span>
            </div>
          </Form.Item>
          {!allRoles && (
            <Form.Item
              className="sm:col-span-2 -mt-4"
              label="Vai trò tại site"
              name="applicableRoles"
              rules={[{ required: true, message: "Chọn ít nhất một vai trò." }]}
              extra="Đây là vai trò trong phân công công trình, không phải role RBAC của tài khoản."
            >
              <Select
                mode="multiple"
                options={[
                  { value: "worker", label: "Nhân viên hiện trường (worker)" },
                  { value: "supervisor", label: "Giám sát công trình (supervisor)" },
                ]}
              />
            </Form.Item>
          )}

          {config && (
            <Form.Item
              className="sm:col-span-2"
              label="Đang áp dụng"
              name="active"
              valuePropName="checked"
              extra="Tắt sẽ dừng lịch tự động tại phạm vi này. Site override tạm dừng không tự fallback để tránh bật ngoài ý muốn."
            >
              <Switch />
            </Form.Item>
          )}
          <Form.Item
            className="sm:col-span-2"
            label="Cho phép HR kiểm tra thủ công ngay"
            name="manualChecksAllowed"
            valuePropName="checked"
            extra="Độc lập với lịch tự động; chỉ gửi được cho nhân viên đang có phiên chấm công mở."
          >
            <Switch />
          </Form.Item>
        </Form>
      </div>
    </BaseModal>
  );
}
