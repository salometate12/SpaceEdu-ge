import { describe, expect, it } from "vitest";
import { buildRailGroups } from "@/components/dashboard/DashboardSideRail";
import { buildToolTiles, filterTools, softHyphenate } from "./mobile-tools";

const groups = (space: "student" | "abiturient", pathname = "/dashboard-student") =>
  buildRailGroups({ space, pathname, onAiChat: () => {}, aiChatOpen: false });
const labels = (tiles: { label: string }[]) => tiles.map((tile) => tile.label);

describe("phone tools menu", () => {
  it("student: the student's tools, AI teacher first, without the dock's dashboard and profile", () => {
    const tiles = buildToolTiles(groups("student"));
    expect(tiles[0].label).toBe("AI მასწავლებელი");
    expect(labels(tiles)).not.toContain("დეშბორდი");
    expect(labels(tiles)).not.toContain("პროფილი");
    expect(labels(tiles)).toEqual(expect.arrayContaining(["AI პრეზენტაცია", "CV გენერატორი", "სილაბუსი", "ჟურნალი", "პარამეტრები"]));
    expect(labels(tiles)).not.toContain("Admin Panel");
    expect(labels(buildToolTiles(groups("student"), { isAdmin: true }))).toContain("Admin Panel");
  });

  it("abiturient: the abiturient's tools and subjects, AI chat first, one quiz", () => {
    const tiles = buildToolTiles(groups("abiturient", "/dashboard-abit"));
    expect(tiles[0].label).toBe("AI ჩატი");
    expect(labels(tiles)).toEqual(expect.arrayContaining(["კალკულატორი", "მათემატიკა"]));
    expect(labels(tiles)).not.toContain("CV გენერატორი");
    expect(tiles.filter((tile) => tile.href === "/quiz")).toHaveLength(1);
    expect(labels(tiles)).not.toContain("დეშბორდი");
  });

  it("every tile has a colour from the logo's palette", () => {
    for (const tile of buildToolTiles(groups("student"))) expect(tile.color).toMatch(/^#[0-9a-f]{6}$/i);
  });
});

describe("tool search", () => {
  const tiles = buildToolTiles(groups("student"));

  it("by name, any case: „cv“ finds the CV generator", () => {
    expect(labels(filterTools(tiles, "cv"))).toEqual(["CV გენერატორი"]);
    expect(labels(filterTools(tiles, "CV"))).toEqual(["CV გენერატორი"]);
  });

  it("Latin typed for Georgian: „prez“ finds the presentation", () => {
    expect(labels(filterTools(tiles, "prez"))).toEqual(["AI პრეზენტაცია"]);
  });

  it("by synonym: სლაიდები, რეზიუმე, ჩატი, თარიღები, ქვიზი", () => {
    expect(labels(filterTools(tiles, "სლაიდები"))).toEqual(["AI პრეზენტაცია"]);
    expect(labels(filterTools(tiles, "რეზიუმე"))).toEqual(["CV გენერატორი"]);
    expect(labels(filterTools(tiles, "ჩატი"))).toEqual(["AI მასწავლებელი"]);
    expect(labels(filterTools(tiles, "თარიღები"))).toEqual(["სილაბუსი"]);
    expect(labels(filterTools(tiles, "ქვიზი"))).toEqual(["ვიქტორინა"]);
  });

  it("nothing found → empty; an empty query shows everything", () => {
    expect(filterTools(tiles, "ზზზზ")).toEqual([]);
    expect(filterTools(tiles, "  ")).toHaveLength(tiles.length);
  });
});

describe("tile labels", () => {
  it("long Georgian words get soft hyphens at syllable ends; short words and Latin don't", () => {
    // Each part keeps at least 3 letters: მასწა-ვლე-ბელი.
    expect(softHyphenate("AI მასწავლებელი")).toBe("AI მასწა\u00ADვლე\u00ADბელი");
    expect(softHyphenate("ჟურნალი")).toBe("ჟურნალი");
    expect(softHyphenate("CV გენერატორი").startsWith("CV ")).toBe(true);
    expect(softHyphenate("კალკულატორი").replace(/\u00AD/g, "")).toBe("კალკულატორი");
  });
});
