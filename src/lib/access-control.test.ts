import { describe, expect, it } from "vitest";
import {
  authEntryRedirectHref,
  dashboardHrefForUserSpace,
  resolvePostLoginHref,
  SELECT_SPACE_HREF,
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
