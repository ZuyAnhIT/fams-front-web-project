"use client";

import React, { useEffect } from "react";
import { Alert, App, Checkbox } from "antd";
import { BaseModal } from "@/components/ui";
import { FormSelect, FormDatePicker, FormTextArea } from "@/components/forms";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { isAxiosError } from "axios";
import { useAuthStore } from "@/stores/auth.store";
import { useEmployees } from "@/features/customer/employee/hooks/use-employee";
import { useShiftsQuery } from "@/features/customer/shift/hooks/use-shift";
import {
  useCreateAssignmentMutation,
  useUpdateAssignmentMutation,
} from "../hooks/use-assignment";
import {
  type AssignmentDayOfWeek,
  type AssignmentResponse,
  type UpdateAssignmentRequest,
} from "../types/assignment.type";
import { formatVietnameseName } from "@/utils/name.util";
import dayjs from "dayjs";
import { assignmentSchema, type AssignmentFormData } from "../schemas/assignment.schema";

interface AssignmentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  siteId: string;
  activeAssignment?: AssignmentResponse | null;
}

const DAY_OPTIONS: Array<{ label: string; value: AssignmentDayOfWeek }> = [
  { label: "T2", value: "MONDAY" },
  { label: "T3", value: "TUESDAY" },
  { label: "T4", value: "WEDNESDAY" },
  { label: "T5", value: "THURSDAY" },
  { label: "T6", value: "FRIDAY" },
  { label: "T7", value: "SATURDAY" },
  { label: "CN", value: "SUNDAY" },
];

function assignmentErrorMessage(error: unknown, fallback: string): string {
  if (!isAxiosError(error)) return fallback;
  const backendMessage =
    (error.response?.data as { message?: string } | undefined)?.message;
  if (error.response?.status === 409) {
    return `${backendMessage || fallback}. Kiểm tra lịch phân công hiện tại của nhân viên trước khi thử lại.`;
  }
  return backendMessage || fallback;
}

export default function AssignmentFormModal({
  isOpen,
  onClose,
  siteId,
  activeAssignment,
}: AssignmentFormModalProps) {
  const { message } = App.useApp();
  const user = useAuthStore((state) => state.user);
  const tenantId = user?.tenantId || undefined;

  const createMutation = useCreateAssignmentMutation();
  const updateMutation = useUpdateAssignmentMutation();

  const isUpdate = !!activeAssignment;

  // Lấy danh sách nhân viên để chọn
  const { data: employeesRes, isLoading: isEmployeesLoading } = useEmployees(
    { size: 100 },
    { enabled: isOpen },
  );
  const employees = employeesRes?.content || [];
  const assignableEmployees = employees.filter(
    (employee) =>
      employee.status !== "terminated" ||
      employee.id === activeAssignment?.employeeId,
  );

  // Lấy danh sách ca làm việc của site này
  const { data: shiftsRes, isLoading: isShiftsLoading } = useShiftsQuery(
    tenantId,
    siteId,
    { page: 0, size: 100 },
  );
  const shifts = shiftsRes?.content || [];
  const selectableShifts = shifts.filter(
    (shift) =>
      shift.status === "active" || shift.id === activeAssignment?.shiftId,
  );

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
      daysOfWeek: [],
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
          daysOfWeek: activeAssignment.daysOfWeek ?? [],
          notes: activeAssignment.notes || "",
        });
      } else {
        reset({
          employeeId: "",
          shiftId: null,
          role: "worker",
          startDate: null,
          endDate: null,
          daysOfWeek: [],
          notes: "",
        });
      }
    }
  }, [isOpen, activeAssignment, reset]);

  const onSubmit = (data: AssignmentFormData) => {
    if (!tenantId) return;

    const startDate = data.startDate.format("YYYY-MM-DD");
    const endDate = data.endDate
      ? data.endDate.format("YYYY-MM-DD")
      : undefined;
    const daysOfWeek = data.daysOfWeek?.length
      ? data.daysOfWeek
      : undefined;
    const notes = data.notes?.trim() ?? "";

    if (isUpdate && activeAssignment) {
      const updateData: UpdateAssignmentRequest = {};

      if (!data.shiftId && activeAssignment.shiftId) {
        updateData.clearShift = true;
      } else if (data.shiftId && data.shiftId !== activeAssignment.shiftId) {
        updateData.shiftId = data.shiftId;
      }

      if (!endDate && activeAssignment.endDate) {
        updateData.clearEndDate = true;
      } else if (endDate && endDate !== activeAssignment.endDate) {
        updateData.endDate = endDate;
      }

      const previousDays = activeAssignment.daysOfWeek ?? [];
      if (!daysOfWeek && previousDays.length > 0) {
        updateData.clearDaysOfWeek = true;
      } else if (
        daysOfWeek &&
        daysOfWeek.join(",") !== previousDays.join(",")
      ) {
        updateData.daysOfWeek = daysOfWeek;
      }

      if (startDate !== activeAssignment.startDate) {
        updateData.startDate = startDate;
      }
      if (data.role !== activeAssignment.role) {
        updateData.role = data.role;
      }
      if (notes !== (activeAssignment.notes ?? "")) {
        updateData.notes = notes;
      }

      if (Object.keys(updateData).length === 0) {
        message.info("Phân công không có thay đổi");
        onClose();
        return;
      }

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
          onError: (error: unknown) => {
            message.error({
              content: assignmentErrorMessage(
                error,
                "Có lỗi xảy ra khi cập nhật phân công",
              ),
              duration: 7,
            });
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
            ...(data.shiftId ? { shiftId: data.shiftId } : {}),
            startDate,
            ...(endDate ? { endDate } : {}),
            ...(daysOfWeek ? { daysOfWeek } : {}),
            role: data.role,
            ...(notes ? { notes } : {}),
          },
        },
        {
          onSuccess: () => {
            message.success("Tạo phân công thành công!");
            onClose();
          },
          onError: (error: unknown) => {
            message.error({
              content: assignmentErrorMessage(
                error,
                "Có lỗi xảy ra khi tạo phân công",
              ),
              duration: 7,
            });
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
      width={640}
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
          options={assignableEmployees.map((employee) => ({
            value: employee.id,
            label: `${formatVietnameseName(employee.firstName, employee.lastName)} (${employee.employeeCode || employee.email})${
              employee.status === "inactive"
                ? " — Tạm ngừng"
                : employee.status === "terminated"
                  ? " — Đã nghỉ việc"
                  : ""
            }`,
          }))}
          helperText="Nhân viên đã nghỉ việc không thể nhận phân công mới."
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
            options={selectableShifts.map((shift) => ({
                value: shift.id,
                label: `${shift.name} (${shift.startTime} - ${shift.endTime})${shift.status === "inactive" ? " — Đã ngừng dùng" : ""}`,
              }))}
            helperText="Để trống nếu nhân viên làm việc không theo ca cố định."
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

        <div>
          <div className="mb-2 text-[13px] font-semibold text-slate-700">
            Ngày làm việc trong tuần
          </div>
          <Controller
            control={control}
            name="daysOfWeek"
            render={({ field }) => (
              <Checkbox.Group
                options={DAY_OPTIONS}
                value={field.value ?? []}
                onChange={field.onChange}
                className="grid grid-cols-4 gap-x-4 gap-y-3 sm:grid-cols-7"
              />
            )}
          />
          <p className="mt-2 text-xs text-slate-500">
            Không chọn ngày nào nghĩa là phân công áp dụng mọi ngày trong khoảng.
          </p>
        </div>

        <Alert
          type="info"
          showIcon
          message="Hệ thống sẽ chặn lịch bị chồng chéo với site khác"
          description="Nếu nhân viên làm ở nhiều công trình, hãy bảo đảm khoảng ngày hoặc ngày trong tuần không giao nhau."
        />

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
