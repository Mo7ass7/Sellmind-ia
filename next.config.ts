import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [{ key: "Cache-Control", value: "s-maxage=60, stale-while-revalidate=30" }],
      },
    ];
  },
};

export default nextConfig;
