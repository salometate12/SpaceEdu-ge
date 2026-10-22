"use client";

import { useSyncExternalStore } from "react";

/**
 * Full-screen overlays on phones (the landing menu sheet, …): while one is
 * open the dock steps aside and the page underneath doesn't scroll.
 */
const open = new Set<string>();
const listeners = new Set<() => void>();
let locked = false;

const notify = () => listeners.forEach((listener) => listener());

/** Stops the page underneath from scrolling, keeping its position.
 *
 * The scroll is stopped on <html>. <body> carries overflow-x:hidden, which
 * normally passes up to the viewport; once <html> is hidden it would stay on
 * the body and make it a scroll container of its own — and the sticky
 * header would stick to that, vanishing off the top. So the body is set to
 * visible meanwhile (<html> still clips). Touch scrolling is also stopped by
 * the overlay itself (`touch-action: none`). */
function lockScroll() {
  if (locked) return;
  locked = true;
  document.documentElement.style.overflow = "hidden";
  document.documentElement.style.overscrollBehavior = "none";
  document.body.style.overflow = "visible";
}

function unlockScroll() {
  if (!locked) return;
  locked = false;
  document.documentElement.style.removeProperty("overflow");
  document.documentElement.style.removeProperty("overscroll-behavior");
  document.body.style.removeProperty("overflow");
}

export function setMobileOverlay(id: string, isOpen: boolean) {
  const had = open.has(id);
  if (isOpen === had) return;
  if (isOpen) open.add(id);
  else open.delete(id);
  if (open.size > 0) lockScroll();
  else unlockScroll();
  notify();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** True while any full-screen overlay is open. */
export function useMobileOverlayOpen(): boolean {
  return useSyncExternalStore(subscribe, () => open.size > 0, () => false);
}
