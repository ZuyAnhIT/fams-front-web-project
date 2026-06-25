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
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        {onBack && (
          <button
            onClick={onBack}
            className="p-2 rounded-lg hover:bg-brand-50 text-brand-500 transition-colors cursor-pointer border border-transparent hover:border-brand-100 bg-transparent"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        
        <div>
          <div className="flex items-center gap-4">
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
            
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-brand-950">{title}</h1>
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
        <div className="flex items-center gap-3">
          {actions}
        </div>
      )}
    </div>
  );
}
