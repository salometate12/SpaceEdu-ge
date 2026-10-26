"use client";

import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import { isPremiumAssistantPath } from "@/lib/assistant-routes";
import { AUTH_FORM_PATHS } from "@/lib/password-reset";

const HEADERLESS_PREFIXES = ["/select-space", "/registration", ...AUTH_FORM_PATHS];

function isHeaderlessPath(pathname: string | null): boolean {
  if (!pathname) return false;
  if (HEADERLESS_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return true;
  }
  return isPremiumAssistantPath(pathname);
}

/** Fixed toggle on routes without the main site header. */
export function SiteThemeAccess() {
  const pathname = usePathname();
  // /select-space has its own toggle in the top bar.
  if (!isHeaderlessPath(pathname) || pathname === "/select-space") return null;

  return (
    <div className="fixed bottom-6 right-6 z-[70]">
      <ThemeToggle showLabel className="shadow-lg shadow-black/10 dark:shadow-black/40" />
    </div>
  );
}
