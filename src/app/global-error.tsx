"use client";

import "./globals.css";

export default function GlobalError({ unstable_retry }: { unstable_retry: () => void }) {
  return (
    <html lang="vi">
      <body>
        <main className="flex min-h-dvh items-center justify-center bg-slate-950 px-4 text-white">
          <div className="max-w-md text-center">
            <p className="text-sm font-semibold text-blue-300">FAMS</p>
            <h1 className="mt-2 text-2xl font-bold">Hệ thống tạm thời gián đoạn</h1>
            <p className="mt-3 text-sm text-slate-300">Vui lòng tải lại ứng dụng. Nếu sự cố tiếp diễn, hãy liên hệ quản trị viên hệ thống.</p>
            <button
              type="button"
              onClick={unstable_retry}
              className="mt-6 min-h-10 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
            >
              Tải lại ứng dụng
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
