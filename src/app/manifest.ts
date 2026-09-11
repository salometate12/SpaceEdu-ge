import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SpaceEdu",
    short_name: "SpaceEdu",
    description:
      "ქართული AI სასწავლო პლატფორმა აბიტურიენტებისთვის და სტუდენტებისთვის.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    lang: "ka",
    dir: "ltr",
    background_color: "#0a0a0f",
    theme_color: "#7c3aed",
    icons: [
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
