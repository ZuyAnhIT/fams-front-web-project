import React from "react";
import { cn } from "@/utils/cn";

interface ContentCardProps {
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

export default function ContentCard({
  children,
  className,
  noPadding = false,
}: ContentCardProps) {
  return (
    <div
      className={cn(
        "bg-white rounded-3xl border border-slate-200/60 shadow-[0_2px_20px_rgb(0,0,0,0.04)] overflow-hidden",
        !noPadding && "p-6 sm:p-8",
        className
      )}
    >
      {children}
    </div>
  );
}
