import { describe, expect, it } from "vitest";
import {
  aiTeacherHrefForSpace,
  authEntryRedirectHref,
  dashboardHrefForUserSpace,
  getSpaceRedirectHref,
  resolvePostLoginHref,
  SELECT_SPACE_HREF,
  spaceFromPathname,
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

describe("resolvePostLoginHref", () => {
  it("uses the account's own space and never rewrites it", () => {
    expect(
      resolvePostLoginHref({
        metadataSpace: "student",
        roleSpace: "abiturient",
        storedSpace: "abiturient",
        isAdmin: false,
      }),
    ).toEqual({
      href: DASHBOARD_STUDENT_HREF,
      persistSpace: "student",
      writeSpaceToAccount: null,
    });
  });

  it("falls back to the URL role and writes it onto a normal account", () => {
    expect(
      resolvePostLoginHref({
        metadataSpace: null,
        roleSpace: "abiturient",
        storedSpace: null,
        isAdmin: false,
      }),
    ).toEqual({
      href: DASHBOARD_ABIT_HREF,
      persistSpace: "abiturient",
      writeSpaceToAccount: "abiturient",
    });
  });

  it("falls back to the stored preference when metadata and role are absent", () => {
    expect(
      resolvePostLoginHref({
        metadataSpace: null,
        roleSpace: null,
        storedSpace: "student",
        isAdmin: false,
      }),
    ).toEqual({
      href: DASHBOARD_STUDENT_HREF,
      persistSpace: "student",
      writeSpaceToAccount: "student",
    });
  });

  it("sends an admin without any space to the abiturient dashboard, never the chooser, never rewriting the account", () => {
    expect(
      resolvePostLoginHref({
        metadataSpace: null,
        roleSpace: null,
        storedSpace: null,
        isAdmin: true,
      }),
    ).toEqual({
      href: DASHBOARD_ABIT_HREF,
      persistSpace: null,
      writeSpaceToAccount: null,
    });
  });

  it("never writes a space onto an admin account even when a role is present", () => {
    const result = resolvePostLoginHref({
      metadataSpace: null,
      roleSpace: "student",
      storedSpace: null,
      isAdmin: true,
    });
    expect(result.href).toBe(DASHBOARD_STUDENT_HREF);
    expect(result.writeSpaceToAccount).toBeNull();
  });

  it("sends a new normal user with no space anywhere to the chooser", () => {
    expect(
      resolvePostLoginHref({
        metadataSpace: null,
        roleSpace: null,
        storedSpace: null,
        isAdmin: false,
      }),
    ).toEqual({
      href: SELECT_SPACE_HREF,
      persistSpace: null,
      writeSpaceToAccount: null,
    });
  });
});

describe("settings routes are shared, never space-guarded", () => {
  const settingsPaths = [
    "/settings",
    "/settings/profile",
    "/settings/space",
    "/settings/security",
    "/settings/sessions",
    "/settings/notifications",
    "/settings/appearance",
    "/settings/language",
    "/settings/plan",
    "/settings/billing",
    "/settings/danger",
  ];

  it("never redirects a settings page regardless of the account's space", () => {
    for (const path of settingsPaths) {
      expect(getSpaceRedirectHref(path, "student")).toBeNull();
      expect(getSpaceRedirectHref(path, "abiturient")).toBeNull();
      expect(getSpaceRedirectHref(path, "school")).toBeNull();
    }
  });

  it("does not guard /profile/edit (it redirects to shared /settings/profile)", () => {
    expect(getSpaceRedirectHref("/profile/edit", "student")).toBeNull();
    expect(getSpaceRedirectHref("/profile/edit", "abiturient")).toBeNull();
  });
});

describe("AI teacher pages per space", () => {
  it("links each space to its own AI teacher", () => {
    expect(aiTeacherHrefForSpace("student")).toBe("/ai-teacher");
    expect(aiTeacherHrefForSpace("abiturient")).toBe("/ai-teacher/abit");
    expect(aiTeacherHrefForSpace("school")).toBe("/ai-teacher/abit");
    expect(aiTeacherHrefForSpace(null)).toBe("/ai-teacher");
  });

  it("lets each space into its own AI teacher", () => {
    expect(getSpaceRedirectHref("/ai-teacher", "student")).toBeNull();
    expect(getSpaceRedirectHref("/ai-teacher/abit", "abiturient")).toBeNull();
    expect(getSpaceRedirectHref("/ai-teacher/abit", "school")).toBeNull();
  });

  it("sends the other space to its own AI teacher, not the dashboard", () => {
    expect(getSpaceRedirectHref("/ai-teacher", "abiturient")).toBe("/ai-teacher/abit");
    expect(getSpaceRedirectHref("/ai-teacher", "school")).toBe("/ai-teacher/abit");
    expect(getSpaceRedirectHref("/ai-teacher/abit", "student")).toBe("/ai-teacher");
  });

  it("shows the right space in the header on each page", () => {
    expect(spaceFromPathname("/ai-teacher")).toBe("student");
    expect(spaceFromPathname("/ai-teacher/abit")).toBe("abiturient");
  });
});
