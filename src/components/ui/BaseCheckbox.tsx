"use client";

import { Checkbox, type CheckboxProps } from "antd";
import { cn } from "@/utils/cn";
import type { ReactNode } from "react";

/**
 * BaseCheckbox - Component nền tảng bọc Checkbox của Ant Design.
 *
 * Hỗ trợ:
 * - Truyền children để hiển thị label text bên cạnh checkbox.
 * - Nhận className từ bên ngoài và gộp an toàn với class mặc định.
 *
 * Tất cả props gốc của Antd Checkbox đều được truyền xuống qua spread operator.
 */
export interface BaseCheckboxProps extends CheckboxProps {
  className?: string;
  children?: ReactNode;
}

export default function BaseCheckbox({
  className,
  children,
  ...props
}: BaseCheckboxProps) {
  return (
    <Checkbox className={cn("select-none", className)} {...props}>
      {children}
    </Checkbox>
  );
}
