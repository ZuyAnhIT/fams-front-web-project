"use client";

import { Select, type SelectProps } from "antd";
import { cn } from "@/utils/cn";

/**
 * BaseSelect - Component nền tảng bọc Select của Ant Design.
 *
 * Mặc định:
 * - Bo góc (rounded-[5px]) giống với BaseInput
 * - Chiều cao chuẩn (h-10)
 * - Tùy chỉnh hover, focus và xóa border mặc định của Antd
 *
 * Hỗ trợ nhận className từ bên ngoài và gộp an toàn.
 */
export interface BaseSelectProps extends SelectProps {
  className?: string;
}

export default function BaseSelect({ className, ...props }: BaseSelectProps) {
  return (
    <Select
      className={cn(
        "w-full h-10",
        "[&_.ant-select-selector]:!rounded-md [&_.ant-select-selector]:!h-10 [&_.ant-select-selector]:!flex [&_.ant-select-selector]:!items-center [&_.ant-select-selector]:!bg-slate-50 [&_.ant-select-selector]:hover:!bg-slate-100 [&.ant-select-focused_.ant-select-selector]:!bg-white [&_.ant-select-selector]:!border-slate-200 [&_.ant-select-selector]:!shadow-none",
        className
      )}
      {...props}
    />
  );
}
