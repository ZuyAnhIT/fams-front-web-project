import type { NextConfig } from "next";

const backendApiUrl = (process.env.FAMS_BACKEND_URL || "http://localhost:8080/api/v1").replace(/\/$/, "");
try {
  new URL(backendApiUrl);
} catch {
  throw new Error("FAMS_BACKEND_URL phải là URL tuyệt đối hợp lệ, ví dụ http://localhost:8080/api/v1");
}
const allowedDevOrigins = (process.env.FAMS_DEV_ORIGINS || "192.168.1.14")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const nextConfig: NextConfig = {
  // Next 16 blocks dev-only assets/HMR requested through a hostname other than the
  // hostname used to start the server. Without this, LAN URLs render the SSR fallback
  // but never hydrate, so token pages appear to load forever.
  allowedDevOrigins,
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${backendApiUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
