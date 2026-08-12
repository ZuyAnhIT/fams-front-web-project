import { NextResponse, type NextRequest } from "next/server";

const providerBaseUrl = process.env.FAMS_GEOCODING_URL || "https://nominatim.openstreetmap.org";
const providerUserAgent = process.env.FAMS_GEOCODING_USER_AGENT || "FAMS-Web/0.1";

function errorResponse(message: string, status: number) {
  return NextResponse.json({ message }, { status });
}

export async function GET(request: NextRequest) {
  const mode = request.nextUrl.searchParams.get("mode");
  const upstream = new URL(mode === "reverse" ? "/reverse" : "/search", providerBaseUrl);
  upstream.searchParams.set("format", "json");
  upstream.searchParams.set("accept-language", "vi");

  if (mode === "reverse") {
    const lat = Number(request.nextUrl.searchParams.get("lat"));
    const lon = Number(request.nextUrl.searchParams.get("lon"));
    if (!Number.isFinite(lat) || lat < -90 || lat > 90 || !Number.isFinite(lon) || lon < -180 || lon > 180) {
      return errorResponse("Tọa độ không hợp lệ.", 400);
    }
    upstream.searchParams.set("lat", String(lat));
    upstream.searchParams.set("lon", String(lon));
  } else if (mode === "search") {
    const query = request.nextUrl.searchParams.get("q")?.trim() || "";
    if (query.length < 3 || query.length > 200) {
      return errorResponse("Từ khóa địa điểm phải có từ 3 đến 200 ký tự.", 400);
    }
    upstream.searchParams.set("q", query);
    upstream.searchParams.set("limit", "5");
    upstream.searchParams.set("countrycodes", "vn");
  } else {
    return errorResponse("Chế độ geocoding không hợp lệ.", 400);
  }

  try {
    const response = await fetch(upstream, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "User-Agent": providerUserAgent,
      },
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) {
      return errorResponse("Dịch vụ tìm kiếm bản đồ tạm thời không khả dụng.", 502);
    }
    return NextResponse.json(await response.json(), {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch {
    return errorResponse("Không thể kết nối dịch vụ tìm kiếm bản đồ.", 502);
  }
}
