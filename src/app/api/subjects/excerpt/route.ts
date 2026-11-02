import { enforceRateLimit } from "@/lib/rate-limit";
import { extractFileContent } from "@/lib/ai/extract-file-text";
import { createClient as createServerSupabaseClient } from "@/utils/supabase/server";
import { isSupabaseBrowserConfigured } from "@/utils/supabase/env";
import { SUBJECT_FILE_MAX_BYTES } from "@/lib/subjects";
import { shareBudget } from "@/lib/summary-files";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_FILES = 5;
const DEFAULT_BUDGET = 12_000;
const MAX_BUDGET = 40_000;

/**
 * The text of a topic's files, for a tool opened on the topic (the AI
 * teacher's context, a quiz's source, a presentation's notes): each file
 * read with the existing extractors and cut to an equal share of `budget`.
 * Files come from the account's storage (the student's own folder only) or
 * as sent. No AI call, so nothing is charged.
 */
export async function POST(request: Request) {
  const limited = await enforceRateLimit(request, "ai");
  if (limited) return limited;

  const form = await request.formData();
  const budget = Math.min(MAX_BUDGET, Math.max(1000, Number(form.get("budget")) || DEFAULT_BUDGET));
  const names = form.getAll("names").map(String);
  const paths = form.getAll("paths").map(String);
  const sent = form.getAll("files").filter((item): item is File => item instanceof File);

  let userId: string | null = null;
  let supabase: Awaited<ReturnType<typeof createServerSupabaseClient>> | null = null;
  if (paths.some(Boolean) && isSupabaseBrowserConfigured()) {
    supabase = await createServerSupabaseClient();
    userId = (await supabase.auth.getUser()).data.user?.id ?? null;
  }

  const read: { name: string; text: string }[] = [];
  let sentIndex = 0;
  for (let index = 0; index < Math.min(names.length, MAX_FILES); index += 1) {
    const name = names[index].slice(0, 200);
    const path = paths[index];
    let buffer: Buffer | null = null;
    if (path && supabase && userId && path.startsWith(`${userId}/`)) {
      const download = await supabase.storage.from("subject-files").download(path);
      if (download.data) buffer = Buffer.from(await download.data.arrayBuffer());
    } else if (!path) {
      const file = sent[sentIndex];
      sentIndex += 1;
      if (file && file.size <= SUBJECT_FILE_MAX_BYTES) buffer = Buffer.from(await file.arrayBuffer());
    }
    if (!buffer) continue;
    try {
      const content = await extractFileContent(name, buffer);
      if ("text" in content && content.text.trim()) read.push({ name, text: content.text.replace(/\n{3,}/g, "\n\n").trim() });
    } catch {
      // An unreadable file is left out; the rest still go.
    }
  }

  const limits = shareBudget(
    read.map((item) => item.text.length),
    budget,
  );
  return Response.json({ excerpts: read.map((item, index) => ({ name: item.name, text: item.text.slice(0, limits[index]) })) });
}
