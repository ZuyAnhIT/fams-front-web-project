import { NextResponse, type NextRequest } from "next/server";

const backendApiUrl = process.env.FAMS_BACKEND_URL || "http://localhost:8080/api/v1";

/** BFF endpoint để trang kết quả verify gọi backend mà không lặp qua Proxy email-link. */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  const mode = request.nextUrl.searchParams.get("mode");
  if (!token) {
    return NextResponse.json(
      {
        success: false,
        errorCode: "MISSING_PARAMETER",
        userMessage: "Link xác thực thiếu token.",
      },
      { status: 400 },
    );
  }

  try {
    const endpoint = mode === "email-change"
      ? "/auth/profile/email/confirm-change"
      : "/auth/verify-email";
    const backendResponse = await fetch(
      `${backendApiUrl}${endpoint}?token=${encodeURIComponent(token)}`,
      {
        cache: "no-store",
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(15_000),
      },
    );
    const body = await backendResponse.text();
    return new NextResponse(body, {
      status: backendResponse.status,
      headers: { "Content-Type": backendResponse.headers.get("Content-Type") || "application/json" },
    });
  } catch (error: unknown) {
    const timedOut = error instanceof Error && error.name === "TimeoutError";
    return NextResponse.json(
      {
        success: false,
        errorCode: timedOut ? "BACKEND_TIMEOUT" : "BACKEND_UNAVAILABLE",
        userMessage: timedOut
          ? "Máy chủ xác thực phản hồi quá lâu. Vui lòng thử lại."
          : "Không thể kết nối máy chủ xác thực. Vui lòng thử lại sau.",
      },
      { status: timedOut ? 504 : 502 },
    );
  }
}
