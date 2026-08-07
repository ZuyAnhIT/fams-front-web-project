"use client";

import { Tooltip } from "antd";
import { ShieldCheck } from "lucide-react";

export default function MaskedValue({ value, masked, fallback = "—" }: { value?: string | null; masked: boolean; fallback?: string }) {
  if (!value) return <span>{fallback}</span>;
  if (!masked) return <span>{value}</span>;

  return (
    <Tooltip title="Dữ liệu cá nhân đã được Backend che theo quyền hiện tại">
      <span className="inline-flex items-center gap-1.5 text-slate-500">
        <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
        <span>{value}</span>
        <span className="sr-only">Dữ liệu đã được che</span>
      </span>
    </Tooltip>
  );
}
