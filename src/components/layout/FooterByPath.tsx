"use client";

import { usePathname } from "next/navigation";
import { isPremiumAssistantPath } from "@/lib/assistant-routes";
import { SiteFooter } from "./SiteFooter";

const FULL_BLEED_PATHS = new Set(["/conspectus/stream"]);

export function FooterByPath() {
  const pathname = usePathname();
  if (
    isPremiumAssistantPath(pathname) ||
    FULL_BLEED_PATHS.has(pathname ?? "") ||
    pathname?.startsWith("/admin")
  ) {
    return null;
  }
  return <SiteFooter />;
}
