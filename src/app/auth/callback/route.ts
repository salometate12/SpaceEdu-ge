import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/** OAuth (Google, etc.) redirect target — exchanges the auth code for a session. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const roleParam = url.searchParams.get("role");
  const role = roleParam === "abiturient" || roleParam === "student" ? roleParam : "abiturient";

  if (code) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return NextResponse.redirect(`${url.origin}/auth/complete?role=${role}`);
      }
    } catch {
      // fall through to the error redirect below
    }
  }

  return NextResponse.redirect(
    `${url.origin}/?error=access_denied&error_code=oauth_failed`,
  );
}
