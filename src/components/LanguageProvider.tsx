"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from "react";
import { userStore } from "@/lib/user-data";
import { LANGUAGE_KEY as STORAGE_KEY, LANGUAGE_UPDATED_EVENT } from "@/lib/user-data-keys";

export type Language = "ka" | "en";

/**
 * Site-wide language state, mirroring `ThemeProvider`: a context on top of
 * `localStorage`.
 *
 * Only the About page is translated so far — everything else stays
 * Georgian — but the provider sits at the root so other routes can opt in
 * later without moving it. The preference is global; `<html lang>` is not,
 * because a page that still renders Georgian must not claim otherwise.
 * Translated pages declare themselves with `useDocumentLanguage`.
 *
 * Where this differs from `ThemeProvider`: the stored value is read through
 * `useSyncExternalStore` rather than an effect. Reading it in an effect
 * would mean calling setState from inside one, which the repo's lint rules
 * reject, and this is the case the hook exists for.
 */

const listeners = new Set<() => void>();
let cached: Language | null = null;

function readStored(): Language {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === "en" || stored === "ka" ? stored : "ka";
  } catch {
    return "ka";
  }
}

function getSnapshot(): Language {
  if (cached === null) cached = readStored();
  return cached;
}

/** The server always renders Georgian, so hydration matches the markup. */
function getServerSnapshot(): Language {
  return "ka";
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  // The language chosen on another device, arriving from the account.
  const fromAccount = () => {
    cached = null;
    onChange();
  };
  window.addEventListener(LANGUAGE_UPDATED_EVENT, fromAccount);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener(LANGUAGE_UPDATED_EVENT, fromAccount);
  };
}

function writeLanguage(next: Language) {
  cached = next;
  try {
    userStore.set(STORAGE_KEY, next);
  } catch {
    // A blocked storage (private window, disabled cookies) shouldn't stop
    // the switch from working for the rest of the session.
  }
  for (const listener of listeners) listener();
}

interface LanguageContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  toggleLanguage: () => void;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const language = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setLanguage = useCallback((next: Language) => {
    writeLanguage(next);
  }, []);

  const toggleLanguage = useCallback(() => {
    writeLanguage(getSnapshot() === "ka" ? "en" : "ka");
  }, []);

  const value = useMemo(
    () => ({ language, setLanguage, toggleLanguage }),
    [language, setLanguage, toggleLanguage],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return ctx;
}

/**
 * Sets `<html lang>` to the reader's language for as long as the calling
 * page is mounted, restoring the site default on the way out. Call it only
 * from routes whose content is actually translated.
 */
export function useDocumentLanguage() {
  const { language } = useLanguage();

  useEffect(() => {
    document.documentElement.lang = language;
    return () => {
      document.documentElement.lang = "ka";
    };
  }, [language]);
}
