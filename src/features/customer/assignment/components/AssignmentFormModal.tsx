"use client";

import React, { useEffect } from "react";
import { message } from "antd";
import { BaseModal } from "@/components/ui";
import { FormSelect, FormDatePicker, FormTextArea } from "@/components/forms";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuthStore } from "@/stores/auth.store";
import { useEmployees } from "@/features/customer/employee/hooks/use-employee";
import { useShiftsQuery } from "@/features/customer/shift/hooks/use-shift";
import {
  useCreateAssignmentMutation,
  useUpdateAssignmentMutation,
} from "../hooks/use-assignment";
import { AssignmentResponse } from "../types/assignment.type";
import dayjs from "dayjs";
import { assignmentSchema, type AssignmentFormData } from "../schemas/assignment.schema";

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

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AssignmentFormData>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      employeeId: "",
      shiftId: null,
      role: "worker",
      startDate: null,
      endDate: null,
      notes: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (activeAssignment) {
        reset({
          employeeId: activeAssignment.employeeId,
          shiftId: activeAssignment.shiftId || null,
          role: activeAssignment.role,
          startDate: dayjs(activeAssignment.startDate),
          endDate: activeAssignment.endDate ? dayjs(activeAssignment.endDate) : null,
          notes: activeAssignment.notes || "",
        });
      } else {
        reset({
          employeeId: "",
          shiftId: null,
          role: "worker",
          startDate: null,
          endDate: null,
          notes: "",
        });
      }
    }
  }, [isOpen, activeAssignment, reset]);

  const onSubmit = (data: AssignmentFormData) => {
    if (!tenantId) return;

    const startDate = data.startDate.format("YYYY-MM-DD");
    const endDate = data.endDate ? data.endDate.format("YYYY-MM-DD") : null;

    if (isUpdate && activeAssignment) {
      // Xây dựng payload cập nhật (partial update)
      const updateData: any = {};

      // Xử lý shiftId: nếu xóa ca → gửi clearShift=true
      if (!data.shiftId && activeAssignment.shiftId) {
        updateData.clearShift = true;
      } else if (data.shiftId && data.shiftId !== activeAssignment.shiftId) {
        updateData.shiftId = data.shiftId;
      }

      // Xử lý endDate: nếu xóa ngày kết thúc → gửi clearEndDate=true
      if (!endDate && activeAssignment.endDate) {
        updateData.clearEndDate = true;
      } else if (endDate) {
        updateData.endDate = endDate;
      }

      updateData.startDate = startDate;
      updateData.role = data.role;
      updateData.notes = data.notes || null;

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
            employeeId: data.employeeId,
            shiftId: data.shiftId || null,
            startDate,
            endDate,
            role: data.role,
            notes: data.notes || undefined,
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
    <BaseModal
      title={
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight leading-tight">
            {isUpdate ? "Cập nhật phân công" : "Tạo phân công nhân viên"}
          </h2>
          <p className="text-sm text-slate-500 font-normal mt-0.5">
            {isUpdate ? "Chỉnh sửa thông tin phân công hiện tại" : "Phân công nhân viên vào công trình này"}
          </p>
        </div>
      }
      isOpen={isOpen}
      onClose={onClose}
      destroyOnClose
      width={560}
      confirmText={isUpdate ? "Lưu thay đổi" : "Tạo phân công"}
      cancelText="Hủy bỏ"
      confirmLoading={isLoading}
      confirmButtonProps={{
        htmlType: "submit",
        form: "assignment-form",
        className: "!bg-blue-600 hover:!bg-blue-700 !border-0 text-white font-bold shadow-lg shadow-blue-500/25 transition-all h-10 px-6 rounded-lg"
      }}
      cancelButtonProps={{
        disabled: isLoading,
        className: "!bg-white !text-slate-700 !border-slate-300 hover:!bg-slate-50 hover:!text-slate-900 h-10 px-6 rounded-lg font-semibold transition-all"
      }}
    >
      <form
        id="assignment-form"
        onSubmit={handleSubmit(onSubmit)}
        className="mt-4 space-y-4"
      >
        <FormSelect
          control={control}
          name="employeeId"
          label="Nhân viên"
          required
          placeholder="Tìm và chọn nhân viên..."
          showSearch
          loading={isEmployeesLoading}
          disabled={isUpdate}
          optionFilterProp="label"
          options={employees.map((emp: any) => ({
            value: emp.id,
            label: `${emp.firstName} ${emp.lastName} (${emp.employeeCode || emp.email})`,
          }))}
          error={errors.employeeId}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormSelect
            control={control}
            name="role"
            label="Vai trò"
            required
            options={[
              { label: "Nhân viên", value: "worker" },
              { label: "Giám sát", value: "supervisor" }
            ]}
            error={errors.role}
          />

          <FormSelect
            control={control}
            name="shiftId"
            label="Ca làm việc"
            placeholder="Không cố định"
            allowClear
            loading={isShiftsLoading}
            options={shifts
              .filter((s: any) => s.status === "active")
              .map((s: any) => ({
                value: s.id,
                label: `${s.name} (${s.startTime} - ${s.endTime})`,
              }))}
            error={errors.shiftId}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormDatePicker
            control={control}
            name="startDate"
            label="Ngày bắt đầu"
            required
            className="w-full"
            format="DD/MM/YYYY"
            placeholder="Chọn ngày..."
            error={errors.startDate}
          />

          <FormDatePicker
            control={control}
            name="endDate"
            label="Ngày kết thúc"
            className="w-full"
            format="DD/MM/YYYY"
            placeholder="Vô thời hạn"
            allowClear
            error={errors.endDate}
          />
        </div>

        <FormTextArea
          control={control}
          name="notes"
          label="Ghi chú"
          rows={3}
          placeholder="Thêm ghi chú (tuỳ chọn)..."
          className="resize-none"
          error={errors.notes}
        />
      </form>
    </BaseModal>
  );
}
