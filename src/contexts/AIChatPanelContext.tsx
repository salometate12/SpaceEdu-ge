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

interface AIChatPanelContextValue {
  /** Whether the chat can be used on this route at all (the floating
   * button shows only where it is). */
  available: boolean;
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  isExpanded: boolean;
  toggleExpanded: () => void;
}

const AIChatPanelContext = createContext<AIChatPanelContextValue | null>(null);

/** Routes without the chat: the marketing and auth pages, admin, and the
 * full-page assistants (including /ai-teacher, which is the chat itself).
 * The floating button is hidden there and the window forced closed. */
function shouldForceClosePanel(pathname: string | null): boolean {
  if (!pathname) return true;
  if (
    pathname === "/" ||
    pathname === "/pricing" ||
    pathname === "/select-space" ||
    pathname === "/registration" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/admin") ||
    pathname === "/ai-teacher" ||
    pathname === "/ai-teacher/abit" ||
    isPremiumAssistantPath(pathname)
  ) {
    return true;
  }
  return false;
}

export function AIChatPanelProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const pathname = usePathname();

  // Derived during render (not synced via effect) so the panel is simply
  // never shown on routes without a way to reopen it — no state to reset.
  const available = !shouldForceClosePanel(pathname);
  const effectiveIsOpen = isOpen && available;

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);
  const toggleExpanded = useCallback(() => setIsExpanded((prev) => !prev), []);

  return (
    <AIChatPanelContext.Provider
      value={{
        available,
        isOpen: effectiveIsOpen,
        open,
        close,
        toggle,
        isExpanded: effectiveIsOpen && isExpanded,
        toggleExpanded,
      }}
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
