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
      className={cn("px-8 py-10", className)}
      style={{
        background: "rgba(22, 22, 26, 0.45)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderRadius: 16,
        border: "1px solid rgba(255, 255, 255, 0.12)",
        boxShadow:
          "0 0 50px rgba(124, 92, 252, 0.15), 0 20px 50px rgba(0, 0, 0, 0.5)",
      }}
      {...props}
    >
      {children}
    </div>
  );
}
