import { z } from "zod";
import { enforceRateLimit } from "@/lib/rate-limit";
import { STORED_FILE_MAX_BYTES, STORED_FILE_SIGNED_OUT, STORED_FILE_TOO_BIG } from "@/lib/stored-files-server";
import { USER_FILES_BUCKET, uploadPath } from "@/lib/user-files-path";
import { createClient as createServerSupabaseClient } from "@/utils/supabase/server";
import { isSupabaseBrowserConfigured } from "@/utils/supabase/env";

export const runtime = "nodejs";

const BodySchema = z.object({
  name: z.string().min(1).max(200),
  size: z.number().int().nonnegative(),
});

/**
 * A signed upload URL for a file dropped into a generator: the browser sends
 * the file straight to storage (<user_id>/uploads/…), never through this
 * app, and the generator is then given only its path. The path is chosen
 * here, in the student's own folder.
 */
export async function POST(request: Request) {
  const limited = await enforceRateLimit(request, "ai");
  if (limited) return limited;

  const parsed = BodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: true, message: "ფაილი არასწორია." }, { status: 400 });
  if (parsed.data.size > STORED_FILE_MAX_BYTES) return Response.json({ error: true, message: STORED_FILE_TOO_BIG }, { status: 413 });
  if (!isSupabaseBrowserConfigured()) return Response.json({ error: true, message: STORED_FILE_SIGNED_OUT }, { status: 401 });

  const supabase = await createServerSupabaseClient();
  const userId = (await supabase.auth.getUser()).data.user?.id;
  if (!userId) return Response.json({ error: true, message: STORED_FILE_SIGNED_OUT }, { status: 401 });

  const extension = parsed.data.name.match(/\.[a-z0-9]{1,8}$/i)?.[0]?.toLowerCase() ?? "";
  const path = uploadPath(userId, `${Date.now().toString(36)}-${crypto.randomUUID()}${extension}`);
  const { data, error } = await supabase.storage.from(USER_FILES_BUCKET).createSignedUploadUrl(path);
  if (error || !data) {
    console.error("[uploads/sign]", error?.message);
    return Response.json({ error: true, message: "ატვირთვა ვერ დაიწყო. სცადე თავიდან." }, { status: 500 });
  }
  return Response.json({ path: data.path, token: data.token });
}
