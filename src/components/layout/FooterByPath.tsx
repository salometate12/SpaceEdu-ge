"use client";

import { usePathname } from "next/navigation";
import { isPremiumAssistantPath } from "@/lib/assistant-routes";
import { useFocusMode } from "@/contexts/FocusModeContext";
import { LandingFooter } from "@/components/landing/LandingFooter";

const FULL_BLEED_PATHS = new Set(["/conspectus/stream"]);
// The landing renders its own footer inside the page, so skip it here.
const CUSTOM_FOOTER_PATHS = new Set(["/"]);
// Full-screen app surfaces: a footer below one of these only shows up as
// dead space under a full-height chat/stream, so they stay footer-less.
const NO_FOOTER_PATHS = new Set(["/ai-teacher"]);

export function FooterByPath() {
  const pathname = usePathname();
  const { focusMode } = useFocusMode();
  if (
    focusMode ||
    isPremiumAssistantPath(pathname) ||
    FULL_BLEED_PATHS.has(pathname ?? "") ||
    pathname?.startsWith("/journal") ||
    CUSTOM_FOOTER_PATHS.has(pathname ?? "") ||
    NO_FOOTER_PATHS.has(pathname ?? "") ||
    pathname?.startsWith("/admin")
  ) {
    return null;
  }
  // One footer across the whole site: the landing's full footer with its
  // product and company links, so every page ends the same way.
  return <LandingFooter />;
}
