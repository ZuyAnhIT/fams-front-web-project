import Link from "next/link";
import { FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-700">
          <FileQuestion className="h-7 w-7" aria-hidden="true" />
        </div>
        <p className="mt-5 text-sm font-semibold text-blue-700">404</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">Không tìm thấy trang</h1>
        <p className="mt-2 text-sm text-slate-500">Đường dẫn có thể đã thay đổi hoặc bạn không có quyền truy cập.</p>
        <Link href="/" className="mt-6 inline-flex min-h-10 items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
          Về trang chính
        </Link>
      </div>
    </main>
  );
}
