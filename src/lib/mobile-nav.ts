import { isPremiumAssistantPath } from "@/lib/assistant-routes";
import { profileHrefForSpace } from "@/lib/access-control";
import type { SpaceeduSpace } from "@/lib/space-back-navigation";
import type { LucideIcon } from "lucide-react";
import {
  CalendarDays,
  Home,
  LogIn,
  Menu,
  Rocket,
  Sparkles,
  Tag,
  UserRound,
} from "lucide-react";

/** Kind tags let the dock component style each slot distinctly
 * (AI + calendar on the left, menu in the middle, theme + profile on
 * the right, with profile as the accent sphere). */
export type MobileDockKind = "ai" | "calendar" | "menu" | "profile";

export interface MobileDockItem {
  href: string;
  label: string;
  icon: LucideIcon;
  match?: (pathname: string) => boolean;
  kind?: MobileDockKind;
}

export const DASHBOARD_MOBILE_MENU_HREF = "#dashboard-mobile-menu";
export const DASHBOARD_CALENDAR_ANCHOR_HREF = "/dashboard-student#dashboard-calendar-panel";

/** One shared dock across the whole mobile app: AI · Calendar · Menu · Profile.
 * The theme toggle is rendered by the dock component between Menu and Profile. */
function appDock(space: SpaceeduSpace | null): MobileDockItem[] {
  const calendarHref =
    space === "abiturient" ? "/study-plan/abit" : space === "school" ? "/study-plan" : DASHBOARD_CALENDAR_ANCHOR_HREF;
  return [
    {
      kind: "ai",
      href: "/ai-teacher",
      label: "AI",
      icon: Sparkles,
      match: (p) => p === "/ai-teacher",
    },
    {
      kind: "calendar",
      href: calendarHref,
      label: "კალენდარი",
      icon: CalendarDays,
      match: (p) => p.startsWith("/study-plan"),
    },
    {
      kind: "menu",
      href: DASHBOARD_MOBILE_MENU_HREF,
      label: "მენიუ",
      icon: Menu,
    },
    {
      kind: "profile",
      href: profileHrefForSpace(space),
      label: "პროფილი",
      icon: UserRound,
      match: (p) => p.startsWith("/profile"),
    },
  ];
}

const LANDING_DOCK: MobileDockItem[] = [
  { href: "/", label: "მთავარი", icon: Home, match: (p) => p === "/" },
  {
    href: "/pricing",
    label: "ფასები",
    icon: Tag,
    match: (p) => p === "/pricing",
  },
  {
    href: "/select-space",
    label: "დაწყება",
    icon: Rocket,
    match: (p) => p === "/select-space",
  },
  { href: "/login", label: "შესვლა", icon: LogIn, match: (p) => p === "/login" },
];

export function mobileDockHidden(pathname: string | null): boolean {
  if (!pathname) return true;
  if (
    pathname === "/select-space" ||
    pathname === "/registration" ||
    pathname === "/privacy" ||
    pathname === "/terms" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/admin") ||
    isPremiumAssistantPath(pathname)
  ) {
    return true;
  }
  return false;
}

export function mobileDockItems(
  pathname: string | null,
  space: SpaceeduSpace | null = null,
): MobileDockItem[] {
  if (!pathname || mobileDockHidden(pathname)) return [];
  if (pathname === "/" || pathname === "/pricing") return LANDING_DOCK;
  return appDock(space);
}

/** True for the shared app dock (AI · Calendar · Menu · Profile), which the
 * dock component renders with its own centered, glossy styling. */
export function isAppDock(pathname: string | null): boolean {
  if (!pathname || mobileDockHidden(pathname)) return false;
  return pathname !== "/" && pathname !== "/pricing";
}

export function isDockItemActive(pathname: string, item: MobileDockItem): boolean {
  if (item.match) return item.match(pathname);
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}
