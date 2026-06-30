import { NextRequest, NextResponse } from "next/server";

/**
 * Middleware xử lý redirect thông minh cho invitation links.
 * 
 * Vấn đề: next.config.ts redirects chặn CẢ GET lẫn POST requests.
 * Khi người dùng click link trong email (GET) → cần redirect sang /accept-invite
 * Khi Frontend gọi API accept (POST) → cần proxy sang Backend, KHÔNG redirect
 * 
 * Giải pháp: Dùng middleware để chỉ redirect GET requests.
 */
export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Chỉ xử lý đường dẫn invitation accept
  if (pathname === "/api/v1/invitations/accept" && request.method === "GET") {
    const url = request.nextUrl.clone();
    url.pathname = "/accept-invite";
    // Giữ nguyên query params (token=xxx)
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/v1/invitations/accept"],
};
