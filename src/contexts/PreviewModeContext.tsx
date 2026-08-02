"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

export type PreviewMode = "mock" | "live";

interface PreviewModeContextValue {
  previewMode: PreviewMode;
  setPreviewMode: (mode: PreviewMode) => void;
}

const PreviewModeContext = createContext<PreviewModeContextValue | null>(null);

export function PreviewModeProvider({ children }: { children: ReactNode }) {
  const [previewMode, setPreviewMode] = useState<PreviewMode>("mock");

  return (
    <PreviewModeContext.Provider value={{ previewMode, setPreviewMode }}>
      {children}
    </PreviewModeContext.Provider>
  );
}

export function usePreviewMode(): PreviewModeContextValue {
  const value = useContext(PreviewModeContext);
  if (!value) {
    throw new Error("usePreviewMode must be used within PreviewModeProvider");
  }
  return value;
}
