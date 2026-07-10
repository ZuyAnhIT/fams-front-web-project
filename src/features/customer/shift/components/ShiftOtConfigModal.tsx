"use client";

import React, { useEffect } from "react";
import { Form, InputNumber, message } from "antd";
import { BaseSwitch } from "@/components/ui";
import BaseModal from "@/components/ui/BaseModal";
import BaseButton from "@/components/ui/BaseButton";
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

export default function ShiftOtConfigModal({
  isOpen,
  onClose,
  siteId,
  activeShift,
}: ShiftOtConfigModalProps) {
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
      });
    }
  }, [isOpen, activeShift, form]);

  const handleFinish = (values: any) => {
    if (!tenantId || !activeShift) return;

    configureOtMutation.mutate(
      {
        tenantId,
        siteId,
        shiftId: activeShift.id,
        data: {
          allowOvertime: values.allowOvertime,
          earlyCheckinMinutes: values.earlyCheckinMinutes || 0,
          lateCheckoutMinutes: values.lateCheckoutMinutes || 0,
        },
      },
      {
        onSuccess: () => {
          message.success("Cập nhật cấu hình OT thành công!");
          onClose();
        },
        onError: (err: any) => {
          message.error(err.response?.data?.message || "Có lỗi xảy ra khi cập nhật cấu hình.");
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
      destroyOnClose
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

        <div className="grid grid-cols-2 gap-4">
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
              addonAfter="phút"
              min={0}
              max={300}
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
              addonAfter="phút"
              min={0}
              max={300}
              placeholder="VD: 15"
            />
          </Form.Item>
        </div>
        <div className="text-xs text-slate-400 bg-blue-50 p-3 rounded text-blue-800 border border-blue-100">
          <strong>Lưu ý:</strong> Nhân viên check-in/out trong khoảng thời gian châm chước này sẽ được tính là đúng giờ.
        </div>

      </Form>
    </BaseModal>
  );
}
