"use client";

import React, { useEffect } from "react";
import { Modal, Form, Select, DatePicker, Input, Button, message } from "antd";
import { useAuthStore } from "@/stores/auth.store";
import { useEmployees } from "@/features/customer/employee/hooks/use-employee";
import { useShiftsQuery } from "@/features/customer/shift/hooks/use-shift";
import {
  useCreateAssignmentMutation,
  useUpdateAssignmentMutation,
} from "../hooks/use-assignment";
import { AssignmentResponse } from "../types/assignment.type";
import dayjs from "dayjs";

interface AssignmentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  siteId: string;
  activeAssignment?: AssignmentResponse | null;
}

export default function AssignmentFormModal({
  isOpen,
  onClose,
  siteId,
  activeAssignment,
}: AssignmentFormModalProps) {
  const [form] = Form.useForm();
  const user = useAuthStore((state) => state.user);
  const tenantId = user?.tenantId || undefined;

  const createMutation = useCreateAssignmentMutation();
  const updateMutation = useUpdateAssignmentMutation();

  const isUpdate = !!activeAssignment;

  // Lấy danh sách nhân viên để chọn
  const { data: employeesRes, isLoading: isEmployeesLoading } = useEmployees({ size: 100 });
  const employees = employeesRes?.content || [];

  // Lấy danh sách ca làm việc của site này
  const { data: shiftsRes, isLoading: isShiftsLoading } = useShiftsQuery(
    tenantId,
    siteId,
    { page: 0, size: 100 }
  );
  const shifts = shiftsRes?.content || [];

  useEffect(() => {
    if (isOpen) {
      if (activeAssignment) {
        form.setFieldsValue({
          employeeId: activeAssignment.employeeId,
          shiftId: activeAssignment.shiftId || undefined,
          role: activeAssignment.role,
          startDate: dayjs(activeAssignment.startDate),
          endDate: activeAssignment.endDate ? dayjs(activeAssignment.endDate) : undefined,
          notes: activeAssignment.notes || "",
        });
      } else {
        form.resetFields();
        form.setFieldsValue({
          role: "worker",
        });
      }
    }
  }, [isOpen, activeAssignment, form]);

  const handleFinish = (values: any) => {
    if (!tenantId) return;

    const startDate = values.startDate.format("YYYY-MM-DD");
    const endDate = values.endDate ? values.endDate.format("YYYY-MM-DD") : null;

    if (isUpdate) {
      // Xây dựng payload cập nhật (partial update)
      const updateData: any = {};

      // Xử lý shiftId: nếu xóa ca → gửi clearShift=true
      if (!values.shiftId && activeAssignment.shiftId) {
        updateData.clearShift = true;
      } else if (values.shiftId && values.shiftId !== activeAssignment.shiftId) {
        updateData.shiftId = values.shiftId;
      }

      // Xử lý endDate: nếu xóa ngày kết thúc → gửi clearEndDate=true
      if (!endDate && activeAssignment.endDate) {
        updateData.clearEndDate = true;
      } else if (endDate) {
        updateData.endDate = endDate;
      }

      updateData.startDate = startDate;
      updateData.role = values.role;
      updateData.notes = values.notes || null;

      updateMutation.mutate(
        {
          tenantId,
          siteId,
          assignmentId: activeAssignment.id,
          data: updateData,
        },
        {
          onSuccess: () => {
            message.success("Cập nhật phân công thành công!");
            onClose();
          },
          onError: (err: any) => {
            message.error(
              err.response?.data?.message || "Có lỗi xảy ra khi cập nhật phân công."
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
            employeeId: values.employeeId,
            shiftId: values.shiftId || null,
            startDate,
            endDate,
            role: values.role,
            notes: values.notes || undefined,
          },
        },
        {
          onSuccess: () => {
            message.success("Tạo phân công thành công!");
            onClose();
          },
          onError: (err: any) => {
            message.error(
              err.response?.data?.message || "Có lỗi xảy ra khi tạo phân công."
            );
          },
        }
      );
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Modal
      title={isUpdate ? "Cập nhật phân công" : "Tạo phân công nhân viên"}
      open={isOpen}
      onCancel={onClose}
      footer={null}
      destroyOnHidden
      width={560}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        className="mt-4"
      >
        {/* Chọn nhân viên - chỉ hiển thị khi tạo mới */}
        <Form.Item
          name="employeeId"
          label={<span className="font-medium text-slate-700">Nhân viên</span>}
          rules={[{ required: true, message: "Vui lòng chọn nhân viên" }]}
        >
          <Select
            placeholder="Tìm và chọn nhân viên..."
            showSearch
            loading={isEmployeesLoading}
            disabled={isUpdate}
            optionFilterProp="label"
            size="large"
            options={employees.map((emp: any) => ({
              value: emp.id,
              label: `${emp.firstName} ${emp.lastName} (${emp.employeeCode || emp.email})`,
            }))}
          />
        </Form.Item>

        <div className="grid grid-cols-2 gap-4">
          {/* Vai trò */}
          <Form.Item
            name="role"
            label={<span className="font-medium text-slate-700">Vai trò</span>}
            rules={[{ required: true, message: "Chọn vai trò" }]}
          >
            <Select size="large">
              <Select.Option value="worker">Nhân viên</Select.Option>
              <Select.Option value="supervisor">Giám sát</Select.Option>
            </Select>
          </Form.Item>

          {/* Ca làm việc (không bắt buộc) */}
          <Form.Item
            name="shiftId"
            label={<span className="font-medium text-slate-700">Ca làm việc</span>}
          >
            <Select
              placeholder="Không cố định"
              allowClear
              loading={isShiftsLoading}
              size="large"
              options={shifts
                .filter((s: any) => s.status === "active")
                .map((s: any) => ({
                  value: s.id,
                  label: `${s.name} (${s.startTime} - ${s.endTime})`,
                }))}
            />
          </Form.Item>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Ngày bắt đầu */}
          <Form.Item
            name="startDate"
            label={<span className="font-medium text-slate-700">Ngày bắt đầu</span>}
            rules={[{ required: true, message: "Chọn ngày bắt đầu" }]}
          >
            <DatePicker
              className="w-full"
              size="large"
              format="DD/MM/YYYY"
              placeholder="Chọn ngày..."
            />
          </Form.Item>

          {/* Ngày kết thúc (không bắt buộc) */}
          <Form.Item
            name="endDate"
            label={<span className="font-medium text-slate-700">Ngày kết thúc</span>}
          >
            <DatePicker
              className="w-full"
              size="large"
              format="DD/MM/YYYY"
              placeholder="Vô thời hạn"
              allowClear
            />
          </Form.Item>
        </div>

        {/* Ghi chú */}
        <Form.Item
          name="notes"
          label={<span className="font-medium text-slate-700">Ghi chú</span>}
        >
          <Input.TextArea
            rows={3}
            placeholder="Thêm ghi chú (tuỳ chọn)..."
            className="resize-none"
          />
        </Form.Item>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
          <Button onClick={onClose} disabled={isLoading}>
            Hủy bỏ
          </Button>
          <Button type="primary" htmlType="submit" loading={isLoading}>
            {isUpdate ? "Lưu thay đổi" : "Tạo phân công"}
          </Button>
        </div>
      </Form>
    </Modal>
  );
}
