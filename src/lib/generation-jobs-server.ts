/**
 * The server's side of lib/generation-jobs: reading and writing the signed
 * in student's job row with their own session (the cookie), so the
 * `user_data` RLS (own rows only) applies as in the browser. Signed out or
 * Supabase not configured: no job, the request works as before.
 */
import { createClient as createServerSupabaseClient } from "@/utils/supabase/server";
import { isSupabaseBrowserConfigured } from "@/utils/supabase/env";
import { isJobId, jobKey, type GenerationJob } from "@/lib/generation-jobs";

export interface JobStore {
  read(id: string): Promise<GenerationJob | null>;
  write(job: GenerationJob): Promise<void>;
}

/** The job store for this request's user, or null. Call it inside the request (it reads the cookies). */
export async function jobStoreForRequest(jobId: unknown): Promise<JobStore | null> {
  if (!isJobId(jobId) || !isSupabaseBrowserConfigured()) return null;
  try {
    const supabase = await createServerSupabaseClient();
    const { data } = await supabase.auth.getUser();
    const userId = data.user?.id;
    if (!userId) return null;
    return {
      async read(id) {
        const { data: row } = await supabase
          .from("user_data")
          .select("value")
          .eq("user_id", userId)
          .eq("key", jobKey(id))
          .maybeSingle();
        return (row?.value as GenerationJob | undefined) ?? null;
      },
      async write(job) {
        const { error } = await supabase
          .from("user_data")
          .upsert({ user_id: userId, key: jobKey(job.id), value: job }, { onConflict: "user_id,key" });
        if (error) console.error("[generation-jobs] write failed", error.message);
      },
    };
  } catch {
    return null;
  }
}
