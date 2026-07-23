import { Search } from "lucide-react";
import BaseInput from "@/components/ui/BaseInput";
import React from "react";

interface ListHeaderProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  searchAriaLabel?: string;
  filters?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export default function ListHeader({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Tìm kiếm...",
  searchAriaLabel = "Tìm kiếm trong danh sách",
  filters,
  actions,
  className,
}: ListHeaderProps) {
  return (
    <div className={className || "flex flex-col sm:flex-row flex-wrap justify-between items-start sm:items-center gap-4"}>
      <div className="flex flex-col lg:flex-row flex-1 gap-3 w-full max-w-4xl">
        <div className="flex-1 relative group">
          <BaseInput
            aria-label={searchAriaLabel}
            placeholder={searchPlaceholder}
            prefix={<Search className="h-4 w-4 text-slate-400 group-focus-within:text-brand-500 transition-colors" />}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="hover:border-blue-300 focus:border-blue-500 transition-all font-medium"
            allowClear
          />
        </div>
        {filters && (
          <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto">
            {filters}
          </div>
        )}
      </div>

      {actions && (
        <div className="flex w-full flex-wrap gap-3 sm:w-auto [&>*]:max-sm:flex-1">
          {actions}
        </div>
      )}
    </div>
  );
}
