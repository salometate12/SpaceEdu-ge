import { describe, expect, it } from "vitest";
import { brandHomeHref } from "./dashboard-routes";

describe("brandHomeHref (the logo link)", () => {
  it("goes to the dashboard of the space the user is in", () => {
    expect(brandHomeHref("student")).toBe("/dashboard-student");
    expect(brandHomeHref("abiturient")).toBe("/dashboard-abit");
  });

  it("goes home when no space is known", () => {
    expect(brandHomeHref(null)).toBe("/");
    expect(brandHomeHref(undefined)).toBe("/");
  });
});
