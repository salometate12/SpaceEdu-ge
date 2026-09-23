import { describe, expect, it } from "vitest";
import {
  authEntryRedirectHref,
  dashboardHrefForUserSpace,
} from "./access-control";
import {
  DASHBOARD_ABIT_HREF,
  DASHBOARD_SCHOOL_HREF,
  DASHBOARD_STUDENT_HREF,
} from "./dashboard-routes";

describe("dashboardHrefForUserSpace", () => {
  it("maps each space to its dashboard", () => {
    expect(dashboardHrefForUserSpace("abiturient")).toBe(DASHBOARD_ABIT_HREF);
    expect(dashboardHrefForUserSpace("student")).toBe(DASHBOARD_STUDENT_HREF);
    expect(dashboardHrefForUserSpace("school")).toBe(DASHBOARD_SCHOOL_HREF);
  });
});

describe("authEntryRedirectHref", () => {
  it("sends a signed-in user with a space away from the auth-entry pages", () => {
    expect(authEntryRedirectHref("/select-space", "abiturient")).toBe(DASHBOARD_ABIT_HREF);
    expect(authEntryRedirectHref("/login", "student")).toBe(DASHBOARD_STUDENT_HREF);
    expect(authEntryRedirectHref("/registration", "school")).toBe(DASHBOARD_SCHOOL_HREF);
  });

  it("does not redirect when the user has no space yet", () => {
    expect(authEntryRedirectHref("/select-space", null)).toBeNull();
    expect(authEntryRedirectHref("/login", null)).toBeNull();
  });

  it("leaves other pages alone even for a user with a space", () => {
    expect(authEntryRedirectHref("/dashboard-abit", "abiturient")).toBeNull();
    expect(authEntryRedirectHref("/about", "student")).toBeNull();
    expect(authEntryRedirectHref("/subject/geography/space", "abiturient")).toBeNull();
  });
});
