import { describe, expect, it } from "vitest";
import {
  activeProfileNavItem,
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

  it("never sends an unknown space to the abiturient profile", () => {
    const hrefs = buildProfileNav(null)[0].items.map((i) => i.href);
    expect(hrefs).toEqual(["/select-space", "/select-space"]);
    expect(hrefs.some((href) => href.startsWith("/profile-abiturient"))).toBe(false);
  });

  it("sends an admin with no space to their settings, not the chooser", () => {
    expect(buildProfileNav(null, { isAdmin: true })[0].items.map((i) => i.href)).toEqual([
      SETTINGS_PROFILE_HREF,
      SETTINGS_PROFILE_HREF,
    ]);
  });

  it("always includes the shared /settings/profile entry", () => {
    const hrefs = buildProfileNav("student").flatMap((g) => g.items.map((i) => i.href));
    expect(hrefs).toContain(SETTINGS_PROFILE_HREF);
  });
});

describe("the merged menu", () => {
  it("has nine entries, the danger zone last and on its own", () => {
    const groups = buildProfileNav("student");
    expect(groups.flatMap((g) => g.items)).toHaveLength(9);
    const last = groups[groups.length - 1];
    expect(last.title).toBe("");
    expect(last.items.map((i) => i.href)).toEqual(["/settings/danger"]);
  });

  it("no longer lists the folded-in pages", () => {
    const hrefs = buildProfileNav("student").flatMap((g) => g.items.map((i) => i.href));
    for (const gone of ["/settings/sessions", "/settings/language", "/settings/billing"]) {
      expect(hrefs).not.toContain(gone);
    }
  });

  it("finds the entry a page belongs to", () => {
    const groups = buildProfileNav("abiturient");
    expect(activeProfileNavItem(groups, "/settings/security")?.label).toBe("უსაფრთხოება და სესიები");
    expect(activeProfileNavItem(groups, "/profile-abiturient/stats")?.label).toBe("სტატისტიკა");
    expect(activeProfileNavItem(groups, "/settings")).toBeNull();
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
