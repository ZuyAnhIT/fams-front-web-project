"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import BaseButton from "@/components/ui/BaseButton";

interface RouteErrorProps {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}

export default function RouteError({ error, unstable_retry }: RouteErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[55vh] items-center justify-center px-4">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-amber-600">
          <AlertTriangle className="h-7 w-7" aria-hidden="true" />
        </div>
        <h1 className="mt-5 text-xl font-bold text-slate-900">Không thể hiển thị nội dung</h1>
        <p className="mt-2 text-sm text-slate-500">
          Hệ thống gặp sự cố khi tải màn hình này. Dữ liệu của bạn không bị thay đổi.
        </p>
        <BaseButton className="mt-6" icon={<RotateCcw className="h-4 w-4" />} onClick={unstable_retry}>
          Thử tải lại
        </BaseButton>
      </div>
    </div>
  );
}
