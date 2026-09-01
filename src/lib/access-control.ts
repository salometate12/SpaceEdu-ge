import type { SpaceeduSpace } from "@/lib/space-back-navigation";
import { DASHBOARD_ABIT_HREF, DASHBOARD_SCHOOL_HREF, DASHBOARD_STUDENT_HREF } from "@/lib/dashboard-routes";

/**
 * Accounts in this list bypass all space locking — full access to every
 * space, free switching, no redirects.
 */
export const ADMIN_EMAILS = ["salo.tateshvili@gmail.com"];

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.some((admin) => admin.toLowerCase() === email.toLowerCase());
}

export const PROFILE_STUDENT_HREF = "/profile";
export const PROFILE_ABITURIENT_HREF = "/profile-abiturient";

export function profileHrefForSpace(space: SpaceeduSpace | null | undefined): string {
  if (space === "student") return PROFILE_STUDENT_HREF;
  return PROFILE_ABITURIENT_HREF;
}

export function studyPlanHrefForSpace(space: SpaceeduSpace | null | undefined): string {
  if (space === "student") return "/study-plan";
  return "/study-plan/abit";
}

/**
 * Routes that belong to exactly one space. A signed-in, non-admin user
 * whose account space doesn't match gets redirected to their own
 * equivalent instead of seeing (or silently switching into) another
 * space's dashboard/profile.
 *
 * "prefix" routes guard the whole namespace (e.g. /dashboard-student/*).
 * "exact" routes guard only that one path, so shared sub-pages like
 * /profile/edit stay reachable from either space's profile page.
 */
export const SPACE_GUARDED_ROUTES: {
  path: string;
  space: SpaceeduSpace;
  match: "exact" | "prefix";
  redirectTo: "profile" | "dashboard";
}[] = [
  { path: DASHBOARD_ABIT_HREF, space: "abiturient", match: "prefix", redirectTo: "dashboard" },
  { path: DASHBOARD_STUDENT_HREF, space: "student", match: "prefix", redirectTo: "dashboard" },
  { path: DASHBOARD_SCHOOL_HREF, space: "school", match: "prefix", redirectTo: "dashboard" },
  { path: PROFILE_ABITURIENT_HREF, space: "abiturient", match: "exact", redirectTo: "profile" },
  { path: PROFILE_STUDENT_HREF, space: "student", match: "exact", redirectTo: "profile" },
  { path: "/profile/stats", space: "student", match: "exact", redirectTo: "profile" },
];

function matchesRoute(pathname: string, route: { path: string; match: "exact" | "prefix" }): boolean {
  if (route.match === "exact") return pathname === route.path;
  return pathname === route.path || pathname.startsWith(`${route.path}/`);
}

function dashboardHrefForUserSpace(userSpace: SpaceeduSpace): string {
  switch (userSpace) {
    case "abiturient":
      return DASHBOARD_ABIT_HREF;
    case "school":
      return DASHBOARD_SCHOOL_HREF;
    case "student":
    default:
      return DASHBOARD_STUDENT_HREF;
  }
}

/**
 * Given a request path and the signed-in user's assigned space, returns
 * the href they should be redirected to, or null if the path is fine
 * (not guarded, or already matches their own space).
 */
export function getSpaceRedirectHref(
  pathname: string,
  userSpace: SpaceeduSpace,
): string | null {
  for (const route of SPACE_GUARDED_ROUTES) {
    if (matchesRoute(pathname, route) && route.space !== userSpace) {
      return route.redirectTo === "profile"
        ? profileHrefForSpace(userSpace)
        : dashboardHrefForUserSpace(userSpace);
    }
  }

  return null;
}
