export default function RootLoading() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-slate-50" role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-3 text-sm text-slate-600">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" aria-hidden="true" />
        Đang tải nội dung...
      </div>
    </div>
  );
}
