import type { SpaceeduSpace } from "@/lib/space-back-navigation";

export const DASHBOARD_ABIT_HREF = "/dashboard-abit";
export const DASHBOARD_STUDENT_HREF = "/dashboard-student";
export const DASHBOARD_SCHOOL_HREF = "/school";

/** @deprecated Use DASHBOARD_ABIT_HREF — redirects on /dashboard */
export const LEGACY_DASHBOARD_HREF = "/dashboard";

/** @deprecated Use DASHBOARD_STUDENT_HREF — redirects on /university */
export const LEGACY_UNIVERSITY_HREF = "/university";

/** /select-space — არჩევანის შემდეგ სად უნდა გადავიდეს მომხმარებელი */
export const SPACE_SELECT_ROUTES: Record<SpaceeduSpace, string> = {
  school: DASHBOARD_SCHOOL_HREF,
  abiturient: DASHBOARD_ABIT_HREF,
  student: DASHBOARD_STUDENT_HREF,
};

/** Where the logo goes: the dashboard of the space the user is working
 * in, or the home page when no space is known. */
export function brandHomeHref(space: SpaceeduSpace | null | undefined): string {
  return space && space in SPACE_SELECT_ROUTES ? SPACE_SELECT_ROUTES[space] : "/";
}

export function dashboardHrefForSpace(
  space: SpaceeduSpace | null | undefined,
): string {
  if (space && space in SPACE_SELECT_ROUTES) {
    return SPACE_SELECT_ROUTES[space];
  }
  return DASHBOARD_ABIT_HREF;
}
