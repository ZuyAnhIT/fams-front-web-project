import { Search } from "lucide-react";
import BaseInput from "@/components/ui/BaseInput";
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
    <div className={className || "flex flex-col sm:flex-row flex-wrap justify-between items-start sm:items-center gap-4"}>
      <div className="flex flex-col sm:flex-row flex-1 gap-3 w-full max-w-xl">
        <div className="flex-1 relative group">
          <BaseInput
            placeholder={searchPlaceholder}
            prefix={<Search className="h-4 w-4 text-slate-400 group-focus-within:text-brand-500 transition-colors" />}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="hover:border-blue-300 focus:border-blue-500 transition-all font-medium"
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
        <div className="flex flex-wrap gap-3 w-full sm:w-auto">
          {actions}
        </div>
      )}
    </div>
  );
}
