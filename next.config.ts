import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdf-parse"],
  experimental: {
    serverActions: {
      bodySizeLimit: "25mb",
    },
  },
  turbopack: {
    root: process.cwd(),
  },
  async redirects() {
    return [
      {
        source: "/deck/georgian-literature-2026",
        destination: "/subject/georgian",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
