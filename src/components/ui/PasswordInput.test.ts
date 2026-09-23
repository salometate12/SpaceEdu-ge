import { describe, expect, it } from "vitest";
import { passwordInputType, passwordToggleLabel } from "./PasswordInput";

describe("passwordToggleLabel", () => {
  it("offers to hide the password while it is visible", () => {
    expect(passwordToggleLabel(true)).toBe("პაროლის დამალვა");
  });

  it("offers to show the password while it is hidden", () => {
    expect(passwordToggleLabel(false)).toBe("პაროლის ჩვენება");
  });
});

describe("passwordInputType", () => {
  it("reveals the text when visible", () => {
    expect(passwordInputType(true)).toBe("text");
  });

  it("masks the value when hidden", () => {
    expect(passwordInputType(false)).toBe("password");
  });
});
