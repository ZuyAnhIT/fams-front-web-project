"use client";

import { TimePicker, type TimePickerProps } from "antd";
import { cn } from "@/utils/cn";

/**
 * BaseTimePicker - Component nền tảng bọc TimePicker của Ant Design.
 *
 * Mặc định:
 * - Bo góc (rounded-md)
 * - Chiều cao 40px (h-10), padding ngang (px-4)
 * - Nền xám nhạt (bg-slate-50), hover và focus có hiệu ứng chuyển màu mượt mà.
 *
 * Hỗ trợ nhận className từ bên ngoài và gộp an toàn với class mặc định.
 * Tất cả props gốc của Antd TimePicker đều được truyền xuống qua spread operator.
 */
export interface BaseTimePickerProps extends TimePickerProps {
  className?: string;
}

export default function BaseTimePicker({ className, ...props }: BaseTimePickerProps) {
  return (
    <TimePicker
      className={cn(
        "!rounded-md !px-4 !h-10 !shadow-none !bg-slate-50 hover:!bg-slate-100 focus:!bg-white !text-[14px] !text-gray-900 transition-all duration-300",
        className
      )}
      {...props}
    />
  );
}
