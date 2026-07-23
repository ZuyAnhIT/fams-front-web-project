export default function PageLoading() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-6" role="status" aria-live="polite" aria-label="Đang tải nội dung">
      <div className="space-y-2">
        <div className="h-7 w-56 animate-pulse rounded bg-slate-200" />
        <div className="h-4 w-80 max-w-full animate-pulse rounded bg-slate-100" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[1, 2, 3].map((item) => <div key={item} className="h-32 animate-pulse rounded-xl border border-slate-200 bg-white" />)}
      </div>
      <div className="h-80 animate-pulse rounded-xl border border-slate-200 bg-white" />
      <span className="sr-only">Đang tải nội dung...</span>
    </div>
  );
}
