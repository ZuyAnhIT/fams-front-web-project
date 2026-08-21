"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, CircleAlert, LoaderCircle, RotateCcw } from "lucide-react";
import { CUSTOMER_ROUTES, ROUTES } from "@/constants/routes";
import { publicEnv } from "@/config/env";

type VerifyState = "loading" | "success" | "error";

interface VerifyErrorBody {
  message?: string;
  userMessage?: string;
}

interface VerificationResult {
  ok: boolean;
  status: number;
  body: VerifyErrorBody;
}

// React development mode may mount an effect twice. Reuse the same request so a
// single-use email token can never be consumed by two browser requests.
const pendingVerifications = new Map<string, Promise<VerificationResult>>();

function requestVerification(token: string, mode: string | null) {
  const requestKey = `${mode || "registration"}:${token}`;
  const existing = pendingVerifications.get(requestKey);
  if (existing) return existing;

  const modeQuery = mode === "email-change" ? "&mode=email-change" : "";
  const request = fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}${modeQuery}`, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(20_000),
  }).then(async (response) => {
    let body: VerifyErrorBody = {};
    try {
      body = await response.json() as VerifyErrorBody;
    } catch {
      body = { userMessage: "Máy chủ trả về dữ liệu không hợp lệ." };
    }
    return { ok: response.ok, status: response.status, body };
  });

  pendingVerifications.set(requestKey, request);
  return request;
}

export default function VerifyEmailResult() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const mode = searchParams.get("mode");
  const [state, setState] = useState<VerifyState>("loading");
  const [detail, setDetail] = useState("Đang xác thực email của bạn...");
  const [attempt, setAttempt] = useState(0);
  const mobileAppScheme = publicEnv.NEXT_PUBLIC_MOBILE_APP_SCHEME;
  const mobileAppUrl = `${mobileAppScheme}://${mode === "email-change" ? "profile" : "login"}`;

  const navigateBackWithinApp = () => {
    const fallback = mode === "email-change" ? CUSTOMER_ROUTES.SETTINGS : ROUTES.LOGIN;
    const referrer = document.referrer;
    let isSameOrigin = false;
    try {
      isSameOrigin = Boolean(referrer && new URL(referrer).origin === window.location.origin);
    } catch {
      isSameOrigin = false;
    }
    if (isSameOrigin && window.history.length > 1) {
      router.back();
    } else {
      router.push(fallback);
    }
  };

  useEffect(() => {
    let active = true;

    async function verify() {
      if (!token) {
        setState("error");
        setDetail("Link xác thực không hợp lệ vì thiếu token.");
        return;
      }

      try {
        const response = await requestVerification(token, mode);
        if (!active) return;

        if (response.ok) {
          setState("success");
          setDetail(mode === "email-change"
            ? "Email mới đã được xác thực và cập nhật. Bạn có thể dùng địa chỉ này để đăng nhập."
            : "Email đã được xác thực. Bạn có thể đăng nhập ngay bây giờ.");
        } else {
          setState("error");
          setDetail(response.body.userMessage || response.body.message || "Link xác thực không hợp lệ, đã hết hạn hoặc đã được sử dụng.");
        }
      } catch (error: unknown) {
        if (!active) return;
        setState("error");
        const timedOut = error instanceof Error && error.name === "TimeoutError";
        setDetail(timedOut
          ? "Máy chủ phản hồi quá lâu. Vui lòng kiểm tra kết nối và thử lại."
          : "Không thể xác thực email lúc này. Vui lòng thử lại sau.");
      }
    }

    void verify();
    return () => { active = false; };
  }, [attempt, mode, token]);

  const retry = () => {
    if (token) pendingVerifications.delete(`${mode || "registration"}:${token}`);
    setState("loading");
    setDetail("Đang xác thực email của bạn...");
    setAttempt((value) => value + 1);
  };

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
        <div className="space-y-3">
          {state === "success" ? (
            <>
              <a
                href={mobileAppUrl}
                className="inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-blue-600 px-4 font-bold !text-white hover:bg-blue-700"
              >
                Mở ứng dụng FAMS
              </a>
              <Link
                href={mode === "email-change" ? CUSTOMER_ROUTES.SETTINGS : ROUTES.LOGIN}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-blue-200 px-4 font-semibold text-blue-700 hover:bg-blue-50"
              >
                {mode === "email-change" ? "Mở cài đặt trên web" : "Đăng nhập trên web"}
              </Link>
            </>
          ) : (
            <button
              type="button"
              onClick={retry}
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 font-bold text-white hover:bg-blue-700"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" /> Thử lại
            </button>
          )}
          <button
            type="button"
            onClick={navigateBackWithinApp}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 font-semibold text-slate-600 hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Quay lại trang trước
          </button>
        </div>
      )}
    </div>
  );
}
