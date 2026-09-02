"use client";

import { usePathname } from "next/navigation";
import { isPremiumAssistantPath } from "@/lib/assistant-routes";
import { SiteFooter } from "./SiteFooter";

const FULL_BLEED_PATHS = new Set(["/conspectus/stream"]);
const CUSTOM_FOOTER_PATHS = new Set(["/"]);
const NO_FOOTER_PATHS = new Set(["/privacy", "/terms"]);

export function FooterByPath() {
  const pathname = usePathname();
  if (
    isPremiumAssistantPath(pathname) ||
    FULL_BLEED_PATHS.has(pathname ?? "") ||
    pathname?.startsWith("/lecture-notes") ||
    CUSTOM_FOOTER_PATHS.has(pathname ?? "") ||
    NO_FOOTER_PATHS.has(pathname ?? "") ||
    pathname?.startsWith("/admin")
  ) {
    return null;
  }
  return <SiteFooter />;
}
