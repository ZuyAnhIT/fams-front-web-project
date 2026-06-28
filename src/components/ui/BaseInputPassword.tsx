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
        "!rounded-xl !px-4 !py-3 !shadow-none !bg-slate-50 hover:!bg-slate-100 focus:!bg-white focus-within:!bg-white !text-gray-900 !border-transparent hover:!border-transparent focus:!border-blue-500 focus-within:!border-blue-500 focus-within:!ring-4 focus-within:!ring-blue-500/15 focus:!ring-offset-0 transition-all duration-300 [&_.ant-input]:!bg-transparent [&_.ant-input]:!text-gray-900 [&_.anticon]:!text-gray-400 hover:[&_.anticon]:!text-gray-600 [&_input:-webkit-autofill]:[transition:background-color_9999s_ease-in-out_0s] [&_input:-webkit-autofill]:[-webkit-text-fill-color:#0f172a]",
        className
      )}
      {...props}
    />
  );
}
