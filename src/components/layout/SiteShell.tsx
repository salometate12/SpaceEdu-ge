"use client";

import { usePathname } from "next/navigation";
import { mobileDockHidden } from "@/lib/mobile-nav";
import { AI_TEACHER_ABIT_HREF, AI_TEACHER_STUDENT_HREF } from "@/lib/access-control";

/** Pages that are exactly one screen tall and keep room for the dock
 * inside themselves (the AI teacher's input sits above it), so the shell's
 * dock padding would only add a blank band and a scroll. */
const OWNS_DOCK_SPACE = new Set([AI_TEACHER_STUDENT_HREF, AI_TEACHER_ABIT_HREF]);

interface SiteShellProps {
  children: React.ReactNode;
}

/** The page column. The AI chat floats over it (bottom-right window), so the
 * page no longer makes room for it. */
export function SiteShell({ children }: SiteShellProps) {
  const pathname = usePathname();
  const dockVisible = !mobileDockHidden(pathname) && !OWNS_DOCK_SPACE.has(pathname ?? "");

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
