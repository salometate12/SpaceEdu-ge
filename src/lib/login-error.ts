/**
 * Pure helpers for the login form's error handling, kept out of the component
 * so they can be unit-tested (the form itself renders their result).
 */

export type LoginFieldError = { field: "email" | "password"; message: string };

/** Which field (if any) fails client-side validation before we call Supabase. */
export function validateLoginFields(email: string, password: string): LoginFieldError | null {
  const trimmed = email.trim();
  if (!/^\S+@\S+\.\S+$/.test(trimmed)) {
    return { field: "email", message: "შეიყვანე სწორი ელ-ფოსტა" };
  }
  if (password.length < 6) {
    return { field: "password", message: "პაროლი უნდა შეიცავდეს მინიმუმ 6 სიმბოლოს" };
  }
  return null;
}

export type LoginOutcome =
  | { kind: "unconfirmed" }
  | { kind: "field"; error: LoginFieldError }
  | { kind: "general" };

/** Classifies a Supabase sign-in error into what the form should show:
 *  - an unconfirmed email keeps the fields normal (resend flow, unchanged);
 *  - invalid credentials turns the password field red with "პაროლი არასწორია";
 *  - anything else is a generic error message. */
export function classifyLoginError(err: unknown): LoginOutcome {
  const code = (err as { code?: string } | null)?.code;
  const message = err instanceof Error ? err.message.toLowerCase() : "";

  if (code === "email_not_confirmed" || message.includes("not confirmed")) {
    return { kind: "unconfirmed" };
  }
  if (code === "invalid_credentials" || message.includes("invalid login credentials")) {
    return { kind: "field", error: { field: "password", message: "პაროლი არასწორია" } };
  }
  return { kind: "general" };
}
