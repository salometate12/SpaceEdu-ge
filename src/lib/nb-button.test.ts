import { describe, expect, it } from "vitest";
import { contrastRatio, NB_COLORS, nbButtonClass, nbNavClass } from "./nb-button";

describe("nbButtonClass", () => {
  it("builds each variant and size", () => {
    expect(nbButtonClass()).toBe("nb-btn nb-btn--secondary");
    expect(nbButtonClass({ variant: "primary", block: true })).toBe("nb-btn nb-btn--primary nb-btn--block");
    expect(nbButtonClass({ variant: "danger", size: "sm", className: "mt-3" })).toBe("nb-btn nb-btn--danger nb-btn--sm mt-3");
  });
});

describe("nbNavClass", () => {
  it("marks the active item, in danger colours for the danger zone", () => {
    expect(nbNavClass({ active: true })).toBe("nb-nav nb-nav--active");
    expect(nbNavClass({ active: true, danger: true })).toBe("nb-nav nb-nav--active-danger");
    expect(nbNavClass({ active: false, danger: true })).toBe("nb-nav nb-nav--danger");
    expect(nbNavClass({ active: false })).toBe("nb-nav");
  });
});

describe("contrast (WCAG AA, 4.5:1)", () => {
  it("white on magenta and the danger reds pass in both themes", () => {
    const { light, dark } = NB_COLORS;
    expect(contrastRatio(light.onPrimary, light.primary)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(light.danger, light.surface)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(light.text, light.surface)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(dark.danger, dark.surface)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(dark.text, dark.surface)).toBeGreaterThanOrEqual(4.5);
  });
});
