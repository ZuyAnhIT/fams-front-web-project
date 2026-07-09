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
        "!rounded-md !px-4 !h-10 !py-2 !shadow-none !bg-slate-50 hover:!bg-slate-100 focus:!bg-white !text-[14px] !text-gray-900 transition-all duration-300 [&:-webkit-autofill]:[transition:background-color_9999s_ease-in-out_0s] [&:-webkit-autofill]:[-webkit-text-fill-color:#0f172a]",
        className
      )}
      suppressHydrationWarning={true}
      {...props}
    />
  );
}
