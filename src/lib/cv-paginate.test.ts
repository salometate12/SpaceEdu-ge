import { describe, expect, it } from "vitest";
import { pageCount, pushToNextPage } from "./cv-paginate";
import { parseCvPrefs, resolveCvPrefs } from "./cv-prefs";

describe("pushToNextPage", () => {
  it("leaves blocks that fit on their page", () => {
    expect(pushToNextPage(100, 300)).toBeNull();
    expect(pushToNextPage(1000, 1123)).toBeNull();
  });

  it("moves a block that crosses the page break to the next page's top margin", () => {
    expect(pushToNextPage(1100, 1160)).toBe(1123 + 56);
    expect(pushToNextPage(2200, 2300)).toBe(2246 + 56);
  });

  it("lets a block taller than a page split", () => {
    expect(pushToNextPage(500, 1700)).toBeNull();
  });

  it("counts pages", () => {
    expect(pageCount(1123)).toBe(1);
    expect(pageCount(1124)).toBe(1); // rounding, not a real overflow
    expect(pageCount(1140)).toBe(2);
    expect(pageCount(500)).toBe(1);
  });
});

describe("cv prefs", () => {
  it("reads saved choices and maps old template ids", () => {
    expect(parseCvPrefs('{"template":"creative-ui","accent":"teal","showPhoto":false,"language":"en","chosen":true}')).toEqual({
      template: "minimal",
      accent: "teal",
      showPhoto: false,
      language: "en",
      chosen: true,
    });
    expect(parseCvPrefs("not json")).toEqual({});
    expect(parseCvPrefs('{"accent":"neon"}')).toEqual({});
  });

  it("starts on ATS with the ATS pill, unless the user picked a template", () => {
    expect(resolveCvPrefs({}, true).template).toBe("ats");
    expect(resolveCvPrefs({}, false).template).toBe("modern");
    expect(resolveCvPrefs({ template: "classic", chosen: true }, true).template).toBe("classic");
    expect(resolveCvPrefs({}, false)).toEqual({ template: "modern", accent: "navy", showPhoto: true, language: "ka" });
  });
});
