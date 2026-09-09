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

/**
 * The dock has four fixed slots, and every page fills them with whatever
 * it has: two plain icons, one primary action in a white circle (the
 * bottom-bar echo of the header's white call to action) and the accent
 * sphere on the right. Naming the slots rather than the destinations is
 * what lets the marketing pages and the app share one bar.
 */
export type MobileDockSlot = "first" | "second" | "primary" | "accent";

export interface MobileDockItem {
  href: string;
  label: string;
  icon: LucideIcon;
  match?: (pathname: string) => boolean;
  slot: MobileDockSlot;
}

export const DASHBOARD_MOBILE_MENU_HREF = "#dashboard-mobile-menu";
export const DASHBOARD_CALENDAR_ANCHOR_HREF = "/dashboard-student#dashboard-calendar-panel";

/** Inside the app: AI · Calendar · Menu · Profile. */
function appDock(space: SpaceeduSpace | null): MobileDockItem[] {
  const calendarHref =
    space === "abiturient"
      ? "/dashboard-abit#dashboard-calendar-panel"
      : space === "school"
        ? "/study-plan"
        : DASHBOARD_CALENDAR_ANCHOR_HREF;
  return [
    {
      slot: "first",
      href: "/ai-teacher",
      label: "AI",
      icon: Sparkles,
      match: (p) => p === "/ai-teacher",
    },
    {
      slot: "second",
      href: calendarHref,
      label: "კალენდარი",
      icon: CalendarDays,
      match: (p) => p.startsWith("/study-plan"),
    },
    {
      slot: "primary",
      href: DASHBOARD_MOBILE_MENU_HREF,
      label: "მენიუ",
      icon: Menu,
    },
    {
      slot: "accent",
      href: profileHrefForSpace(space),
      label: "პროფილი",
      icon: UserRound,
      match: (p) => p.startsWith("/profile"),
    },
  ];
}

/** On the marketing pages the same four slots carry the visitor's path —
 *  home, pricing, the call to action, and signing in. */
const LANDING_DOCK: MobileDockItem[] = [
  { slot: "first", href: "/", label: "მთავარი", icon: Home, match: (p) => p === "/" },
  {
    slot: "second",
    href: "/pricing",
    label: "ფასები",
    icon: Tag,
    match: (p) => p === "/pricing",
  },
  {
    slot: "primary",
    href: "/select-space",
    label: "დაწყება",
    icon: Rocket,
  },
  {
    slot: "accent",
    href: "/login",
    label: "შესვლა",
    icon: LogIn,
    match: (p) => p === "/login",
  },
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
  if (pathname === "/" || pathname === "/pricing" || pathname === "/about") {
    return LANDING_DOCK;
  }
  return appDock(space);
}

export function isDockItemActive(pathname: string, item: MobileDockItem): boolean {
  if (item.match) return item.match(pathname);
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}
