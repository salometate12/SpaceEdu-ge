import { describe, expect, it } from "vitest";
import { activeSpaceToRemember, parseSpace, resolveWorkingSpace } from "./active-space";
import { profileHrefForSpace, statsHrefForSpace } from "./access-control";

describe("resolveWorkingSpace", () => {
  it("prefers the space the URL belongs to", () => {
    expect(
      resolveWorkingSpace({
        pathname: "/dashboard-student",
        cookieSpace: "abiturient",
        accountSpace: "abiturient",
      }),
    ).toBe("student");
  });

  it("falls back to the remembered cookie on a page that belongs to no space", () => {
    expect(
      resolveWorkingSpace({
        pathname: "/settings/profile",
        cookieSpace: "student",
        accountSpace: "abiturient",
      }),
    ).toBe("student");
  });

  it("then to the account's own space", () => {
    expect(
      resolveWorkingSpace({ pathname: "/settings/profile", cookieSpace: null, accountSpace: "abiturient" }),
    ).toBe("abiturient");
  });

  it("is null when nothing is known — never a silent abiturient default", () => {
    expect(
      resolveWorkingSpace({ pathname: "/settings/profile", cookieSpace: null, accountSpace: null }),
    ).toBeNull();
    expect(resolveWorkingSpace({ pathname: null, cookieSpace: null, accountSpace: null })).toBeNull();
  });
});

describe("activeSpaceToRemember", () => {
  it("remembers a space from its own dashboard, profile and stats", () => {
    expect(activeSpaceToRemember("/dashboard-student", null)).toBe("student");
    expect(activeSpaceToRemember("/dashboard-abit", "student")).toBe("abiturient");
    expect(activeSpaceToRemember("/profile", "abiturient")).toBe("student");
    expect(activeSpaceToRemember("/profile-abiturient/stats", null)).toBe("abiturient");
  });

  it("leaves the cookie alone when it already holds that space", () => {
    expect(activeSpaceToRemember("/profile", "student")).toBeNull();
  });

  it("never changes it from a shared page", () => {
    expect(activeSpaceToRemember("/settings/profile", "student")).toBeNull();
    expect(activeSpaceToRemember("/quiz", "student")).toBeNull();
    expect(activeSpaceToRemember("/profile/edit", "abiturient")).toBeNull();
  });

  it("does not switch space from /ai-teacher, which both headers link to", () => {
    expect(activeSpaceToRemember("/ai-teacher", "abiturient")).toBeNull();
  });
});

describe("parseSpace", () => {
  it("accepts only real spaces", () => {
    expect(parseSpace("student")).toBe("student");
    expect(parseSpace("admin")).toBeNull();
    expect(parseSpace(undefined)).toBeNull();
  });
});

describe("profile / stats hrefs with no space", () => {
  it("go to the chooser for a normal user and to settings for an admin", () => {
    expect(profileHrefForSpace(null)).toBe("/select-space");
    expect(statsHrefForSpace(undefined)).toBe("/select-space");
    expect(profileHrefForSpace(null, { isAdmin: true })).toBe("/settings/profile");
    expect(statsHrefForSpace(null, { isAdmin: true })).toBe("/settings/profile");
  });

  it("are unchanged for a known space", () => {
    expect(profileHrefForSpace("student")).toBe("/profile");
    expect(profileHrefForSpace("abiturient")).toBe("/profile-abiturient");
    expect(statsHrefForSpace("school")).toBe("/profile-abiturient/stats");
  });
});
