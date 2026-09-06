"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

const STORAGE_KEY = "spaceedu-focus-mode";

interface FocusModeContextValue {
  /** True while the workspace chrome is collapsed for distraction-free study. */
  focusMode: boolean;
  toggleFocusMode: () => void;
  setFocusMode: (value: boolean) => void;
}

const FocusModeContext = createContext<FocusModeContextValue | null>(null);

export function FocusModeProvider({ children }: { children: ReactNode }) {
  const [focusMode, setFocusModeState] = useState(false);

  // Restore the last choice after hydration so SSR and the first client
  // render agree (both start as `false`).
  useEffect(() => {
    const restore = () => {
      try {
        setFocusModeState(window.localStorage.getItem(STORAGE_KEY) === "1");
      } catch {
        /* storage unavailable */
      }
    };
    restore();
  }, []);

  const setFocusMode = useCallback((value: boolean) => {
    setFocusModeState(value);
    try {
      window.localStorage.setItem(STORAGE_KEY, value ? "1" : "0");
    } catch {
      /* storage unavailable */
    }
  }, []);

  const toggleFocusMode = useCallback(() => {
    setFocusModeState((current) => {
      const next = !current;
      try {
        window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        /* storage unavailable */
      }
      return next;
    });
  }, []);

  // Escape is the universal "give me my chrome back" key.
  useEffect(() => {
    if (!focusMode) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setFocusMode(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [focusMode, setFocusMode]);

  return (
    <FocusModeContext.Provider value={{ focusMode, toggleFocusMode, setFocusMode }}>
      {children}
    </FocusModeContext.Provider>
  );
}

/**
 * Safe outside the provider (returns a no-op disabled state) so shared
 * chrome can consult it without every tree having to opt in.
 */
export function useFocusMode(): FocusModeContextValue {
  return (
    useContext(FocusModeContext) ?? {
      focusMode: false,
      toggleFocusMode: () => {},
      setFocusMode: () => {},
    }
  );
}
