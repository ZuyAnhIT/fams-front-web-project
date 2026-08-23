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
import { useShiftsQuery } from "@/features/customer/shift/hooks/use-shift";
import type {
  RandomCheckConfigPayload,
  RandomCheckConfigResponse,
  RandomCheckMode,
} from "../types";

dayjs.extend(customParseFormat);

type ConfigScope = "tenant_default" | "site_override";

interface FormValues {
  checksPerShift: number;
  minIntervalMinutes: number;
  allowedStartTime: Dayjs;
  allowedEndTime: Dayjs;
  checkMode: RandomCheckMode;
  applicableRoles: string[];
  responseWindowSeconds: number;
  failureEscalationThreshold: number;
  active?: boolean;
  allRoles: boolean;
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
  checkMode: "location_only",
  applicableRoles: [],
  responseWindowSeconds: 300,
  failureEscalationThreshold: 3,
  active: true,
  allRoles: true,
};

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
  const createTenantDefault = useCreateTenantDefaultRandomCheckConfig();
  const createSiteOverride = useCreateSiteRandomCheckOverride();
  const update = useUpdateRandomCheckConfig();

  // Found via support case (2026-08-22): a tenant set a site's allowed window to 15:00-17:00 while
  // the site's only shift ran 14:25-14:35 — zero overlap. Nothing errored anywhere; the backend
  // deliberately intersects the config window with each assignment's actual shift hours when
  // generating checks, so the config silently generated nothing, forever, indistinguishable from
  // the feature being broken. Only relevant for a site-scoped config (a tenant-wide default is
  // deliberately shift-agnostic — no single shift to validate against).
  const shiftsQuery = useShiftsQuery(
    scope === "site_override" ? tenantId : undefined,
    siteId ?? "",
    { status: "active", size: 100 },
  );
  const comparableShifts = (shiftsQuery.data?.content ?? []).filter((s) => !s.allowOvernight);

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
          allowedStartTime: dayjs(source.allowedStartTime, "HH:mm:ss"),
          allowedEndTime: dayjs(source.allowedEndTime, "HH:mm:ss"),
          checkMode: source.checkMode,
          applicableRoles: source.applicableRoles,
          responseWindowSeconds: source.responseWindowSeconds,
          failureEscalationThreshold: source.failureEscalationThreshold,
          active: source.active,
          allRoles: source.applicableRoles.length === 0,
        }
      : defaultValues;
    form.setFieldsValue(values);
  }, [config, form, open, seedConfig]);

  const submit = async (values: FormValues) => {
    const payload: RandomCheckConfigPayload = {
      checksPerShift: values.checksPerShift,
      minIntervalMinutes: values.minIntervalMinutes,
      allowedStartTime: values.allowedStartTime.format("HH:mm"),
      allowedEndTime: values.allowedEndTime.format("HH:mm"),
      checkMode: values.checkMode,
      applicableRoles: values.allRoles ? [] : values.applicableRoles,
      responseWindowSeconds: values.responseWindowSeconds,
      failureEscalationThreshold: values.failureEscalationThreshold,
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
                  if (!start || !end || checks == null || interval == null) {
                    return Promise.resolve();
                  }
                  const available = end.diff(start, "minute");
                  if (available <= 0) {
                    return Promise.reject(new Error("Giờ kết thúc phải sau giờ bắt đầu."));
                  }
                  const required = (checks - 1) * interval;
                  if (available < required) {
                    return Promise.reject(
                        new Error(`Khung giờ cần tối thiểu ${required} phút cho ${checks} lần kiểm tra.`),
                      );
                  }

                  if (scope === "site_override" && comparableShifts.length > 0) {
                    const overlapsAny = comparableShifts.some((shift) => {
                      const shiftStart = dayjs(shift.startTime, "HH:mm");
                      const shiftEnd = dayjs(shift.endTime, "HH:mm");
                      return start.isBefore(shiftEnd) && end.isAfter(shiftStart);
                    });
                    if (!overlapsAny) {
                      const summary = comparableShifts
                        .map((s) => `"${s.name}" (${s.startTime}–${s.endTime})`)
                        .join(", ");
                      return Promise.reject(
                        new Error(
                          `Khung giờ này không trùng với bất kỳ ca làm nào tại công trình: ${summary}. Kiểm tra ngẫu nhiên sẽ không bao giờ được tạo — hãy chỉnh khung giờ hoặc giờ ca cho trùng nhau.`,
                        ),
                      );
                    }
                  }
                  return Promise.resolve();
                },
              }),
            ]}
          >
            <TimePicker format="HH:mm" minuteStep={5} className="w-full" />
          </Form.Item>
          <div className="sm:col-span-2 -mt-2 mb-4 text-xs text-slate-500">
            Giờ thực tế của từng nhân viên là phần giao giữa khung này và giờ ca làm việc của họ. Ca qua đêm hiện vẫn dùng nguyên khung cấu hình.
            {scope === "site_override" && comparableShifts.length === 0 && !shiftsQuery.isLoading && (
              <span className="block mt-1 text-amber-600">
                Công trình này chưa có ca làm việc nào (hoặc chỉ có ca qua đêm) — chưa thể kiểm tra khung giờ có trùng ca làm không.
              </span>
            )}
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
              description="Nhân viên chưa có hồ sơ Face ID ở trạng thái enrolled sẽ tự động fail. Hãy kiểm tra báo cáo Face ID trước khi kích hoạt policy này."
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
              extra="Tắt cấu hình sẽ làm site fallback về tenant-default nếu đây là site override."
            >
              <Switch />
            </Form.Item>
          )}
        </Form>
      </div>
    </BaseModal>
  );
}
