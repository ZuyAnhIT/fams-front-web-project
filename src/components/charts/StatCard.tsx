import type { ComponentType, ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

interface StatCardProps {
  title: string;
  value: ReactNode;
  description?: string;
  icon: ComponentType<{ className?: string }>;
  tone?: "blue" | "emerald" | "amber" | "violet";
  href?: string;
  loading?: boolean;
}

const TONES = {
  blue: "bg-blue-50 text-blue-700 ring-blue-100",
  emerald: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  amber: "bg-amber-50 text-amber-700 ring-amber-100",
  violet: "bg-violet-50 text-violet-700 ring-violet-100",
};

export default function StatCard({
  title,
  value,
  description,
  icon: Icon,
  tone = "blue",
  href,
  loading = false,
}: StatCardProps) {
  const content = (
    <div className="group h-full rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-slate-300">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">{title}</p>
          {loading ? (
            <div className="mt-3 h-8 w-20 animate-pulse rounded bg-slate-100" aria-label="Đang tải" />
          ) : (
            <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
          )}
          {description && <p className="mt-2 text-xs text-slate-500">{description}</p>}
        </div>
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1 ${TONES[tone]}`}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
      </div>
      {href && (
        <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-blue-700">
          Xem chi tiết
          <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
        </div>
      )}
    </div>
  );

  return href ? (
    <Link href={href} className="block h-full rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">
      {content}
    </Link>
  ) : content;
}
