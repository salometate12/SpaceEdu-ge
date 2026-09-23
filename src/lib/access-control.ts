import type { SpaceeduSpace } from "@/lib/space-back-navigation";
import type { RegistrationRoleParam } from "@/lib/registration-role";
import { DASHBOARD_ABIT_HREF, DASHBOARD_SCHOOL_HREF, DASHBOARD_STUDENT_HREF } from "@/lib/dashboard-routes";

/**
 * Accounts in this list bypass all space locking — full access to every
 * space, free switching, no redirects — and the trial deadline and paywall
 * with it (see `src/lib/subscription.ts`).
 */
export const ADMIN_EMAILS = [
  "salo.tateshvili@gmail.com",
  "tateshvilielene@gmail.com",
  "e_tateshvili@cu.edu.ge",
  "salome.tateshvili.1@btu.edu.ge",
];

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

export function statsHrefForSpace(space: SpaceeduSpace | null | undefined): string {
  if (space === "student") return "/profile/stats";
  return "/profile-abiturient/stats";
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
  { path: "/profile-abiturient/stats", space: "abiturient", match: "exact", redirectTo: "profile" },
  { path: "/ai-teacher", space: "student", match: "exact", redirectTo: "dashboard" },
];

function matchesRoute(pathname: string, route: { path: string; match: "exact" | "prefix" }): boolean {
  if (route.match === "exact") return pathname === route.path;
  return pathname === route.path || pathname.startsWith(`${route.path}/`);
}

/**
 * Routes whose URL alone tells you which space you're looking at — used
 * only to decide what the header's space chip/nav should *display*, not
 * to gate access (that's SPACE_GUARDED_ROUTES above). Broader than the
 * guarded list on purpose (e.g. includes /study-plan, which isn't
 * access-restricted by space). More specific paths are listed before
 * shorter ones they'd otherwise prefix-match (e.g. /study-plan/abit
 * before /study-plan).
 */
const SPACE_DISPLAY_ROUTES: { path: string; space: SpaceeduSpace; match: "exact" | "prefix" }[] = [
  { path: DASHBOARD_ABIT_HREF, space: "abiturient", match: "prefix" },
  { path: DASHBOARD_STUDENT_HREF, space: "student", match: "prefix" },
  { path: DASHBOARD_SCHOOL_HREF, space: "school", match: "prefix" },
  { path: "/profile-abiturient/stats", space: "abiturient", match: "exact" },
  { path: "/profile/stats", space: "student", match: "exact" },
  { path: PROFILE_ABITURIENT_HREF, space: "abiturient", match: "exact" },
  { path: PROFILE_STUDENT_HREF, space: "student", match: "exact" },
  { path: "/study-plan/abit", space: "abiturient", match: "prefix" },
  { path: "/study-plan", space: "student", match: "prefix" },
  { path: "/ai-teacher", space: "student", match: "exact" },
  { path: "/lecture-notes", space: "student", match: "prefix" },
  { path: "/journal", space: "student", match: "prefix" },
  // The rest of the student side rail. Without these the header falls
  // through to the account's own space, so an admin whose account is
  // abiturient saw the abiturient chip — and an abiturient "Dashboard"
  // link — while standing on a student-only tool.
  { path: "/presentation", space: "student", match: "prefix" },
  { path: "/syllabus", space: "student", match: "prefix" },
  { path: "/cv", space: "student", match: "prefix" },
];

/**
 * Given the current URL, returns the space that page visibly belongs to
 * (or null if the route isn't space-specific, e.g. /quiz or /ai-teacher).
 * The header uses this ahead of the account's own registered space, so
 * an admin browsing another space's dashboard sees a chip/nav that
 * matches what's actually on screen instead of their own home space.
 */
export function spaceFromPathname(pathname: string): SpaceeduSpace | null {
  for (const route of SPACE_DISPLAY_ROUTES) {
    if (matchesRoute(pathname, route)) return route.space;
  }
  return null;
}

/** Auth-entry pages a signed-in user with a space should be bounced off of. */
export const AUTH_ENTRY_PATHS = new Set(["/select-space", "/login", "/registration"]);

/**
 * A signed-in user who already has a space never needs the space chooser or the
 * auth forms. Returns their dashboard href when they land on one of those pages,
 * or null otherwise. (Admins are handled before this in the middleware.)
 */
export function authEntryRedirectHref(
  pathname: string,
  accountSpace: SpaceeduSpace | null,
): string | null {
  if (accountSpace && AUTH_ENTRY_PATHS.has(pathname)) {
    return dashboardHrefForUserSpace(accountSpace);
  }
  return null;
}

export function dashboardHrefForUserSpace(userSpace: SpaceeduSpace): string {
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

/** Where the space chooser lives — the only page that assigns a space. */
export const SELECT_SPACE_HREF = "/select-space";

export interface PostLoginResolution {
  /** Where to send the user after they sign in. */
  href: string;
  /**
   * Space to persist to localStorage (via persistSpaceForRole), or null if
   * there's nothing worth persisting. Only the two role-spaces are persisted.
   */
  persistSpace: RegistrationRoleParam | null;
  /**
   * Space to write back onto the account (supabase.auth.updateUser), or null.
   * Set only when a *non-admin* user's space came from somewhere other than
   * their account metadata (the URL role or a stored preference), so the next
   * login reads it straight from the account and never asks again. Admins are
   * never locked to a space, so this stays null for them.
   */
  writeSpaceToAccount: SpaceeduSpace | null;
}

/**
 * The single rule for where a signed-in user goes after login, shared by the
 * login form, the OAuth completion view and the space-chooser page so all
 * three behave identically. Pure — callers perform the side effects
 * (persist/updateUser) the result describes, which keeps it usable on the edge.
 *
 * Space priority: account metadata → URL ?role → stored preference. If any of
 * those is known the user lands on that dashboard. Otherwise:
 *   - an admin (who often has no space) goes to the abiturient dashboard and is
 *     never sent to the chooser;
 *   - a normal user with no space anywhere is sent to the chooser once.
 */
export function resolvePostLoginHref(input: {
  metadataSpace: SpaceeduSpace | null;
  roleSpace: SpaceeduSpace | null;
  storedSpace: SpaceeduSpace | null;
  isAdmin: boolean;
}): PostLoginResolution {
  const resolved = input.metadataSpace ?? input.roleSpace ?? input.storedSpace;

  if (resolved) {
    const persistSpace =
      resolved === "abiturient" || resolved === "student" ? resolved : null;
    // Only write to the account when this space didn't already come from it,
    // and never for an admin (keeps their account space-agnostic).
    const writeSpaceToAccount =
      !input.isAdmin && !input.metadataSpace ? resolved : null;
    return {
      href: dashboardHrefForUserSpace(resolved),
      persistSpace,
      writeSpaceToAccount,
    };
  }

  if (input.isAdmin) {
    return {
      href: DASHBOARD_ABIT_HREF,
      persistSpace: null,
      writeSpaceToAccount: null,
    };
  }

  return { href: SELECT_SPACE_HREF, persistSpace: null, writeSpaceToAccount: null };
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
