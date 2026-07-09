import { Search } from "lucide-react";
import { Input } from "antd";
import React from "react";

interface ListHeaderProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filters?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export default function ListHeader({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Tìm kiếm...",
  filters,
  actions,
  className,
}: ListHeaderProps) {
  return (
    <div className={className || "flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-3xl border border-slate-200/60 shadow-[0_2px_20px_rgb(0,0,0,0.03)]"}>
      <div className="flex flex-1 gap-3 w-full max-w-xl">
        <div className="flex-1 relative group">
          <Input
            placeholder={searchPlaceholder}
            prefix={<Search className="h-4 w-4 text-slate-400 group-focus-within:text-brand-500 transition-colors" />}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-10 rounded-xl hover:border-blue-300 focus:border-blue-500 !shadow-none transition-all text-sm font-medium bg-slate-50/50 hover:bg-white focus:bg-white"
            allowClear
          />
        </div>
        {filters && (
          <div className="shrink-0 flex items-center">
            {filters}
          </div>
        )}
      </div>

      {actions && (
        <div className="flex gap-3 w-full sm:w-auto">
          {actions}
        </div>
      )}
    </div>
  );
}
