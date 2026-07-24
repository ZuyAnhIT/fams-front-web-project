"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, CircleAlert, LoaderCircle } from "lucide-react";
import { ROUTES } from "@/constants/routes";

type VerifyState = "loading" | "success" | "error";

interface VerifyErrorBody {
  message?: string;
  userMessage?: string;
}

export default function VerifyEmailResult() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const mode = searchParams.get("mode");
  const [state, setState] = useState<VerifyState>("loading");
  const [detail, setDetail] = useState("Đang xác thực email của bạn...");

  useEffect(() => {
    let active = true;

    async function verify() {
      if (!token) {
        setState("error");
        setDetail("Link xác thực không hợp lệ vì thiếu token.");
        return;
      }

      try {
        const modeQuery = mode === "email-change" ? "&mode=email-change" : "";
        const response = await fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}${modeQuery}`, {
          headers: { Accept: "application/json" },
        });
        const body = await response.json() as VerifyErrorBody;
        if (!active) return;

        if (response.ok) {
          setState("success");
          setDetail(mode === "email-change"
            ? "Email mới đã được xác thực và cập nhật. Bạn có thể dùng địa chỉ này để đăng nhập."
            : "Email đã được xác thực. Bạn có thể đăng nhập ngay bây giờ.");
        } else {
          setState("error");
          setDetail(body.userMessage || body.message || "Link xác thực không hợp lệ, đã hết hạn hoặc đã được sử dụng.");
        }
      } catch {
        if (!active) return;
        setState("error");
        setDetail("Không thể xác thực email lúc này. Vui lòng thử lại sau.");
      }
    }

    void verify();
    return () => { active = false; };
  }, [mode, token]);

  return (
    <div className="text-center">
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-blue-50">
        {state === "loading" && <LoaderCircle className="h-10 w-10 animate-spin text-blue-600" aria-hidden="true" />}
        {state === "success" && <CheckCircle2 className="h-10 w-10 text-green-600" aria-hidden="true" />}
        {state === "error" && <CircleAlert className="h-10 w-10 text-red-600" aria-hidden="true" />}
      </div>
      <h1 className="mb-3 text-3xl font-bold text-slate-900">
        {state === "loading" ? "Đang xác thực" : state === "success" ? "Xác thực thành công" : "Không thể xác thực"}
      </h1>
      <p role={state === "error" ? "alert" : undefined} className="mb-8 text-slate-600">{detail}</p>
      {state !== "loading" && (
        <Link
          href={state === "success" ? ROUTES.LOGIN : ROUTES.REGISTER}
          className="inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-blue-600 px-4 font-bold !text-white hover:bg-blue-700"
        >
          {state === "success" ? "Đi tới đăng nhập" : "Quay lại đăng ký"}
        </Link>
      )}
    </div>
  );
}
