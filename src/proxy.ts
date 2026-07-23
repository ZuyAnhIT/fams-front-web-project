import { type NextRequest, NextResponse } from "next/server";

/**
 * Chỉ chuyển các link GET từ email sang page tương ứng.
 * Các request POST cùng path phải tiếp tục đi qua rewrite để tới backend.
 */
export function proxy(request: NextRequest) {
  if (request.method !== "GET") {
    return NextResponse.next();
  }

  const redirectMap: Record<string, string> = {
    "/api/v1/invitations/accept": "/accept-invite",
    "/api/v1/auth/reset-password": "/reset-password",
  };

  const destination = redirectMap[request.nextUrl.pathname];
  if (!destination) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = destination;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    "/api/v1/invitations/accept",
    "/api/v1/auth/reset-password",
  ],
};
