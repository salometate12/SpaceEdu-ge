"use client";

import { useEffect, useSyncExternalStore } from "react";

/** Below this much lost height, it's the browser's toolbar, not a keyboard. */
const KEYBOARD_MIN = 120;

/**
 * Keeps a full-screen chat inside what's actually visible on a phone. When
 * the on-screen keyboard opens, iOS Safari shrinks only the *visual*
 * viewport (and may pan it), so a layout pinned to 100dvh ends up with its
 * input under the keyboard. This mirrors `visualViewport` into CSS
 * variables on <html> — `--vv-h` (height) and `--vv-top` (pan offset) — and
 * sets `keyboard-open` while the keyboard is up. Android, with
 * `interactive-widget=resizes-content`, gets the same numbers.
 */
export function useMobileChatViewport() {
  useEffect(() => {
    const viewport = window.visualViewport;
    const root = document.documentElement;
    if (!viewport) return;
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        root.style.setProperty("--vv-h", `${Math.round(viewport.height)}px`);
        root.style.setProperty("--vv-top", `${Math.round(viewport.offsetTop)}px`);
        root.classList.toggle("keyboard-open", window.innerHeight - viewport.height > KEYBOARD_MIN);
      });
    };
    update();
    viewport.addEventListener("resize", update);
    viewport.addEventListener("scroll", update);
    return () => {
      cancelAnimationFrame(frame);
      viewport.removeEventListener("resize", update);
      viewport.removeEventListener("scroll", update);
      root.style.removeProperty("--vv-h");
      root.style.removeProperty("--vv-top");
      root.classList.remove("keyboard-open");
    };
  }, []);
}

function mediaStore(query: string) {
  return {
    subscribe(onChange: () => void) {
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    read: () => window.matchMedia(query).matches,
  };
}

const phone = mediaStore("(max-width: 767.98px)");
const touch = mediaStore("(hover: none) and (pointer: coarse)");
const never = () => false;

/** Phone-width layout (below `md`). */
export function useIsPhoneLayout(): boolean {
  return useSyncExternalStore(phone.subscribe, phone.read, never);
}

/** A touch-first device: Enter there adds a line instead of sending. */
export function useIsTouchDevice(): boolean {
  return useSyncExternalStore(touch.subscribe, touch.read, never);
}
