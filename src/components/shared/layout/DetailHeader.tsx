import React from "react";
import { ArrowLeft } from "lucide-react";

interface DetailHeaderProps {
  title: string;
  subtitle?: React.ReactNode;
  avatarUrl?: string | null;
  avatarFallback?: React.ReactNode;
  tags?: React.ReactNode;
  onBack?: () => void;
  actions?: React.ReactNode;
}

export default function DetailHeader({
  title,
  subtitle,
  avatarUrl,
  avatarFallback,
  tags,
  onBack,
  actions,
}: DetailHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex min-w-0 items-start gap-3 sm:gap-4">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            aria-label="Quay lại trang trước"
            className="shrink-0 p-2 rounded-lg hover:bg-brand-50 text-brand-500 transition-colors cursor-pointer border border-transparent hover:border-brand-100 bg-transparent"
          >
            <ArrowLeft className="w-5 h-5" aria-hidden="true" />
          </button>
        )}
        
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            {avatarUrl ? (
              <img 
                src={avatarUrl} 
                alt={title} 
                className="w-12 h-12 rounded-lg border border-brand-200 object-cover bg-white p-1 shadow-sm"
              />
            ) : avatarFallback ? (
              <div className="w-12 h-12 rounded-lg border border-brand-200 bg-brand-50 flex items-center justify-center text-brand-600 shadow-sm uppercase font-bold text-xl">
                {avatarFallback}
              </div>
            ) : null}
            
            <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3">
              <h1 className="break-words text-xl font-bold text-brand-950 sm:text-2xl">{title}</h1>
              {tags}
            </div>
          </div>
          {subtitle && (
            <p className="text-sm text-brand-500 mt-1">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      
      {actions && (
        <div className="flex flex-wrap items-center gap-3 sm:justify-end">
          {actions}
        </div>
      )}
    </div>
  );
}
