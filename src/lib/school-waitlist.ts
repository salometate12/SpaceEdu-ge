import { createClient as createSupabaseBrowserClient } from "@/utils/supabase/client";
import { isSupabaseBrowserConfigured } from "@/utils/supabase/env";

/**
 * „შემატყობინე, როცა გაიხსნება“ on the closed school space: puts the signed-in
 * user on the `school_waitlist` table (supabase/migrations/005_school_waitlist.sql).
 * Best effort — the page thanks them either way.
 *
 * TODO: signed-out visitors aren't recorded; they'd need an email field.
 */
export async function joinSchoolWaitlist(): Promise<void> {
  if (!isSupabaseBrowserConfigured()) return;
  try {
    const supabase = createSupabaseBrowserClient();
    const { data } = await supabase.auth.getUser();
    const user = data.user;
    if (!user) return;
    await supabase
      .from("school_waitlist")
      .upsert({ user_id: user.id, email: user.email ?? null }, { onConflict: "user_id", ignoreDuplicates: true });
  } catch {
    // no table yet, offline, … — nothing for the user to do
  }
}
