import type { MetadataRoute } from "next";

const SITE_URL = "https://www.spaceedu.ge";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/admin",
          "/admin/",
          "/dashboard",
          "/dashboard-abit",
          "/dashboard-student",
          "/profile",
          "/profile/",
          "/settings",
          "/notifications",
          "/messages",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
