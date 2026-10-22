import { isPremiumAssistantPath } from "@/lib/assistant-routes";
import { aiTeacherHrefForSpace, profileHrefForSpace } from "@/lib/access-control";
import { dashboardHrefForSpace } from "@/lib/dashboard-routes";
import type { SpaceeduSpace } from "@/lib/space-back-navigation";
import type { LucideIcon } from "lucide-react";
import {
  CalendarDays,
  Home,
  Info,
  LayoutGrid,
  LogIn,
  Rocket,
  Sparkles,
  Tag,
  UserRound,
} from "lucide-react";
import { isAuthFormPath } from "@/lib/password-reset";

/**
 * Five fixed places, left to right: two tabs, the raised pink button in
 * the centre, two tabs. Every page fills them with what it has — the app
 * and the marketing pages share one bar.
 */
export type MobileDockSlot = "tab1" | "tab2" | "center" | "tab4" | "tab5";
export const MOBILE_DOCK_SLOTS: readonly MobileDockSlot[] = ["tab1", "tab2", "center", "tab4", "tab5"];

export interface MobileDockItem {
  slot: MobileDockSlot;
  href: string;
  label: string;
  icon: LucideIcon;
  match?: (pathname: string) => boolean;
  /** Instead of navigating: open the AI chat sheet, or the tools menu. */
  action?: "ai-chat" | "menu";
  /** Draw the signed-in user's avatar instead of the icon. */
  avatar?: boolean;
}

export const DASHBOARD_CALENDAR_ANCHOR_HREF = "/dashboard-student#dashboard-calendar-panel";

const isAiTeacherPath = (p: string) => p === "/ai-teacher" || p === "/ai-teacher/abit";

/** Inside the app: მთავარი · კალენდარი · AI · ხელსაწყოები · პროფილი. */
function appDock(space: SpaceeduSpace | null, isAdmin: boolean): MobileDockItem[] {
  const calendarHref =
    space === "abiturient"
      ? "/dashboard-abit#dashboard-calendar-panel"
      : space === "school"
        ? "/study-plan"
        : DASHBOARD_CALENDAR_ANCHOR_HREF;
  const home = dashboardHrefForSpace(space);
  return [
    {
      slot: "tab1",
      href: home,
      label: "მთავარი",
      icon: Home,
      match: (p) => p === home || p.startsWith("/dashboard") || p === "/school",
    },
    {
      slot: "tab2",
      href: calendarHref,
      label: "კალენდარი",
      icon: CalendarDays,
      match: (p) => p.startsWith("/study-plan"),
    },
    {
      slot: "center",
      href: aiTeacherHrefForSpace(space),
      label: "AI",
      icon: Sparkles,
      action: "ai-chat",
      match: isAiTeacherPath,
    },
    {
      slot: "tab4",
      href: "#mobile-tools-menu",
      label: "ხელსაწყოები",
      icon: LayoutGrid,
      action: "menu",
      // A menu, not a place: never the current page.
      match: () => false,
    },
    {
      slot: "tab5",
      href: profileHrefForSpace(space, { isAdmin }),
      label: "პროფილი",
      icon: UserRound,
      avatar: true,
      match: (p) => p.startsWith("/profile") || p.startsWith("/settings"),
    },
  ];
}

/** On the marketing pages the same five places carry the visitor's path. */
export const LANDING_DOCK: MobileDockItem[] = [
  { slot: "tab1", href: "/", label: "მთავარი", icon: Home, match: (p) => p === "/" },
  { slot: "tab2", href: "/pricing", label: "ფასები", icon: Tag, match: (p) => p === "/pricing" },
  { slot: "center", href: "/select-space", label: "დაწყება", icon: Rocket },
  { slot: "tab4", href: "/about", label: "ჩვენ შესახებ", icon: Info, match: (p) => p === "/about" },
  { slot: "tab5", href: "/login", label: "შესვლა", icon: LogIn, match: (p) => p === "/login" },
];

export function mobileDockHidden(pathname: string | null): boolean {
  if (!pathname) return true;
  if (
    pathname === "/select-space" ||
    pathname === "/registration" ||
    pathname === "/privacy" ||
    pathname === "/terms" ||
    isAuthFormPath(pathname) ||
    pathname.startsWith("/admin") ||
    isPremiumAssistantPath(pathname) ||
    // The AI teacher is a full-screen chat on phones: its input owns the
    // bottom edge, and the header menu leads back to the rest of the app.
    isAiTeacherPath(pathname)
  ) {
    return true;
  }
  return false;
}

/** Input types that bring up the on-screen keyboard. */
const KEYBOARD_INPUT_TYPES = new Set(["", "text", "search", "email", "url", "tel", "password", "number"]);

/**
 * Whether focusing this element opens the on-screen keyboard — then the
 * dock steps aside so it doesn't collide with the field. Checkboxes,
 * radios, buttons and the like don't.
 */
export function opensKeyboard(
  element: { tagName?: string; type?: string; isContentEditable?: boolean; readOnly?: boolean; disabled?: boolean } | null,
): boolean {
  if (!element || element.disabled || element.readOnly) return false;
  if (element.isContentEditable) return true;
  const tag = element.tagName?.toUpperCase();
  if (tag === "TEXTAREA") return true;
  if (tag === "INPUT") return KEYBOARD_INPUT_TYPES.has((element.type ?? "").toLowerCase());
  return false;
}

export function mobileDockItems(
  pathname: string | null,
  space: SpaceeduSpace | null = null,
  options: { isAdmin?: boolean } = {},
): MobileDockItem[] {
  if (!pathname || mobileDockHidden(pathname)) return [];
  if (pathname === "/" || pathname === "/pricing" || pathname === "/about") {
    return LANDING_DOCK;
  }
  return appDock(space, options.isAdmin ?? false);
}

export function isDockItemActive(pathname: string, item: MobileDockItem): boolean {
  if (item.match) return item.match(pathname);
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}
