"use client";

import React, { useEffect } from "react";
import { App, Form, InputNumber } from "antd";
import { isAxiosError } from "axios";
import { BaseSwitch } from "@/components/ui";
import BaseModal from "@/components/ui/BaseModal";
import { useAuthStore } from "@/stores/auth.store";
import { useConfigureOtMutation } from "../hooks/use-shift";
import { ShiftResponse } from "../types/shift.type";
import { ClockCircleOutlined, FieldTimeOutlined } from "@ant-design/icons";

interface ShiftOtConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  siteId: string;
  activeShift: ShiftResponse | null;
}

function errorMessage(error: unknown): string {
  if (!isAxiosError(error)) return "Có lỗi xảy ra khi cập nhật cấu hình.";
  return (
    (error.response?.data as { message?: string } | undefined)?.message ||
    "Có lỗi xảy ra khi cập nhật cấu hình."
  );
}

export default function ShiftOtConfigModal({
  isOpen,
  onClose,
  siteId,
  activeShift,
}: ShiftOtConfigModalProps) {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const user = useAuthStore((state) => state.user);
  const tenantId = user?.tenantId;

  const configureOtMutation = useConfigureOtMutation();

  useEffect(() => {
    if (isOpen && activeShift) {
      form.setFieldsValue({
        allowOvertime: activeShift.allowOvertime,
        earlyCheckinMinutes: activeShift.earlyCheckinMinutes,
        lateCheckoutMinutes: activeShift.lateCheckoutMinutes,
        graceMinutes: activeShift.graceMinutes,
        maxOtMinutesPerDay: activeShift.maxOtMinutesPerDay,
        maxOtMinutesPerWeek: activeShift.maxOtMinutesPerWeek,
      });
    }
  }, [isOpen, activeShift, form]);

  const handleFinish = (values: {
    allowOvertime?: boolean;
    earlyCheckinMinutes?: number | null;
    lateCheckoutMinutes?: number | null;
    graceMinutes?: number | null;
    maxOtMinutesPerDay?: number | null;
    maxOtMinutesPerWeek?: number | null;
  }) => {
    if (!tenantId || !activeShift) return;

    configureOtMutation.mutate(
      {
        tenantId,
        siteId,
        shiftId: activeShift.id,
        data: {
          allowOvertime: values.allowOvertime,
          earlyCheckinMinutes: values.earlyCheckinMinutes ?? 0,
          lateCheckoutMinutes: values.lateCheckoutMinutes ?? 0,
          graceMinutes: values.graceMinutes ?? 0,
          maxOtMinutesPerDay: values.maxOtMinutesPerDay ?? undefined,
          clearMaxOtMinutesPerDay: values.maxOtMinutesPerDay == null,
          maxOtMinutesPerWeek: values.maxOtMinutesPerWeek ?? undefined,
          clearMaxOtMinutesPerWeek: values.maxOtMinutesPerWeek == null,
        },
      },
      {
        onSuccess: () => {
          message.success("Cập nhật cấu hình OT thành công!");
          onClose();
        },
        onError: (error: unknown) => {
          message.error(errorMessage(error));
        },
      }
    );
  };

  const isLoading = configureOtMutation.isPending;

  return (
    <BaseModal
      title={
        <div>
          <span className="block text-lg font-bold text-slate-900 tracking-tight leading-tight">Cấu hình Tăng ca & Chấm công</span>
          <span className="block text-sm text-slate-500 font-normal mt-1">
            Ca làm việc: <strong className="text-blue-600">{activeShift?.name}</strong> ({activeShift?.startTime} - {activeShift?.endTime})
          </span>
        </div>
      }
      isOpen={isOpen}
      onClose={onClose}
      destroyOnHidden
      confirmText="Lưu cấu hình"
      cancelText="Hủy bỏ"
      confirmLoading={isLoading}
      confirmButtonProps={{
        htmlType: "submit",
        form: "ot-config-form",
        className: "!bg-blue-600 hover:!bg-blue-700 !border-0 text-white font-bold shadow-lg shadow-blue-500/25 transition-all h-10 px-6 rounded-lg"
      }}
      cancelButtonProps={{
        disabled: isLoading,
        className: "!bg-white !text-slate-700 !border-slate-300 hover:!bg-slate-50 hover:!text-slate-900 h-10 px-6 rounded-lg font-semibold transition-all"
      }}
    >
      <Form
        form={form}
        id="ot-config-form"
        layout="vertical"
        onFinish={handleFinish}
        className="mt-6"
      >
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FieldTimeOutlined className="text-2xl text-purple-500" />
            <div>
              <div className="font-semibold text-slate-700">Cho phép tính tăng ca (Overtime)</div>
              <div className="text-xs text-slate-500 mt-1">Ghi nhận giờ làm việc ngoài khung giờ hành chính</div>
            </div>
          </div>
          <Form.Item
            name="allowOvertime"
            valuePropName="checked"
            noStyle
          >
            <BaseSwitch />
          </Form.Item>
        </div>

        <div className="text-slate-500 font-medium mb-4">
          Giới hạn thời gian chấm công (Tolerance)
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Form.Item
            name="earlyCheckinMinutes"
            label={
              <div className="flex items-center gap-2">
                <ClockCircleOutlined className="text-green-500" />
                <span className="font-medium text-slate-700">Cho phép đến sớm</span>
              </div>
            }
          >
            <InputNumber
              className="w-full"
              suffix="phút"
              min={0}
              placeholder="VD: 15"
            />
          </Form.Item>

          <Form.Item
            name="lateCheckoutMinutes"
            label={
              <div className="flex items-center gap-2">
                <ClockCircleOutlined className="text-orange-500" />
                <span className="font-medium text-slate-700">Cho phép về muộn</span>
              </div>
            }
          >
            <InputNumber
              className="w-full"
              suffix="phút"
              min={0}
              placeholder="VD: 15"
            />
          </Form.Item>

          <Form.Item
            name="graceMinutes"
            label={
              <div className="flex items-center gap-2">
                <ClockCircleOutlined className="text-blue-500" />
                <span className="font-medium text-slate-700">Ân hạn trước khi tính muộn</span>
              </div>
            }
          >
            <InputNumber
              className="w-full"
              suffix="phút"
              min={0}
              placeholder="VD: 5"
            />
          </Form.Item>
        </div>
        <div className="text-xs text-slate-400 bg-blue-50 p-3 rounded text-blue-800 border border-blue-100">
          <strong>Lưu ý:</strong> Nhân viên check-in/out trong khoảng thời gian châm chước này sẽ được tính là đúng giờ.
          Check-in trong khoảng ân hạn (grace) sẽ không bị tính muộn; vượt ân hạn sẽ tính đủ số phút trễ thực tế.
        </div>

        <div className="mt-6 text-slate-500 font-medium mb-4">
          Ngưỡng cảnh báo tăng ca
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Form.Item
            name="maxOtMinutesPerDay"
            label="Tối đa OT mỗi ngày"
            extra="Để trống = không giới hạn"
            rules={[{ type: "integer", min: 0, message: "Số phút phải là số nguyên không âm." }]}
          >
            <InputNumber className="w-full" suffix="phút" min={0} precision={0} placeholder="VD: 120" />
          </Form.Item>
          <Form.Item
            name="maxOtMinutesPerWeek"
            label="Tối đa OT mỗi tuần"
            extra="Tuần ISO: Thứ 2 đến Chủ Nhật"
            rules={[{ type: "integer", min: 0, message: "Số phút phải là số nguyên không âm." }]}
          >
            <InputNumber className="w-full" suffix="phút" min={0} precision={0} placeholder="VD: 600" />
          </Form.Item>
        </div>
        <div className="rounded border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-800">
          Đây là ngưỡng <strong>cảnh báo cho HR</strong>. Vượt giới hạn không chặn check-out, không ẩn thao tác và không tự cắt số phút OT/lương.
        </div>

      </Form>
    </BaseModal>
  );
}
