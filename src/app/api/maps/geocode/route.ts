import { NextResponse, type NextRequest } from "next/server";

type GeocodingProvider = "auto" | "geoapify" | "photon" | "nominatim";
type ConcreteGeocodingProvider = Exclude<GeocodingProvider, "auto">;
type GeocodingMode = "reverse" | "search";

interface StandardGeocodingResult {
  display_name: string;
  lat: string;
  lon: string;
}

interface GeocodingInput {
  mode: GeocodingMode;
  lat?: number;
  lon?: number;
  query?: string;
}

const configuredProvider = (process.env.FAMS_GEOCODING_PROVIDER || "auto") as GeocodingProvider;
const geoapifyApiKey = process.env.GEOAPIFY_API_KEY?.trim();
const providerUserAgent = process.env.FAMS_GEOCODING_USER_AGENT || "FAMS-Web/0.1";

if (!["auto", "geoapify", "photon", "nominatim"].includes(configuredProvider)) {
  throw new Error("FAMS_GEOCODING_PROVIDER chỉ hỗ trợ auto, geoapify, photon hoặc nominatim");
}
if (configuredProvider === "geoapify" && !geoapifyApiKey) {
  throw new Error("GEOAPIFY_API_KEY là bắt buộc khi FAMS_GEOCODING_PROVIDER=geoapify");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function toStandardResult(displayName: unknown, lat: unknown, lon: unknown): StandardGeocodingResult | null {
  const latitude = typeof lat === "number" ? lat : Number(lat);
  const longitude = typeof lon === "number" ? lon : Number(lon);
  if (typeof displayName !== "string" || !displayName.trim()
    || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }
  return {
    display_name: displayName.trim(),
    lat: String(latitude),
    lon: String(longitude),
  };
}

function normalizePhotonFeature(value: unknown): StandardGeocodingResult | null {
  if (!isRecord(value) || !isRecord(value.geometry) || !Array.isArray(value.geometry.coordinates)) {
    return null;
  }

  const [longitude, latitude] = value.geometry.coordinates;
  const properties = isRecord(value.properties) ? value.properties : {};
  const addressParts = [
    properties.name,
    [properties.housenumber, properties.street].filter((part) => typeof part === "string" && part.trim()).join(" "),
    properties.locality,
    properties.district,
    properties.city,
    properties.state,
    properties.postcode,
    properties.country,
  ].filter((part): part is string => typeof part === "string" && Boolean(part.trim()));
  const uniqueAddressParts = addressParts.filter(
    (part, index) => addressParts.findIndex((candidate) => candidate.toLocaleLowerCase() === part.toLocaleLowerCase()) === index,
  );

  return toStandardResult(uniqueAddressParts.join(", ") || `${latitude}, ${longitude}`, latitude, longitude);
}

function normalizeProviderResponse(provider: ConcreteGeocodingProvider, value: unknown): StandardGeocodingResult[] {
  if (provider === "photon") {
    if (!isRecord(value) || !Array.isArray(value.features)) return [];
    return value.features
      .map(normalizePhotonFeature)
      .filter((item): item is StandardGeocodingResult => item !== null);
  }

  if (provider === "geoapify") {
    if (!isRecord(value) || !Array.isArray(value.results)) return [];
    return value.results
      .map((item) => isRecord(item) ? toStandardResult(item.formatted, item.lat, item.lon) : null)
      .filter((item): item is StandardGeocodingResult => item !== null);
  }

  const results = Array.isArray(value) ? value : [value];
  return results
    .map((item) => isRecord(item) ? toStandardResult(item.display_name, item.lat, item.lon) : null)
    .filter((item): item is StandardGeocodingResult => item !== null);
}

function getProviders(): ConcreteGeocodingProvider[] {
  if (configuredProvider !== "auto") return [configuredProvider];
  return geoapifyApiKey ? ["geoapify", "photon"] : ["photon"];
}

function getProviderBaseUrl(provider: ConcreteGeocodingProvider): string {
  if (configuredProvider !== "auto" && process.env.FAMS_GEOCODING_URL?.trim()) {
    return process.env.FAMS_GEOCODING_URL.trim();
  }
  if (provider === "geoapify") return "https://api.geoapify.com/v1/geocode";
  if (provider === "photon") return "https://photon.komoot.io";
  return "https://nominatim.openstreetmap.org";
}

function createUpstreamUrl(provider: ConcreteGeocodingProvider, input: GeocodingInput): URL {
  const path = provider === "photon"
    ? (input.mode === "reverse" ? "/reverse" : "/api")
    : (input.mode === "reverse" ? "/reverse" : "/search");
  const upstream = new URL(path, getProviderBaseUrl(provider));

  if (provider === "nominatim") {
    upstream.searchParams.set("format", "json");
    upstream.searchParams.set("accept-language", "vi");
  } else if (provider === "geoapify") {
    upstream.searchParams.set("format", "json");
    upstream.searchParams.set("lang", "vi");
    upstream.searchParams.set("apiKey", geoapifyApiKey!);
  }

  if (input.mode === "reverse") {
    upstream.searchParams.set("lat", String(input.lat));
    upstream.searchParams.set("lon", String(input.lon));
    upstream.searchParams.set("limit", "1");
  } else {
    upstream.searchParams.set(provider === "geoapify" ? "text" : "q", input.query!);
    upstream.searchParams.set("limit", "5");
    if (provider === "geoapify") upstream.searchParams.set("filter", "countrycode:vn");
    if (provider === "photon") upstream.searchParams.set("countrycode", "VN");
    if (provider === "nominatim") upstream.searchParams.set("countrycodes", "vn");
  }

  return upstream;
}

async function queryProvider(provider: ConcreteGeocodingProvider, input: GeocodingInput) {
  const response = await fetch(createUpstreamUrl(provider, input), {
    cache: "no-store",
    headers: {
      Accept: "application/json",
      "User-Agent": providerUserAgent,
    },
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) throw new Error(`${provider} responded with ${response.status}`);
  return normalizeProviderResponse(provider, await response.json());
}

function errorResponse(message: string, status: number) {
  return NextResponse.json({ message }, { status });
}

function parseInput(request: NextRequest): GeocodingInput | NextResponse {
  const mode = request.nextUrl.searchParams.get("mode");
  if (mode === "reverse") {
    const lat = Number(request.nextUrl.searchParams.get("lat"));
    const lon = Number(request.nextUrl.searchParams.get("lon"));
    if (!Number.isFinite(lat) || lat < -90 || lat > 90 || !Number.isFinite(lon) || lon < -180 || lon > 180) {
      return errorResponse("Tọa độ không hợp lệ.", 400);
    }
    return { mode, lat, lon };
  }
  if (mode === "search") {
    const query = request.nextUrl.searchParams.get("q")?.trim() || "";
    if (query.length < 3 || query.length > 200) {
      return errorResponse("Từ khóa địa điểm phải có từ 3 đến 200 ký tự.", 400);
    }
    return { mode, query };
  }
  return errorResponse("Chế độ geocoding không hợp lệ.", 400);
}

export async function GET(request: NextRequest) {
  const input = parseInput(request);
  if (input instanceof NextResponse) return input;

  for (const provider of getProviders()) {
    try {
      const results = await queryProvider(provider, input);
      const data = input.mode === "reverse" ? (results[0] || {}) : results;
      return NextResponse.json(data, {
        headers: { "Cache-Control": "private, no-store" },
      });
    } catch (error) {
      console.warn(`Geocoding provider ${provider} failed.`, error);
    }
  }

  return errorResponse("Không thể kết nối dịch vụ tìm kiếm bản đồ.", 502);
}
