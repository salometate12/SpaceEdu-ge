/**
 * Password reset: pure helpers shared by /forgot-password, /reset-password
 * and /auth/callback, kept here so they can be unit-tested.
 */

export const FORGOT_PASSWORD_HREF = "/forgot-password";
export const RESET_PASSWORD_HREF = "/reset-password";
/** Set on /reset-password when the emailed link was expired, used or opened elsewhere. */
export const RESET_LINK_INVALID = "link_invalid";

/** Pages where you sign in or recover access: no site header, dock or chat. */
export const AUTH_FORM_PATHS = ["/login", FORGOT_PASSWORD_HREF, RESET_PASSWORD_HREF] as const;

export function isAuthFormPath(pathname: string | null): boolean {
  if (!pathname) return false;
  return AUTH_FORM_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

/** /forgot-password with the address the user already typed, if any. */
export function forgotPasswordHref(email?: string): string {
  const trimmed = email?.trim();
  return trimmed ? `${FORGOT_PASSWORD_HREF}?email=${encodeURIComponent(trimmed)}` : FORGOT_PASSWORD_HREF;
}

export function loginHref(email?: string): string {
  const trimmed = email?.trim();
  return trimmed ? `/login?email=${encodeURIComponent(trimmed)}` : "/login";
}

/**
 * `next` from a URL, only if it's a path on this site: starts with a single
 * "/", no scheme, no "//" or "/\" (which browsers treat as another host), no
 * control characters. Anything else → null, so it can't be an open redirect.
 */
export function safeNextPath(raw: string | null | undefined): string | null {
  if (!raw) return null;
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) return null;
  if (/[\u0000-\u001f\u007f]/.test(raw)) return null;
  try {
    const url = new URL(raw, "https://spaceedu.invalid");
    if (url.origin !== "https://spaceedu.invalid") return null;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}

/** Email OTP types /auth/callback accepts with `token_hash` (verifyOtp). */
export const EMAIL_OTP_TYPES = ["recovery", "signup", "invite", "magiclink", "email_change", "email"] as const;
export type EmailOtpType = (typeof EMAIL_OTP_TYPES)[number];

export function parseEmailOtpType(raw: string | null): EmailOtpType | null {
  return (EMAIL_OTP_TYPES as readonly string[]).includes(raw ?? "") ? (raw as EmailOtpType) : null;
}

export const MIN_PASSWORD_LENGTH = 6;

export type NewPasswordError = { field: "password" | "confirm"; message: string };

/** The same rule as registration (6+ characters), and the two fields must match. */
export function validateNewPassword(password: string, confirm: string): NewPasswordError | null {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { field: "password", message: `პაროლი უნდა შეიცავდეს მინიმუმ ${MIN_PASSWORD_LENGTH} სიმბოლოს` };
  }
  if (password !== confirm) {
    return { field: "confirm", message: "პაროლები არ ემთხვევა" };
  }
  return null;
}

export const RESET_SENT_MESSAGE =
  "თუ ეს ელ-ფოსტა რეგისტრირებულია, ბმული უკვე გამოგზავნილია. შეამოწმე inbox და spam საქაღალდე.";
export const RESET_RATE_LIMIT_MESSAGE = "ძალიან ბევრი მცდელობა. სცადე რამდენიმე წუთში.";
export const RESET_FAILED_MESSAGE = "ბმული ვერ გაიგზავნა. შეამოწმე ინტერნეტი და სცადე თავიდან.";

export type ResetRequestOutcome =
  | { kind: "sent"; message: string }
  | { kind: "rate_limited"; message: string }
  | { kind: "failed"; message: string };

/**
 * What /forgot-password shows after asking Supabase for a link. Whether the
 * account exists never changes the answer (Supabase doesn't say, and should
 * it ever say "user not found" we still answer "sent"), so nobody can use
 * this form to find out who is registered.
 */
export function resetRequestOutcome(error: unknown): ResetRequestOutcome {
  if (!error) return { kind: "sent", message: RESET_SENT_MESSAGE };
  const code = (error as { code?: string } | null)?.code ?? "";
  const status = (error as { status?: number } | null)?.status;
  const message = error instanceof Error ? error.message.toLowerCase() : "";
  if (code === "over_email_send_rate_limit" || code === "over_request_rate_limit" || status === 429 || message.includes("rate limit")) {
    return { kind: "rate_limited", message: RESET_RATE_LIMIT_MESSAGE };
  }
  if (code === "user_not_found" || message.includes("user not found")) {
    return { kind: "sent", message: RESET_SENT_MESSAGE };
  }
  return { kind: "failed", message: RESET_FAILED_MESSAGE };
}

/** What a failed `updateUser({ password })` means for the reset form. */
export function newPasswordErrorMessage(error: unknown): { linkInvalid: boolean; message: string } {
  const code = (error as { code?: string } | null)?.code ?? "";
  const message = error instanceof Error ? error.message.toLowerCase() : "";
  if (code === "same_password" || message.includes("different from the old")) {
    return { linkInvalid: false, message: "ახალი პაროლი ძველისგან უნდა განსხვავდებოდეს." };
  }
  if (code === "weak_password") {
    return { linkInvalid: false, message: "პაროლი ძალიან მარტივია. სცადე უფრო გრძელი ან რთული." };
  }
  if (code === "session_not_found" || code === "session_expired" || message.includes("auth session missing")) {
    return { linkInvalid: true, message: "ბმული აღარ მოქმედებს. მოითხოვე ახალი." };
  }
  return { linkInvalid: false, message: "პაროლი ვერ შეინახა. სცადე თავიდან." };
}

/** Seconds before „ხელახლა გაგზავნა“ is enabled again. */
export const RESEND_COOLDOWN_SECONDS = 60;
/** Seconds before /reset-password moves on to the dashboard by itself. */
export const RESET_SUCCESS_REDIRECT_SECONDS = 5;

/** Phone (SMS code) reset is prepared but off until numbers and an SMS provider exist. */
export function phoneResetEnabled(value = process.env.NEXT_PUBLIC_PHONE_RESET_ENABLED): boolean {
  return value === "true" || value === "1";
}
