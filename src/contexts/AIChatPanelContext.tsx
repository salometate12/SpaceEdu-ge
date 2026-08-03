"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { isPremiumAssistantPath } from "@/lib/assistant-routes";

export const AI_PANEL_WIDTH_PX = 420;

interface AIChatPanelContextValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

const AIChatPanelContext = createContext<AIChatPanelContextValue | null>(null);

/** Paths where the DashboardHeader (and its AI button) aren't shown — the
 * panel has no way to be reopened there, so force it closed. */
function shouldForceClosePanel(pathname: string | null): boolean {
  if (!pathname) return true;
  if (
    pathname === "/" ||
    pathname === "/pricing" ||
    pathname === "/select-space" ||
    pathname === "/registration" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/admin") ||
    isPremiumAssistantPath(pathname)
  ) {
    return true;
  }
  return false;
}

export function AIChatPanelProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Derived during render (not synced via effect) so the panel is simply
  // never shown on routes without a way to reopen it — no state to reset.
  const effectiveIsOpen = isOpen && !shouldForceClosePanel(pathname);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  return (
    <AIChatPanelContext.Provider
      value={{ isOpen: effectiveIsOpen, open, close, toggle }}
    >
      {children}
    </AIChatPanelContext.Provider>
  );
}

export function useAIChatPanel() {
  const ctx = useContext(AIChatPanelContext);
  if (!ctx) {
    throw new Error("useAIChatPanel must be used within AIChatPanelProvider");
  }
  return ctx;
}
