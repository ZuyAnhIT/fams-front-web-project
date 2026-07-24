import type { NextConfig } from "next";

const backendApiUrl = process.env.FAMS_BACKEND_URL || "http://localhost:8080/api/v1";

const nextConfig: NextConfig = {
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
