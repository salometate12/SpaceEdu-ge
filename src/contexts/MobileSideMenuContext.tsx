"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

interface MobileSideMenuContextValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

const MobileSideMenuContext = createContext<MobileSideMenuContextValue | null>(null);

export function MobileSideMenuProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const value = useMemo<MobileSideMenuContextValue>(
    () => ({
      isOpen,
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
      toggle: () => setIsOpen((prev) => !prev),
    }),
    [isOpen],
  );

  return (
    <MobileSideMenuContext.Provider value={value}>{children}</MobileSideMenuContext.Provider>
  );
}

export function useMobileSideMenu() {
  const ctx = useContext(MobileSideMenuContext);
  if (!ctx) {
    throw new Error("useMobileSideMenu must be used within a MobileSideMenuProvider");
  }
  return ctx;
}
