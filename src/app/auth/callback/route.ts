import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { parseEmailOtpType, RESET_LINK_INVALID, RESET_PASSWORD_HREF, safeNextPath } from "@/lib/password-reset";

/**
 * Where Supabase sends people back to:
 *  - OAuth (Google) with `?code=` → a session → /auth/complete (unchanged);
 *  - email links: the password reset asks for `?next=/reset-password`, and
 *    comes back either with `?code=` (PKCE, the default template) or with
 *    `?token_hash=&type=recovery` (the template in docs/supabase-email-templates.md,
 *    which also works when the email is opened in another browser).
 * `next` is only ever a path on this site (safeNextPath), never another host.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const otpType = parseEmailOtpType(url.searchParams.get("type"));
  const roleParam = url.searchParams.get("role");
  const role = roleParam === "abiturient" || roleParam === "student" ? roleParam : "abiturient";
  const next = safeNextPath(url.searchParams.get("next")) ?? (otpType === "recovery" ? RESET_PASSWORD_HREF : null);
  const isRecovery = otpType === "recovery" || next?.startsWith(RESET_PASSWORD_HREF) === true;
  const success = next ? `${url.origin}${next}` : `${url.origin}/auth/complete?role=${role}`;

  // Supabase redirects here with an error when the link was expired or used.
  const linkError = url.searchParams.get("error_code") ?? url.searchParams.get("error");

  if (!linkError) {
    try {
      const supabase = await createClient();
      if (tokenHash && otpType) {
        const { error } = await supabase.auth.verifyOtp({ type: otpType, token_hash: tokenHash });
        if (!error) return NextResponse.redirect(success);
      } else if (code) {
        // PKCE: fails when the link is opened in a different browser than the
        // one that asked for it (no code verifier there) — handled below.
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) return NextResponse.redirect(success);
      }
    } catch {
      // fall through to the error redirects below
    }
  }

  if (isRecovery) {
    return NextResponse.redirect(`${url.origin}${RESET_PASSWORD_HREF}?error=${RESET_LINK_INVALID}`);
  }
  return NextResponse.redirect(`${url.origin}/?error=access_denied&error_code=oauth_failed`);
}
