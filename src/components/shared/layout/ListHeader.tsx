import { Search } from "lucide-react";
import { Input } from "antd";
import React from "react";

interface ListHeaderProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  actions?: React.ReactNode;
}

export default function ListHeader({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Tìm kiếm...",
  actions,
}: ListHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-3xl border border-slate-200/60 shadow-[0_2px_20px_rgb(0,0,0,0.03)]">
      <div className="flex-1 w-full max-w-md relative group">
        <Input
          placeholder={searchPlaceholder}
          prefix={<Search className="h-4 w-4 text-slate-400 group-focus-within:text-brand-500 transition-colors" />}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-12 rounded-xl border-slate-200 hover:border-blue-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 shadow-sm transition-all text-sm font-medium bg-slate-50/50 hover:bg-white focus:bg-white"
          allowClear
        />
      </div>
      
      {actions && (
        <div className="flex gap-3 w-full sm:w-auto">
          {actions}
        </div>
      )}
    </div>
  );
}
