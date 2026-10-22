import type { LucideIcon } from "lucide-react";
import { ClipboardCheck, GraduationCap, School } from "lucide-react";

/** The three spaces, coloured like the books in the logo. */
export const LANDING_MENU_SPACES: { href: string; label: string; icon: LucideIcon; color: string }[] = [
  { href: "/#school", label: "სკოლა", icon: School, color: "#34d399" },
  { href: "/#exam", label: "გამოცდები", icon: ClipboardCheck, color: "#38bdf8" },
  // A soft hyphen: on the narrowest phones the long word breaks there, with a
  // hyphen, instead of running out of its tile.
  { href: "/#university", label: "უნივერ\u00ADსიტეტი", icon: GraduationCap, color: "#F4B70D" },
];

export const LANDING_MENU_LINKS = [
  { href: "/#how-it-works", label: "როგორ მუშაობს" },
  { href: "/#pricing", label: "ფასი" },
  { href: "/about", label: "ჩვენს შესახებ" },
];

/** Dragged at least this far down, the sheet closes. */
export const SHEET_CLOSE_DISTANCE = 80;
/** …or flicked down at least this fast (px/ms). */
export const SHEET_CLOSE_VELOCITY = 0.5;

export function sheetClosesOnRelease(distance: number, velocity: number): boolean {
  return distance >= SHEET_CLOSE_DISTANCE || (distance > 12 && velocity >= SHEET_CLOSE_VELOCITY);
}

/**
 * What a menu link does: scroll within this page (a `/#…` link on `/`, done
 * after the menu has closed and the page is unlocked), or a normal
 * navigation.
 */
export function menuLinkAction(href: string, pathname: string): { kind: "scroll"; id: string } | { kind: "navigate" } {
  if (href.startsWith("/#") && pathname === "/") return { kind: "scroll", id: href.slice(2) };
  return { kind: "navigate" };
}
