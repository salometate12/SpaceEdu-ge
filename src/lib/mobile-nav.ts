import { isPremiumAssistantPath } from "@/lib/assistant-routes";
import { DASHBOARD_ABIT_HREF } from "@/lib/dashboard-routes";
import type { LucideIcon } from "lucide-react";
import {
  Calculator,
  Flame,
  Home,
  LayoutDashboard,
  LogIn,
  MessageSquare,
  Rocket,
  Tag,
  UserRound,
} from "lucide-react";

export interface MobileDockItem {
  href: string;
  label: string;
  icon: LucideIcon;
  match?: (pathname: string) => boolean;
}

const APP_DOCK: MobileDockItem[] = [
  {
    href: DASHBOARD_ABIT_HREF,
    label: "დეშბორდი",
    icon: LayoutDashboard,
    match: (p) =>
      p.startsWith("/dashboard") ||
      p === "/school" ||
      p.startsWith("/subject"),
  },
  {
    href: "/exam-calculator",
    label: "კალკულატორი",
    icon: Calculator,
    match: (p) => p.startsWith("/exam-calculator"),
  },
  {
    href: "/quiz",
    label: "Quiz",
    icon: Flame,
    match: (p) => p === "/quiz",
  },
  {
    href: "/ai-teacher",
    label: "AI",
    icon: MessageSquare,
    match: (p) => p === "/ai-teacher",
  },
  {
    href: "/profile",
    label: "პროფილი",
    icon: UserRound,
    match: (p) => p.startsWith("/profile"),
  },
];

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

export function mobileDockItems(pathname: string | null): MobileDockItem[] {
  if (!pathname || mobileDockHidden(pathname)) return [];
  if (pathname === "/" || pathname === "/pricing") return LANDING_DOCK;
  return APP_DOCK;
}

export function isDockItemActive(pathname: string, item: MobileDockItem): boolean {
  if (item.match) return item.match(pathname);
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}
