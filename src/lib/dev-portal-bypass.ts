import {
  DASHBOARD_ABIT_HREF,
  DASHBOARD_STUDENT_HREF,
  SPACE_SELECT_ROUTES,
} from "@/lib/dashboard-routes";
import type { RegistrationRoleParam } from "@/lib/registration-role";
import type { SmartSpace } from "@/lib/smart-space";
import type { SpaceeduSpace } from "@/lib/space-back-navigation";

/** Temporary local testing — never enable in production builds */
export function isDevPortalBypass(): boolean {
  return process.env.NODE_ENV === "development";
}

const DEV_SMART_SPACE: Record<RegistrationRoleParam, SmartSpace> = {
  abiturient: "exam",
  student: "university",
};

export type DevPortalTarget = "dashboard" | "georgian-space";

export function parseDevPortalTarget(value: string | null): DevPortalTarget | null {
  if (value === "georgian-space") return "georgian-space";
  if (value === "dashboard") return "dashboard";
  return null;
}

/** Where to send the user after auth (or dev skip) for a given role */
export function resolveAuthRedirectHref(
  role: RegistrationRoleParam,
  devTarget?: DevPortalTarget | null,
): string {
  if (isDevPortalBypass()) {
    if (role === "student") {
      if (devTarget === "georgian-space") {
        return "/subject/georgian/space";
      }
      return DASHBOARD_STUDENT_HREF;
    }
    if (devTarget === "georgian-space") {
      return "/subject/georgian/space";
    }
    return DASHBOARD_ABIT_HREF;
  }

  return SPACE_SELECT_ROUTES[role];
}

export function persistSpaceForRole(role: RegistrationRoleParam): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem("spaceedu_space", role);
  window.localStorage.setItem("spaceedu-active-space", DEV_SMART_SPACE[role]);
}

export function devSkipRegistrationAllowed(role: RegistrationRoleParam | null): boolean {
  return isDevPortalBypass() && role !== null;
}

export function spaceFromRole(role: RegistrationRoleParam): SpaceeduSpace {
  return role;
}
