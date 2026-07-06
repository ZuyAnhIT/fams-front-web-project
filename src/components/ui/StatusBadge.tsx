import React from "react";
import { Tag } from "antd";
import type { StatusDotConfig, StatusTagConfig } from "@/constants/status";

interface StatusBadgeProps {
  status: string;
  variant: "dot" | "tag";
  configMap: Record<string, any>;
  className?: string;
}

export default function StatusBadge({ status, variant, configMap, className = "" }: StatusBadgeProps) {
  if (variant === "dot") {
    const defaultDotConfig: StatusDotConfig = { dot: "bg-slate-300", text: "text-slate-500", label: status };
    const config = (configMap[status] as StatusDotConfig) || defaultDotConfig;

    return (
      <div className={`inline-flex items-center gap-2 ${config.text} ${className}`}>
        <div className={`w-2 h-2 rounded-full ${config.dot} shadow-sm`}></div>
        <span className="font-semibold text-sm">{config.label}</span>
      </div>
    );
  }

  if (variant === "tag") {
    const defaultTagConfig: StatusTagConfig = { color: "default", text: status };
    const config = (configMap[status] as StatusTagConfig) || defaultTagConfig;

    return (
      <Tag color={config.color} className={className}>
        {config.text}
      </Tag>
    );
  }

  return <span>{status}</span>;
}
