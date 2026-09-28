import {
  BarChart3,
  Bell,
  CreditCard,
  Crown,
  Languages,
  LayoutGrid,
  MonitorSmartphone,
  Palette,
  Shield,
  TriangleAlert,
  User,
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
export const SETTINGS_SESSIONS_HREF = "/settings/sessions";
export const SETTINGS_NOTIFICATIONS_HREF = "/settings/notifications";
export const SETTINGS_APPEARANCE_HREF = "/settings/appearance";
export const SETTINGS_LANGUAGE_HREF = "/settings/language";
export const SETTINGS_PLAN_HREF = "/settings/plan";
export const SETTINGS_BILLING_HREF = "/settings/billing";
export const SETTINGS_DANGER_HREF = "/settings/danger";

export interface ProfileNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  danger?: boolean;
}

export interface ProfileNavGroup {
  title: string;
  items: ProfileNavItem[];
}

/** The whole menu, with the two space-specific entries resolved for `space`. */
export function buildProfileNav(space: SpaceeduSpace | null | undefined): ProfileNavGroup[] {
  return [
    {
      title: "ჩემი პროგრესი",
      items: [
        { href: profileHrefForSpace(space), label: "მიმოხილვა", icon: User },
        { href: statsHrefForSpace(space), label: "სტატისტიკა", icon: BarChart3 },
      ],
    },
    {
      title: "ანგარიში",
      items: [
        { href: SETTINGS_PROFILE_HREF, label: "პროფილი", icon: User },
        { href: SETTINGS_SPACE_HREF, label: "სასწავლო სივრცე", icon: LayoutGrid },
        { href: SETTINGS_SECURITY_HREF, label: "უსაფრთხოება", icon: Shield },
        { href: SETTINGS_SESSIONS_HREF, label: "სესიები", icon: MonitorSmartphone },
      ],
    },
    {
      title: "პარამეტრები",
      items: [
        { href: SETTINGS_NOTIFICATIONS_HREF, label: "შეტყობინებები", icon: Bell },
        { href: SETTINGS_APPEARANCE_HREF, label: "გარეგნობა", icon: Palette },
        { href: SETTINGS_LANGUAGE_HREF, label: "ენა", icon: Languages },
      ],
    },
    {
      title: "გამოწერა",
      items: [
        { href: SETTINGS_PLAN_HREF, label: "პლანი", icon: Crown },
        { href: SETTINGS_BILLING_HREF, label: "გადახდა", icon: CreditCard },
      ],
    },
    {
      title: "სხვა",
      items: [
        { href: SETTINGS_DANGER_HREF, label: "საშიში ზონა", icon: TriangleAlert, danger: true },
      ],
    },
  ];
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
