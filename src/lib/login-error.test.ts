import { describe, expect, it } from "vitest";
import { classifyLoginError, validateLoginFields } from "./login-error";

describe("validateLoginFields", () => {
  it("flags the email field when the address is empty or malformed", () => {
    expect(validateLoginFields("", "secret1")).toEqual({
      field: "email",
      message: "შეიყვანე სწორი ელ-ფოსტა",
    });
    expect(validateLoginFields("not-an-email", "secret1")?.field).toBe("email");
  });

  it("flags the password field when it is shorter than 6 characters", () => {
    expect(validateLoginFields("a@b.com", "123")).toEqual({
      field: "password",
      message: "პაროლი უნდა შეიცავდეს მინიმუმ 6 სიმბოლოს",
    });
  });

  it("passes a valid email and a 6+ character password", () => {
    expect(validateLoginFields("a@b.com", "secret1")).toBeNull();
  });
});

describe("classifyLoginError", () => {
  it("turns the password field red for invalid credentials (by code)", () => {
    const outcome = classifyLoginError({ code: "invalid_credentials" });
    expect(outcome).toEqual({
      kind: "field",
      error: { field: "password", message: "პაროლი არასწორია" },
    });
  });

  it("turns the password field red for invalid credentials (by message)", () => {
    const outcome = classifyLoginError(new Error("Invalid login credentials"));
    expect(outcome.kind).toBe("field");
    if (outcome.kind === "field") expect(outcome.error.field).toBe("password");
  });

  it("keeps the fields normal for an unconfirmed email", () => {
    expect(classifyLoginError({ code: "email_not_confirmed" })).toEqual({ kind: "unconfirmed" });
    expect(classifyLoginError(new Error("Email not confirmed"))).toEqual({ kind: "unconfirmed" });
  });

  it("falls back to a generic error for anything else", () => {
    expect(classifyLoginError(new Error("network down"))).toEqual({ kind: "general" });
    expect(classifyLoginError(null)).toEqual({ kind: "general" });
  });
});
