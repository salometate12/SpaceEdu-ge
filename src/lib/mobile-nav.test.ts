import { describe, expect, it } from "vitest";
import { isDockItemActive, LANDING_DOCK, MOBILE_DOCK_SLOTS, mobileDockHidden, mobileDockItems, opensKeyboard } from "./mobile-nav";

const labels = (items: ReturnType<typeof mobileDockItems>) => items.map((item) => item.label);

describe("mobile dock", () => {
  it("fills five places in the app: home, calendar, AI, tools, profile", () => {
    const items = mobileDockItems("/dashboard-student", "student");
    expect(items.map((item) => item.slot)).toEqual([...MOBILE_DOCK_SLOTS]);
    expect(labels(items)).toEqual(["მთავარი", "კალენდარი", "AI", "ხელსაწყოები", "პროფილი"]);
    expect(items[2]).toMatchObject({ action: "ai-chat", href: "/ai-teacher" });
    expect(items[3]).toMatchObject({ action: "menu" });
    expect(items[4]).toMatchObject({ avatar: true, href: "/profile" });
  });

  it("points home, AI and profile at the abiturient space", () => {
    const items = mobileDockItems("/dashboard-abit", "abiturient");
    expect(items[0].href).toBe("/dashboard-abit");
    expect(items[1].href).toBe("/dashboard-abit#dashboard-calendar-panel");
    expect(items[2].href).toBe("/ai-teacher/abit");
    expect(items[4].href).toBe("/profile-abiturient");
  });

  it("marks the right tab active", () => {
    const items = mobileDockItems("/dashboard-student", "student");
    const active = (path: string) => items.filter((item) => isDockItemActive(path, item)).map((item) => item.label);
    expect(active("/dashboard-student")).toEqual(["მთავარი"]);
    expect(active("/study-plan")).toEqual(["კალენდარი"]);
    expect(active("/profile")).toEqual(["პროფილი"]);
    expect(active("/settings/profile")).toEqual(["პროფილი"]);
    expect(active("/ai-teacher")).toEqual(["AI"]);
    // The tools menu is never "the current page".
    expect(active("/quiz")).toEqual([]);
  });

  it("uses the landing set on the marketing pages", () => {
    for (const path of ["/", "/pricing", "/about"]) {
      expect(mobileDockItems(path, null)).toBe(LANDING_DOCK);
    }
    expect(labels(LANDING_DOCK)).toEqual(["მთავარი", "ფასები", "დაწყება", "ჩვენ შესახებ", "შესვლა"]);
    expect(LANDING_DOCK[2]).toMatchObject({ slot: "center", href: "/select-space" });
    expect(LANDING_DOCK.filter((item) => isDockItemActive("/about", item)).map((item) => item.label)).toEqual(["ჩვენ შესახებ"]);
  });

  it("stays hidden where it always was", () => {
    for (const path of ["/select-space", "/login", "/registration", "/admin"]) {
      expect(mobileDockHidden(path)).toBe(true);
      expect(mobileDockItems(path, "student")).toEqual([]);
    }
  });
});

describe("mobileDockHidden — password reset", () => {
  it("hides the dock on both reset pages, like on /login", () => {
    expect(mobileDockHidden("/forgot-password")).toBe(true);
    expect(mobileDockHidden("/reset-password")).toBe(true);
  });
});

describe("mobileDockHidden — AI teacher", () => {
  it("hides the dock on both AI teacher pages: the chat is full screen", () => {
    expect(mobileDockHidden("/ai-teacher")).toBe(true);
    expect(mobileDockHidden("/ai-teacher/abit")).toBe(true);
    expect(mobileDockItems("/ai-teacher", "student")).toEqual([]);
  });

  it("keeps it everywhere else in the app", () => {
    expect(mobileDockHidden("/dashboard-student")).toBe(false);
    expect(mobileDockHidden("/cv")).toBe(false);
  });
});

describe("dock while typing", () => {
  it("steps aside for fields that open the keyboard", () => {
    expect(opensKeyboard({ tagName: "TEXTAREA" })).toBe(true);
    expect(opensKeyboard({ tagName: "INPUT", type: "text" })).toBe(true);
    expect(opensKeyboard({ tagName: "INPUT", type: "email" })).toBe(true);
    expect(opensKeyboard({ tagName: "INPUT", type: "" })).toBe(true);
    expect(opensKeyboard({ tagName: "DIV", isContentEditable: true })).toBe(true);
  });

  it("stays for checkboxes, radios, buttons and fields that can't be typed in", () => {
    for (const type of ["checkbox", "radio", "button", "submit", "range", "file", "color"]) {
      expect(opensKeyboard({ tagName: "INPUT", type })).toBe(false);
    }
    expect(opensKeyboard({ tagName: "BUTTON" })).toBe(false);
    expect(opensKeyboard({ tagName: "INPUT", type: "text", readOnly: true })).toBe(false);
    expect(opensKeyboard({ tagName: "TEXTAREA", disabled: true })).toBe(false);
    expect(opensKeyboard(null)).toBe(false);
  });
});
