import { describe, expect, it } from "vitest";
import {
  buildProfileNav,
  isProfileNavItemActive,
  SETTINGS_PROFILE_HREF,
} from "./settings-nav";

describe("buildProfileNav", () => {
  it("points the overview and stats links at the student routes for a student", () => {
    const groups = buildProfileNav("student");
    const progress = groups[0];
    expect(progress.items.map((i) => i.href)).toEqual(["/profile", "/profile/stats"]);
  });

  it("points them at the abiturient routes for an abiturient", () => {
    const groups = buildProfileNav("abiturient");
    expect(groups[0].items.map((i) => i.href)).toEqual([
      "/profile-abiturient",
      "/profile-abiturient/stats",
    ]);
  });

  it("always includes the shared /settings/profile entry", () => {
    const hrefs = buildProfileNav("student").flatMap((g) => g.items.map((i) => i.href));
    expect(hrefs).toContain(SETTINGS_PROFILE_HREF);
  });
});

describe("isProfileNavItemActive", () => {
  it("matches the overview route exactly (not while on its /stats child)", () => {
    expect(isProfileNavItemActive("/profile", "/profile")).toBe(true);
    expect(isProfileNavItemActive("/profile/stats", "/profile")).toBe(false);
  });

  it("matches settings entries by prefix so sub-paths stay highlighted", () => {
    expect(isProfileNavItemActive("/settings/security", "/settings/security")).toBe(true);
    expect(isProfileNavItemActive("/profile/stats", "/profile/stats")).toBe(true);
  });
});
