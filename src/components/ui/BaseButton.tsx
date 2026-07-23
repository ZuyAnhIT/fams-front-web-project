"use client";

import { Button, type ButtonProps } from "antd";
import { cn } from "@/utils/cn";

/**
 * BaseButton - Component nền tảng bọc Button của Ant Design.
 *
 * Mặc định:
 * - type="primary"
 * - Bo góc (rounded-md), font vừa (font-medium)
 * - Hiệu ứng chuyển đổi mượt (transition-all duration-200)
 * - Hiệu ứng lún nhẹ khi click (active:scale-95)
 *
 * Hỗ trợ nhận className từ bên ngoài và gộp an toàn với class mặc định.
 * Tất cả props gốc của Antd Button đều được truyền xuống qua spread operator.
 */
export interface BaseButtonProps extends ButtonProps {
  className?: string;
  customVariant?: "default" | "auth";
}

const variantClasses = {
  default: "",
  auth: "!bg-blue-600 hover:!bg-blue-500 !text-white !border-blue-600 hover:!border-blue-500 !font-semibold !text-base hover:shadow-[0_4px_20px_rgba(37,99,235,0.4)] transition-all duration-300 !h-11 shadow-[0_4px_12px_rgba(37,99,235,0.3)]",
};

export default function BaseButton({
  className,
  type,
  customVariant = "default",
  ...props
}: BaseButtonProps) {
  // Nếu developer truyền vào các class màu sắc của Tailwind, tự động chuyển type về "default"
  // để tránh bị màu mặc định của type="primary" từ Ant Design đè lên (trừ khi developer ép cứng type).
  const hasCustomColors = className && (className.includes("bg-") || className.includes("text-") || className.includes("border-"));
  const effectiveType = type || (hasCustomColors ? "default" : "primary");

  return (
    <Button
      type={effectiveType}
      className={cn(
        "!rounded-lg !min-h-10 !px-4 !font-medium transition-colors duration-200 active:scale-[0.98] flex items-center justify-center focus-visible:!outline-none focus-visible:!ring-2 focus-visible:!ring-blue-500 focus-visible:!ring-offset-2",
        variantClasses[customVariant],
        className
      )}
      {...props}
    />
  );
}
