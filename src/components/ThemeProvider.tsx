"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useSyncExternalStore,
} from "react";
import { userStore } from "@/lib/user-data";
import { ANIMATIONS_KEY, ANIMATIONS_UPDATED_EVENT, THEME_EVENT, THEME_KEY } from "@/lib/user-data-keys";

export type Theme = "light" | "dark";
/** What the user chose: an explicit theme, or "system" to follow the OS. */
export type ThemePreference = "light" | "dark" | "system";

interface ThemeContextValue {
  /** The resolved theme actually in effect (never "system"). */
  theme: Theme;
  /** The user's stored choice, including "system". */
  preference: ThemePreference;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  setPreference: (preference: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);


function systemTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function resolveTheme(preference: ThemePreference): Theme {
  return preference === "system" ? systemTheme() : preference;
}

/** Apply the resolved theme to <html> and persist the *preference*. */
function applyPreference(preference: ThemePreference) {
  const resolved = resolveTheme(preference);
  document.documentElement.classList.toggle("dark", resolved === "dark");
  // The first-paint inline script in layout.tsx reads this same key and treats
  // anything other than "light"/"dark" (i.e. "system") as follow-the-OS.
  // Kept as bare text, and on the account (the same theme on every device).
  userStore.set(THEME_KEY, preference);
}

// --- External store: the source of truth is localStorage + the OS media query,
// read through useSyncExternalStore so there is no setState-in-effect and no
// hydration mismatch (the server snapshot is always "dark", matching the inline
// script's default before hydration).

function subscribe(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(THEME_EVENT, callback);
  window.addEventListener("storage", callback);
  const mql = window.matchMedia("(prefers-color-scheme: dark)");
  mql.addEventListener("change", callback);
  return () => {
    window.removeEventListener(THEME_EVENT, callback);
    window.removeEventListener("storage", callback);
    mql.removeEventListener("change", callback);
  };
}

function readPreferenceSnapshot(): ThemePreference {
  if (typeof window === "undefined") return "dark";
  try {
    const stored = localStorage.getItem("theme");
    if (stored === "light" || stored === "dark" || stored === "system") return stored;
  } catch {
    /* ignore */
  }
  return "dark";
}

function notify() {
  window.dispatchEvent(new Event(THEME_EVENT));
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const preference = useSyncExternalStore(
    subscribe,
    readPreferenceSnapshot,
    () => "dark" as ThemePreference,
  );
  const theme = resolveTheme(preference);

  // A theme chosen on another device arrives through the store: apply it
  // to <html> here too (DOM only).
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  // Same for the animations switch (the first-paint script covers reloads).
  useEffect(() => {
    const apply = () =>
      document.documentElement.classList.toggle("no-animations", localStorage.getItem(ANIMATIONS_KEY) === "off");
    window.addEventListener(ANIMATIONS_UPDATED_EVENT, apply);
    return () => window.removeEventListener(ANIMATIONS_UPDATED_EVENT, apply);
  }, []);

  const setPreference = useCallback((next: ThemePreference) => {
    applyPreference(next);
    notify();
  }, []);

  const setTheme = useCallback((next: Theme) => setPreference(next), [setPreference]);

  const toggleTheme = useCallback(() => {
    const current = resolveTheme(readPreferenceSnapshot());
    setPreference(current === "light" ? "dark" : "light");
  }, [setPreference]);

  return (
    <ThemeContext.Provider value={{ theme, preference, toggleTheme, setTheme, setPreference }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}
