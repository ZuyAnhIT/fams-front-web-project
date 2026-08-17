"use client";

import React, { useEffect } from "react";
import { App, Form } from "antd";
import { isAxiosError } from "axios";
import {
  BaseSwitch,
  BaseInput,
  BaseSelect,
  BaseTimePicker,
} from "@/components/ui";
import BaseModal from "@/components/ui/BaseModal";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { useAuthStore } from "@/stores/auth.store";
import { useCreateShiftMutation, useUpdateShiftMutation } from "../hooks/use-shift";
import { ShiftResponse } from "../types/shift.type";
import {
  CHECKIN_POLICY_META,
  CHECKIN_POLICY_OPTIONS,
  type CheckinPolicy,
} from "../../checkin/constants/checkin-policy";

dayjs.extend(customParseFormat);
const format = "HH:mm";

function errorMessage(error: unknown, fallback: string): string {
  if (!isAxiosError(error)) return fallback;
  return (
    (error.response?.data as { message?: string } | undefined)?.message ||
    fallback
  );
}

interface ShiftFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  siteId: string;
  activeShift?: ShiftResponse | null;
}

export default function ShiftFormModal({
  isOpen,
  onClose,
  siteId,
  activeShift,
}: ShiftFormModalProps) {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const inheritPolicy = Form.useWatch("inheritPolicy", form) ?? true;
  const policyOverride = Form.useWatch("checkinPolicyOverride", form) as
    | CheckinPolicy
    | undefined;
  const user = useAuthStore((state) => state.user);
  const tenantId = user?.tenantId;

  const createMutation = useCreateShiftMutation();
  const updateMutation = useUpdateShiftMutation();

  const isUpdate = !!activeShift;

  useEffect(() => {
    if (isOpen) {
      if (activeShift) {
        form.setFieldsValue({
          name: activeShift.name,
          startTime: dayjs(activeShift.startTime, format),
          endTime: dayjs(activeShift.endTime, format),
          allowOvernight: activeShift.allowOvernight,
          inheritPolicy: !activeShift.checkinPolicyOverride,
          checkinPolicyOverride:
            activeShift.checkinPolicyOverride || "gps_only",
          status: activeShift.status === "active",
          isDefault: activeShift.isDefault,
        });
      } else {
        form.resetFields();
        form.setFieldsValue({
          allowOvernight: false,
          inheritPolicy: true,
          checkinPolicyOverride: "gps_only",
          status: true,
          isDefault: false,
        });
      }
    }
  }, [isOpen, activeShift, form]);

  const handleFinish = (values: {
    name: string;
    startTime: dayjs.Dayjs;
    endTime: dayjs.Dayjs;
    allowOvernight: boolean;
    inheritPolicy: boolean;
    checkinPolicyOverride?: CheckinPolicy;
    status?: boolean;
    isDefault?: boolean;
  }) => {
    if (!tenantId) return;

    const startTime = values.startTime.format(format);
    const endTime = values.endTime.format(format);
    if (startTime === endTime) {
      message.error("Giờ bắt đầu và giờ kết thúc không được trùng nhau");
      return;
    }
    if (!values.allowOvernight && endTime < startTime) {
      message.error(
        "Giờ kết thúc trước giờ bắt đầu. Hãy bật “Làm xuyên đêm” nếu ca kết thúc vào ngày hôm sau.",
      );
      return;
    }
    if (isUpdate) {
      updateMutation.mutate(
        {
          tenantId,
          siteId,
          shiftId: activeShift.id,
          data: {
            name: values.name,
            startTime,
            endTime,
            allowOvernight: values.allowOvernight,
            checkinPolicyOverride: values.inheritPolicy
              ? undefined
              : values.checkinPolicyOverride,
            clearCheckinPolicyOverride:
              values.inheritPolicy &&
              Boolean(activeShift.checkinPolicyOverride),
            status: values.status ? "active" : "inactive",
            isDefault: values.isDefault,
          },
        },
        {
          onSuccess: () => {
            message.success("Cập nhật ca làm việc thành công!");
            onClose();
          },
          onError: (error: unknown) => {
            message.error(
              errorMessage(error, "Có lỗi xảy ra khi cập nhật ca."),
            );
          },
        }
      );
    } else {
      createMutation.mutate(
        {
          tenantId,
          siteId,
          data: {
            name: values.name,
            startTime,
            endTime,
            allowOvernight: values.allowOvernight,
            checkinPolicyOverride: values.inheritPolicy
              ? undefined
              : values.checkinPolicyOverride,
            isDefault: values.isDefault,
          },
        },
        {
          onSuccess: () => {
            message.success("Tạo mới ca làm việc thành công!");
            onClose();
          },
          onError: (error: unknown) => {
            message.error(errorMessage(error, "Có lỗi xảy ra khi tạo ca."));
          },
        }
      );
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  const validateTimeRange = () => ({
    validator(_: unknown, endTime: dayjs.Dayjs | null) {
      const startTime = form.getFieldValue("startTime") as dayjs.Dayjs | null;
      const allowOvernight = form.getFieldValue("allowOvernight") as boolean;
      if (!startTime || !endTime) return Promise.resolve();
      if (startTime.format(format) === endTime.format(format)) {
        return Promise.reject(new Error("Giờ bắt đầu và kết thúc không được trùng nhau"));
      }
      if (!allowOvernight && endTime.isBefore(startTime)) {
        return Promise.reject(new Error("Bật “Làm xuyên đêm” nếu ca kết thúc vào ngày hôm sau"));
      }
      return Promise.resolve();
    },
  });

  return (
    <BaseModal
      title={
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight leading-tight">
            {isUpdate ? "Cập nhật Ca làm việc" : "Tạo mới Ca làm việc"}
          </h2>
          <p className="text-sm text-slate-500 font-normal mt-0.5">
            {isUpdate ? "Chỉnh sửa thông tin ca làm việc hiện tại" : "Thêm ca làm việc mới cho công trình này"}
          </p>
        </div>
      }
      isOpen={isOpen}
      onClose={onClose}
      destroyOnHidden
      confirmText={isUpdate ? "Lưu thay đổi" : "Tạo ca"}
      cancelText="Hủy bỏ"
      confirmLoading={isLoading}
      confirmButtonProps={{
        htmlType: "submit",
        form: "shift-form",
        className: "!bg-blue-600 hover:!bg-blue-700 !border-0 text-white font-bold shadow-lg shadow-blue-500/25 transition-all h-10 px-6 rounded-lg"
      }}
      cancelButtonProps={{
        disabled: isLoading,
        className: "!bg-white !text-slate-700 !border-slate-300 hover:!bg-slate-50 hover:!text-slate-900 h-10 px-6 rounded-lg font-semibold transition-all"
      }}
    >
      <Form
        form={form}
        id="shift-form"
        layout="vertical"
        onFinish={handleFinish}
        className="mt-2"
      >
        <Form.Item
          name="name"
          label={<span className="font-semibold text-slate-700 text-sm">Tên ca làm việc</span>}
          rules={[{ required: true, message: "Vui lòng nhập tên ca làm việc" }]}
        >
          <BaseInput placeholder="VD: Ca hành chính, Ca đêm..." />
        </Form.Item>

        <div className="grid grid-cols-2 gap-4">
          <Form.Item
            name="startTime"
            label={<span className="font-semibold text-slate-700 text-sm">Giờ bắt đầu</span>}
            rules={[{ required: true, message: "Chọn giờ bắt đầu" }]}
          >
            <BaseTimePicker format={format} className="w-full" minuteStep={5} />
          </Form.Item>

          <Form.Item
            name="endTime"
            label={<span className="font-semibold text-slate-700 text-sm">Giờ kết thúc</span>}
            dependencies={["startTime", "allowOvernight"]}
            rules={[
              { required: true, message: "Chọn giờ kết thúc" },
              validateTimeRange,
            ]}
          >
            <BaseTimePicker format={format} className="w-full" minuteStep={5} />
          </Form.Item>
        </div>

        <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg mb-4">
          <div>
            <div className="font-medium text-slate-700">Làm xuyên đêm (Qua mốc 00:00)</div>
            <div className="text-xs text-slate-500">Bật nếu giờ kết thúc rơi vào ngày hôm sau</div>
          </div>
          <Form.Item
            name="allowOvernight"
            valuePropName="checked"
            noStyle
          >
            <BaseSwitch />
          </Form.Item>
        </div>

        <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="font-medium text-slate-700">
                Kế thừa chính sách của công trình
              </div>
              <div className="mt-1 text-xs text-slate-500">
                Bật để ca tự nhận mọi thay đổi chính sách từ công trình.
              </div>
            </div>
            <Form.Item
              name="inheritPolicy"
              valuePropName="checked"
              noStyle
            >
              <BaseSwitch aria-label="Kế thừa chính sách chấm công từ công trình" />
            </Form.Item>
          </div>

          {!inheritPolicy && (
            <Form.Item
              name="checkinPolicyOverride"
              label="Chính sách ghi đè cho ca"
              rules={[
                {
                  required: true,
                  message: "Chọn chính sách chấm công cho ca",
                },
              ]}
              className="mb-0 mt-4"
              extra={
                policyOverride
                  ? CHECKIN_POLICY_META[policyOverride].description
                  : undefined
              }
            >
              <BaseSelect
                aria-label="Chính sách chấm công ghi đè của ca"
                options={CHECKIN_POLICY_OPTIONS}
              />
            </Form.Item>
          )}
        </div>

        {isUpdate && (
          <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg mb-4">
            <div>
              <div className="font-medium text-slate-700">Trạng thái áp dụng</div>
              <div className="text-xs text-slate-500">Tắt để vô hiệu hóa ca này thay vì xóa bỏ</div>
            </div>
            <Form.Item
              name="status"
              valuePropName="checked"
              noStyle
            >
              <BaseSwitch />
            </Form.Item>
          </div>
        )}

        <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg mb-4">
          <div>
            <div className="font-medium text-slate-700">Đặt làm ca mặc định</div>
            <div className="text-xs text-slate-500">
              Được chọn sẵn khi tạo phân công mới cho công trình này. Mỗi công
              trình chỉ có 1 ca mặc định — bật ca này sẽ tự bỏ mặc định ở ca
              khác.
            </div>
          </div>
          <Form.Item name="isDefault" valuePropName="checked" noStyle>
            <BaseSwitch aria-label="Đặt làm ca mặc định" />
          </Form.Item>
        </div>

      </Form>
    </BaseModal>
  );
}
