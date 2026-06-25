"use client";

import { cn } from "@/utils/cn";
import type { ReactNode, HTMLAttributes } from "react";

/**
 * GlassCard - Card phong cách Dark Glassmorphism dùng chung.
 *
 * Mặc định:
 * - Nền bán trong suốt tối (rgba) + backdrop-blur
 * - Viền sáng mờ + shadow tím nhẹ
 * - Bo góc 16px, padding thoáng
 *
 * Hỗ trợ nhận className từ bên ngoài để tuỳ chỉnh thêm.
 */
export interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
}

export default function GlassCard({
  children,
  className,
  ...props
}: GlassCardProps) {
  return (
    <div
      className={cn(
        "px-8 py-10",
        "rounded-[16px] border border-white/12",
        "bg-[#16161a]/45 backdrop-blur-[20px]",
        "shadow-[0_0_50px_rgba(124,92,252,0.15),0_20px_50px_rgba(0,0,0,0.5)]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
