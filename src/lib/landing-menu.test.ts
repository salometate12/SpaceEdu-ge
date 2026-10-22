import { describe, expect, it } from "vitest";
import { LANDING_MENU_LINKS, LANDING_MENU_SPACES, menuLinkAction, sheetClosesOnRelease } from "./landing-menu";

describe("landing menu sheet", () => {
  it("closes when dragged down far enough, or flicked", () => {
    expect(sheetClosesOnRelease(80, 0.1)).toBe(true);
    expect(sheetClosesOnRelease(40, 0.9)).toBe(true);
    expect(sheetClosesOnRelease(40, 0.2)).toBe(false);
    expect(sheetClosesOnRelease(5, 2)).toBe(false); // a tap, not a swipe
  });

  it("a link on the landing scrolls to its own section after closing; elsewhere it navigates", () => {
    expect(menuLinkAction("/#school", "/")).toEqual({ kind: "scroll", id: "school" });
    expect(menuLinkAction("/#school", "/pricing")).toEqual({ kind: "navigate" });
    expect(menuLinkAction("/about", "/")).toEqual({ kind: "navigate" });
  });

  it("school and university go to different places", () => {
    const hrefs = [...LANDING_MENU_SPACES, ...LANDING_MENU_LINKS].map((item) => item.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
    expect(hrefs).toContain("/#school");
    expect(hrefs).toContain("/#university");
  });
});
