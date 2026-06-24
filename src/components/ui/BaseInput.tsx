"use client";

import { Input, type InputProps } from "antd";
import { cn } from "@/utils/cn";

/**
 * BaseInput - Component nền tảng bọc Input của Ant Design.
 *
 * Mặc định:
 * - Bo góc (rounded-md)
 * - Padding thoáng và hiện đại (px-3 py-2)
 * - Xóa viền focus mặc định của Antd, thay bằng viền Tailwind (focus:ring)
 *
 * Hỗ trợ nhận className từ bên ngoài và gộp an toàn với class mặc định.
 * Tất cả props gốc của Antd Input đều được truyền xuống qua spread operator.
 */
export interface BaseInputProps extends InputProps {
  className?: string;
}

export default function BaseInput({ className, ...props }: BaseInputProps) {
  return (
    <Input
      className={cn(
        "!rounded-md !px-3 !py-2 !shadow-none !bg-white !text-gray-900 !border-gray-300 hover:!border-gray-400 focus:!ring-2 focus:!ring-violet-600 focus:!ring-offset-0 focus:!border-violet-600",
        className
      )}
      {...props}
    />
  );
}
