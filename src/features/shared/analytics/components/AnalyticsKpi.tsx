import type { LucideIcon } from "lucide-react";

export default function AnalyticsKpi({ title, value, note, change, icon: Icon, tone = "blue" }: {
  title: string; value: string | number; note?: string; change?: number; icon: LucideIcon;
  tone?: "blue" | "emerald" | "amber" | "violet" | "rose";
}) {
  const tones = {
    blue: "bg-blue-50 text-blue-700", emerald: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700", violet: "bg-violet-50 text-violet-700", rose: "bg-rose-50 text-rose-700",
  };
  return <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
    <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p><p className="mt-2 text-2xl font-bold text-slate-900">{value}</p></div><span className={`rounded-lg p-2 ${tones[tone]}`}><Icon className="h-5 w-5" /></span></div>
    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">{change !== undefined && <span className={change >= 0 ? "font-semibold text-emerald-600" : "font-semibold text-rose-600"}>{change >= 0 ? "+" : ""}{change.toFixed(1)}%</span>}{note && <span>{note}</span>}</div>
  </article>;
}
