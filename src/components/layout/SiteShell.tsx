"use client";

import { usePathname } from "next/navigation";
import { mobileDockHidden } from "@/lib/mobile-nav";

interface SiteShellProps {
  children: React.ReactNode;
}

/** The page column. The AI chat floats over it (bottom-right window), so the
 * page no longer makes room for it. */
export function SiteShell({ children }: SiteShellProps) {
  const pathname = usePathname();
  const dockVisible = !mobileDockHidden(pathname);

  return (
    <div
      className={`site-shell flex min-h-0 flex-1 flex-col ${
        dockVisible ? "pb-28 md:pb-0" : ""
      }`}
    >
      {children}
    </div>
  );
}
