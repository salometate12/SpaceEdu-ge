import {
  BarChart3,
  Bell,
  CircleUser,
  Crown,
  LayoutDashboard,
  LayoutGrid,
  Palette,
  Shield,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";
import { profileHrefForSpace, statsHrefForSpace } from "@/lib/access-control";
import type { SpaceeduSpace } from "@/lib/space-back-navigation";

/**
 * The profile / settings menu.
 *
 * "მიმოხილვა" and "სტატისტიკა" live under the space-specific profile routes
 * (/profile · /profile-abiturient and their /stats), so their hrefs are
 * resolved from the viewer's space. Everything under /settings/* is shared by
 * every space (never space-guarded — see access-control).
 */
export const SETTINGS_PROFILE_HREF = "/settings/profile";
export const SETTINGS_SPACE_HREF = "/settings/space";
export const SETTINGS_SECURITY_HREF = "/settings/security";
export const SETTINGS_NOTIFICATIONS_HREF = "/settings/notifications";
export const SETTINGS_APPEARANCE_HREF = "/settings/appearance";
export const SETTINGS_PLAN_HREF = "/settings/plan";
export const SETTINGS_DANGER_HREF = "/settings/danger";
/** Phones: the menu screen every settings page goes back to. */
export const SETTINGS_MENU_HREF = "/settings";

/**
 * Pages folded into another one; the old URLs redirect (next.config.ts) to
 * their section there.
 */
export const SETTINGS_SESSIONS_HREF = `${SETTINGS_SECURITY_HREF}#sessions`;
export const SETTINGS_LANGUAGE_HREF = `${SETTINGS_APPEARANCE_HREF}#language`;
export const SETTINGS_BILLING_HREF = `${SETTINGS_PLAN_HREF}#billing`;

export interface ProfileNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  danger?: boolean;
}

export interface ProfileNavGroup {
  /** Empty for the danger zone, which sits under a divider instead. */
  title: string;
  items: ProfileNavItem[];
}

/**
 * The whole menu, with the two space-specific entries resolved for `space`
 * — the *working* space (see `active-space.ts`), not the account's. With no
 * space at all they go to the chooser, or to settings for an admin, never
 * silently to the abiturient profile.
 */
export function buildProfileNav(
  space: SpaceeduSpace | null | undefined,
  options: { isAdmin?: boolean } = {},
): ProfileNavGroup[] {
  return [
    {
      title: "ჩემი პროგრესი",
      items: [
        { href: profileHrefForSpace(space, options), label: "მიმოხილვა", icon: LayoutDashboard },
        { href: statsHrefForSpace(space, options), label: "სტატისტიკა", icon: BarChart3 },
      ],
    },
    {
      title: "ანგარიში",
      items: [
        { href: SETTINGS_PROFILE_HREF, label: "პროფილი", icon: CircleUser },
        { href: SETTINGS_SPACE_HREF, label: "სასწავლო სივრცე", icon: LayoutGrid },
        { href: SETTINGS_SECURITY_HREF, label: "უსაფრთხოება და სესიები", icon: Shield },
      ],
    },
    {
      title: "პარამეტრები",
      items: [
        { href: SETTINGS_NOTIFICATIONS_HREF, label: "შეტყობინებები", icon: Bell },
        { href: SETTINGS_APPEARANCE_HREF, label: "გარეგნობა და ენა", icon: Palette },
      ],
    },
    {
      title: "გამოწერა",
      items: [{ href: SETTINGS_PLAN_HREF, label: "პლანი და გადახდა", icon: Crown }],
    },
    {
      title: "",
      items: [
        { href: SETTINGS_DANGER_HREF, label: "საშიში ზონა", icon: TriangleAlert, danger: true },
      ],
    },
  ];
}

/** The menu item a path belongs to, for the page title and the phone's back bar. */
export function activeProfileNavItem(groups: ProfileNavGroup[], pathname: string): ProfileNavItem | null {
  for (const group of groups) {
    for (const item of group.items) {
      if (isProfileNavItemActive(pathname, item.href)) return item;
    }
  }
  return null;
}

/**
 * Whether a nav item is the active one for the current path. The two overview
 * routes are exact (so /profile doesn't light up while on /profile/stats);
 * /profile/stats and every /settings/* page match by prefix so their own
 * sub-paths stay highlighted.
 */
export function isProfileNavItemActive(pathname: string, href: string): boolean {
  const overviewRoutes = new Set([profileHrefForSpace("student"), profileHrefForSpace("abiturient")]);
  if (overviewRoutes.has(href)) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}
