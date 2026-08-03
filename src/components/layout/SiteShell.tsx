"use client";

import { usePathname } from "next/navigation";
import { mobileDockHidden } from "@/lib/mobile-nav";
import { useAIChatPanel } from "@/contexts/AIChatPanelContext";

interface SiteShellProps {
  children: React.ReactNode;
}

export function SiteShell({ children }: SiteShellProps) {
  const pathname = usePathname();
  const dockVisible = !mobileDockHidden(pathname);
  const { isOpen } = useAIChatPanel();

  return (
    <div
      className={`flex min-h-0 flex-1 flex-col transition-[margin] duration-300 ease-in-out ${
        dockVisible ? "pb-28 md:pb-0" : ""
      } ${isOpen ? "md:mr-[420px]" : "md:mr-0"}`}
    >
      {children}
    </div>
  );
}
