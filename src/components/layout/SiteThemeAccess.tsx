"use client";

import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import { isPremiumAssistantPath } from "@/lib/assistant-routes";

/**
 * Fixed toggle on the premium assistant pages, which have no site header.
 * The other header-less pages (/select-space, the auth pages) carry the
 * toggle in their own top bar.
 */
export function SiteThemeAccess() {
  const pathname = usePathname();
  if (!pathname || !isPremiumAssistantPath(pathname)) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[70]">
      <ThemeToggle showLabel className="shadow-lg shadow-black/10 dark:shadow-black/40" />
    </div>
  );
}
