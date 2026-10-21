/**
 * The template, accent, photo and language choices, remembered in this
 * browser (the CV's own content isn't stored anywhere yet). A tiny store
 * for useSyncExternalStore: the snapshot is cached per raw value so React
 * gets the same object back until something changes.
 */

import { CV_ACCENTS, normalizeCvTemplate, type CvAccentId, type CvLanguage, type CvPrefs, type CvTemplateId } from "@/lib/cv-data";

const KEY = "spaceedu-cv-prefs";
const listeners = new Set<() => void>();

export interface StoredCvPrefs extends Partial<CvPrefs> {
  /** True once the user picked a template themselves (else ATS focus decides). */
  chosen?: boolean;
}

let cache: { raw: string | null; value: StoredCvPrefs } = { raw: null, value: {} };

export function parseCvPrefs(raw: string | null): StoredCvPrefs {
  if (!raw) return {};
  try {
    const value = JSON.parse(raw) as Record<string, unknown>;
    const prefs: StoredCvPrefs = {};
    if (value.template) prefs.template = normalizeCvTemplate(value.template);
    if (CV_ACCENTS.some((accent) => accent.id === value.accent)) prefs.accent = value.accent as CvAccentId;
    if (typeof value.showPhoto === "boolean") prefs.showPhoto = value.showPhoto;
    if (value.language === "ka" || value.language === "en") prefs.language = value.language as CvLanguage;
    if (value.chosen === true) prefs.chosen = true;
    return prefs;
  } catch {
    return {};
  }
}

export function readCvPrefs(): StoredCvPrefs {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(KEY);
  } catch {
    raw = null;
  }
  if (raw !== cache.raw) cache = { raw, value: parseCvPrefs(raw) };
  return cache.value;
}

const NO_PREFS: StoredCvPrefs = {};
/** Nothing on the server; the same object every time (useSyncExternalStore requires it). */
export const serverCvPrefs = (): StoredCvPrefs => NO_PREFS;

export function subscribeCvPrefs(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function writeCvPrefs(next: StoredCvPrefs) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify({ ...readCvPrefs(), ...next }));
  } catch {
    /* private mode: the choice just isn't remembered */
  }
  listeners.forEach((listener) => listener());
}

/** Fills in defaults: the saved template, else ATS when the ATS pill is on, else Modern. */
export function resolveCvPrefs(stored: StoredCvPrefs, atsFocus: boolean): CvPrefs & { template: CvTemplateId } {
  return {
    template: stored.chosen && stored.template ? stored.template : atsFocus ? "ats" : stored.template ?? "modern",
    accent: stored.accent ?? "navy",
    showPhoto: stored.showPhoto ?? true,
    language: stored.language ?? "ka",
  };
}
