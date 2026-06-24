"use client";

import { Input, type InputProps } from "antd";
import { cn } from "@/utils/cn";

/**
 * BaseInputPassword - Component nền tảng bọc Input.Password của Ant Design.
 *
 * Giữ nguyên icon ẩn/hiện mật khẩu mặc định của Antd.
 * Tailwind classes mặc định giống hệt BaseInput:
 * - Bo góc (rounded-md)
 * - Padding thoáng và hiện đại (px-3 py-2)
 * - Xóa viền focus mặc định của Antd, thay bằng viền Tailwind (focus:ring)
 *
 * Hỗ trợ nhận className từ bên ngoài và gộp an toàn với class mặc định.
 * Tất cả props gốc của Antd Input.Password đều được truyền xuống qua spread operator.
 */
export type BaseInputPasswordProps = InputProps;

export default function BaseInputPassword({
  className,
  ...props
}: BaseInputPasswordProps) {
  return (
    <Input.Password
      className={cn(
        "!rounded-md !px-3 !py-2 !shadow-none !bg-white !text-gray-900 !border-gray-300 hover:!border-gray-400 focus:!ring-2 focus:!ring-violet-600 focus:!ring-offset-0 focus:!border-violet-600 [&_.ant-input]:!bg-transparent [&_.ant-input]:!text-gray-900 [&_.anticon]:!text-gray-500",
        className
      )}
      {...props}
    />
  );
}
