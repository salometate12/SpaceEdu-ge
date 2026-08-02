"use client";

import { usePathname } from "next/navigation";
import { mobileDockHidden } from "@/lib/mobile-nav";

interface SiteShellProps {
  children: React.ReactNode;
}

export function SiteShell({ children }: SiteShellProps) {
  const pathname = usePathname();
  const dockVisible = !mobileDockHidden(pathname);

  return (
    <div
      className={`flex min-h-0 flex-1 flex-col ${dockVisible ? "pb-28 md:pb-0" : ""}`}
    >
      {children}
    </div>
  );
}
