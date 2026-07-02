"use client";

import React, { useEffect } from "react";
import { Modal, Form, Input, TimePicker, Button, message } from "antd";
import { BaseSwitch } from "@/components/ui";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { useAuthStore } from "@/stores/auth.store";
import { useCreateShiftMutation, useUpdateShiftMutation } from "../hooks/use-shift";
import { ShiftResponse } from "../types/shift.type";

dayjs.extend(customParseFormat);
const format = "HH:mm";

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
  const [form] = Form.useForm();
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
          status: activeShift.status === "active",
        });
      } else {
        form.resetFields();
        form.setFieldsValue({
          allowOvernight: false,
          status: true,
        });
      }
    }
  }, [isOpen, activeShift, form]);

  const handleFinish = (values: any) => {
    if (!tenantId) return;

    const startTime = values.startTime.format(format);
    const endTime = values.endTime.format(format);

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
            status: values.status ? "active" : "inactive",
          },
        },
        {
          onSuccess: () => {
            message.success("Cập nhật ca làm việc thành công!");
            onClose();
          },
          onError: (err: any) => {
            message.error(err.response?.data?.message || "Có lỗi xảy ra khi cập nhật ca.");
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
          },
        },
        {
          onSuccess: () => {
            message.success("Tạo mới ca làm việc thành công!");
            onClose();
          },
          onError: (err: any) => {
            message.error(err.response?.data?.message || "Có lỗi xảy ra khi tạo ca.");
          },
        }
      );
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Modal
      title={isUpdate ? "Cập nhật Ca làm việc" : "Tạo mới Ca làm việc"}
      open={isOpen}
      onCancel={onClose}
      footer={null}
      destroyOnHidden
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        className="mt-4"
      >
        <Form.Item
          name="name"
          label={<span className="font-medium text-slate-700">Tên ca làm việc</span>}
          rules={[{ required: true, message: "Vui lòng nhập tên ca làm việc" }]}
        >
          <Input placeholder="VD: Ca hành chính, Ca đêm..." size="large" />
        </Form.Item>

        <div className="grid grid-cols-2 gap-4">
          <Form.Item
            name="startTime"
            label={<span className="font-medium text-slate-700">Giờ bắt đầu</span>}
            rules={[{ required: true, message: "Chọn giờ bắt đầu" }]}
          >
            <TimePicker format={format} size="large" className="w-full" minuteStep={5} />
          </Form.Item>

          <Form.Item
            name="endTime"
            label={<span className="font-medium text-slate-700">Giờ kết thúc</span>}
            rules={[{ required: true, message: "Chọn giờ kết thúc" }]}
          >
            <TimePicker format={format} size="large" className="w-full" minuteStep={5} />
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

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
          <Button onClick={onClose} disabled={isLoading}>
            Hủy bỏ
          </Button>
          <Button type="primary" htmlType="submit" loading={isLoading}>
            {isUpdate ? "Lưu thay đổi" : "Tạo ca"}
          </Button>
        </div>
      </Form>
    </Modal>
  );
}
