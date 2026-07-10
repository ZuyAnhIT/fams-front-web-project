"use client";

import { Input } from "antd";
import { TextAreaProps } from "antd/es/input";
import { cn } from "@/utils/cn";

const { TextArea } = Input;

/**
 * BaseTextArea - Component nền tảng bọc Input.TextArea của Ant Design.
 *
 * Mặc định:
 * - Bo góc (rounded-md)
 * - Padding chuẩn (px-4 py-2)
 * - Nền xám nhạt (bg-slate-50), hover và focus có hiệu ứng chuyển màu mượt mà.
 *
 * Hỗ trợ nhận className từ bên ngoài và gộp an toàn với class mặc định.
 * Tất cả props gốc của Antd TextArea đều được truyền xuống qua spread operator.
 */
export interface BaseTextAreaProps extends TextAreaProps {
  className?: string;
}

export default function BaseTextArea({ className, ...props }: BaseTextAreaProps) {
  return (
    <TextArea
      className={cn(
        "!rounded-md !px-4 !py-2 !shadow-none !bg-slate-50 hover:!bg-slate-100 focus:!bg-white !text-[14px] !text-gray-900 transition-all duration-300",
        className
      )}
      {...props}
    />
  );
}
