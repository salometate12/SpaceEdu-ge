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
      // Full Content-Security-Policy. The strict directives — object-src,
      // base-uri, form-action, frame-ancestors — are the high-value,
      // no-cost ones (plugin injection, <base> hijack, form exfiltration,
      // clickjacking). script/style allow 'unsafe-inline' because Next
      // injects inline bootstrap and hydration and this app has two inline
      // <script> blocks with no nonce pipeline; tightening those needs a
      // nonce in middleware and is tracked separately. connect-src is
      // limited to self plus Supabase (auth/db from the browser) and
      // Vercel's telemetry.
      {
        key: "Content-Security-Policy",
        value: [
          "default-src 'self'",
          "base-uri 'self'",
          "object-src 'none'",
          "frame-ancestors 'none'",
          "form-action 'self'",
          "img-src 'self' data: blob: https:",
          "font-src 'self' data:",
          "style-src 'self' 'unsafe-inline'",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
          "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.vercel-insights.com https://*.vercel-scripts.com",
          "worker-src 'self' blob:",
          "manifest-src 'self'",
        ].join("; "),
      },
      { key: "X-Frame-Options", value: "DENY" },
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
