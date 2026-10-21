import { describe, expect, it } from "vitest";
import {
  forgotPasswordHref,
  isAuthFormPath,
  newPasswordErrorMessage,
  parseEmailOtpType,
  phoneResetEnabled,
  RESET_RATE_LIMIT_MESSAGE,
  RESET_SENT_MESSAGE,
  resetRequestOutcome,
  safeNextPath,
  validateNewPassword,
} from "./password-reset";

describe("safeNextPath", () => {
  it("accepts paths on this site", () => {
    expect(safeNextPath("/reset-password")).toBe("/reset-password");
    expect(safeNextPath("/dashboard-student?tab=1")).toBe("/dashboard-student?tab=1");
  });

  it("rejects other hosts and tricks", () => {
    for (const raw of ["https://evil.com", "//evil.com", "/\\evil.com", "evil.com", "javascript:alert(1)", "/\u0000x", "", null, undefined]) {
      expect(safeNextPath(raw), String(raw)).toBeNull();
    }
  });
});

describe("parseEmailOtpType", () => {
  it("knows the email OTP types", () => {
    expect(parseEmailOtpType("recovery")).toBe("recovery");
    expect(parseEmailOtpType("sms")).toBeNull();
    expect(parseEmailOtpType(null)).toBeNull();
  });
});

describe("validateNewPassword", () => {
  it("needs 6+ characters", () => {
    expect(validateNewPassword("12345", "12345")).toEqual({ field: "password", message: "პაროლი უნდა შეიცავდეს მინიმუმ 6 სიმბოლოს" });
  });

  it("needs both fields to match", () => {
    expect(validateNewPassword("secret1", "secret2")).toEqual({ field: "confirm", message: "პაროლები არ ემთხვევა" });
  });

  it("passes a matching 6+ character password", () => {
    expect(validateNewPassword("secret1", "secret1")).toBeNull();
  });
});

describe("resetRequestOutcome", () => {
  it("shows the same message whether or not the account exists", () => {
    const existing = resetRequestOutcome(null);
    const missing = resetRequestOutcome({ code: "user_not_found" });
    expect(existing).toEqual({ kind: "sent", message: RESET_SENT_MESSAGE });
    expect(missing).toEqual(existing);
  });

  it("explains the email rate limit", () => {
    expect(resetRequestOutcome({ code: "over_email_send_rate_limit" })).toEqual({ kind: "rate_limited", message: RESET_RATE_LIMIT_MESSAGE });
    expect(resetRequestOutcome({ status: 429 }).kind).toBe("rate_limited");
  });

  it("reports other failures as failed, not as sent", () => {
    expect(resetRequestOutcome(new Error("Failed to fetch")).kind).toBe("failed");
  });
});

describe("newPasswordErrorMessage", () => {
  it("tells apart a reused password from a dead link", () => {
    expect(newPasswordErrorMessage({ code: "same_password" }).linkInvalid).toBe(false);
    expect(newPasswordErrorMessage(new Error("Auth session missing!")).linkInvalid).toBe(true);
  });
});

describe("routes", () => {
  it("treats the reset pages as auth forms", () => {
    expect(isAuthFormPath("/login")).toBe(true);
    expect(isAuthFormPath("/forgot-password")).toBe(true);
    expect(isAuthFormPath("/reset-password")).toBe(true);
    expect(isAuthFormPath("/loginx")).toBe(false);
    expect(isAuthFormPath("/dashboard-student")).toBe(false);
  });

  it("carries the typed email to /forgot-password", () => {
    expect(forgotPasswordHref(" a+b@x.ge ")).toBe("/forgot-password?email=a%2Bb%40x.ge");
    expect(forgotPasswordHref("")).toBe("/forgot-password");
  });

  it("keeps phone reset off unless the flag is set", () => {
    expect(phoneResetEnabled(undefined)).toBe(false);
    expect(phoneResetEnabled("false")).toBe(false);
    expect(phoneResetEnabled("true")).toBe(true);
  });
});
