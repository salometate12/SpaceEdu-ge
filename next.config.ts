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
  async headers() {
    // Defence-in-depth headers, applied to every route. These are the cheap,
    // high-value protections a public site should not launch without:
    // clickjacking, MIME sniffing, referrer leakage and feature access.
    //
    // No `Content-Security-Policy` here on purpose — a strict CSP needs the
    // app's real script/style/connect origins enumerated first, and a wrong
    // one silently breaks the page. It is tracked separately.
    const securityHeaders = [
      // Refuse to be framed by any other site — the core clickjacking /
      // UI-redress (phishing overlay) defence.
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
      // Browsers must honour the declared Content-Type, not guess it.
      { key: "X-Content-Type-Options", value: "nosniff" },
      // Don't leak full URLs (which can carry ids) to other origins.
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      // Turn off powerful features the site doesn't use.
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
      },
    ];
    return [{ source: "/:path*", headers: securityHeaders }];
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
