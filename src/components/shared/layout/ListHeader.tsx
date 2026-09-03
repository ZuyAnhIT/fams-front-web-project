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
    <div className={className || "flex flex-col gap-4"}>
      {/* The action buttons sit on their own row above the search/filters so a wide button
          set can never compete for width with the search box — that flex-shrink race is
          what used to collapse the search field to just its icon on mid-size screens
          (issue #02). */}
      {actions && (
        <div className="flex w-full flex-wrap gap-2 sm:justify-end [&>*]:flex-1 sm:[&>*]:flex-initial">
          {actions}
        </div>
      )}

      <div className="w-full space-y-3">
        <div className="group relative w-full sm:max-w-md">
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
          /* Uniform responsive grid: 1 column on phones, 2 from ~520px, 3 from lg, 4 from
             xl. Every filter control a page passes becomes one grid cell and stretches to
             fill it, so pages only need to pass the controls (as a fragment) — no per-page
             width classes, no wrapper flexbox. */
          <div className="grid grid-cols-1 gap-2 min-[520px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 [&>*]:w-full [&>*]:min-w-0">
            {filters}
          </div>
        )}
      </div>
    </div>
  );
}
