import { z } from "zod";

const isAbsoluteUrl = (value: string) => {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
};

const apiUrlSchema = z.string().min(1).refine(
  (value) => value.startsWith("/") || isAbsoluteUrl(value),
  "NEXT_PUBLIC_API_URL phải là path tương đối bắt đầu bằng / hoặc URL hợp lệ",
);

const publicEnvSchema = z.object({
  NEXT_PUBLIC_API_URL: apiUrlSchema.default("/api/v1"),
  NEXT_PUBLIC_GOOGLE_CLIENT_ID: z.string().optional(),
  NEXT_PUBLIC_MOBILE_APP_SCHEME: z.string().min(1).default("famsfrontappproject"),
  NEXT_PUBLIC_FIREBASE_API_KEY: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_APP_ID: z.string().optional(),
  NEXT_PUBLIC_MAP_STYLE_URL: z.string().min(1).default("https://tiles.openfreemap.org/styles/positron"),
  NEXT_PUBLIC_MAP_WORKER_URL: z.string().min(1).default("https://cdn.jsdelivr.net/npm/maplibre-gl@6.5.0/dist/maplibre-gl-worker.mjs"),
  NEXT_PUBLIC_MAP_TILE_URL: z.string().min(1).default("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"),
  NEXT_PUBLIC_MAP_ATTRIBUTION: z.string().min(1).default("© OpenStreetMap contributors © CARTO"),
});

const parsed = publicEnvSchema.safeParse({
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || undefined,
  NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || undefined,
  NEXT_PUBLIC_MOBILE_APP_SCHEME: process.env.NEXT_PUBLIC_MOBILE_APP_SCHEME || undefined,
  NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || undefined,
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || undefined,
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || undefined,
  NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || undefined,
  NEXT_PUBLIC_MAP_STYLE_URL: process.env.NEXT_PUBLIC_MAP_STYLE_URL || undefined,
  NEXT_PUBLIC_MAP_WORKER_URL: process.env.NEXT_PUBLIC_MAP_WORKER_URL || undefined,
  NEXT_PUBLIC_MAP_TILE_URL: process.env.NEXT_PUBLIC_MAP_TILE_URL || undefined,
  NEXT_PUBLIC_MAP_ATTRIBUTION: process.env.NEXT_PUBLIC_MAP_ATTRIBUTION || undefined,
});

if (!parsed.success) {
  throw new Error(`Cấu hình Frontend không hợp lệ: ${z.prettifyError(parsed.error)}`);
}

export const publicEnv = Object.freeze(parsed.data);

export const isGoogleConfigured = Boolean(publicEnv.NEXT_PUBLIC_GOOGLE_CLIENT_ID);

export const isFirebaseConfigured = Boolean(
  publicEnv.NEXT_PUBLIC_FIREBASE_API_KEY
    && publicEnv.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
    && publicEnv.NEXT_PUBLIC_FIREBASE_PROJECT_ID
    && publicEnv.NEXT_PUBLIC_FIREBASE_APP_ID,
);
