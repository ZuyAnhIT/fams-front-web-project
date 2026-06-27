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
        "bg-white rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden",
        !noPadding && "p-6 sm:p-8",
        className
      )}
    >
      {children}
    </div>
  );
}
