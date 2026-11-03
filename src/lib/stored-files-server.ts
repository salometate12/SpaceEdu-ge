/**
 * The server side of lib/stored-file: the generators (flashcards,
 * conspectus, quiz) get files as storage paths and read them here, with the
 * student's own session (storage RLS) and only from their own folder. Each
 * one is put on the form as the file it stands for, so the rest of the
 * route reads it as if it had been sent.
 */
import { createClient as createServerSupabaseClient } from "@/utils/supabase/server";
import { isSupabaseBrowserConfigured } from "@/utils/supabase/env";
import { GenerationInputError } from "@/lib/generation-options";
import { STORED_FIELDS, STORED_NAMES, STORED_PATHS, STORED_TYPES } from "@/lib/stored-file";
import { bucketFor, isOwnPath } from "@/lib/user-files-path";

/** The bucket's own limit (migration 007). */
export const STORED_FILE_MAX_BYTES = 20 * 1024 * 1024;
const MAX_STORED_FILES = 5;
const FIELDS = new Set(["file", "files"]);

export const STORED_FILE_TOO_BIG = "ფაილი ძალიან დიდია. მაქსიმუმ 20 MB.";
export const STORED_FILE_MISSING = "ფაილი ანგარიშზე ვერ ვიპოვეთ. ატვირთე ისევ.";
export const STORED_FILE_SIGNED_OUT = "ფაილის წასაკითხად შედი ანგარიშზე.";

/** Reads the form's stored files into it (as `file` / `files`). A form without any is left as it is. */
export async function attachStoredFiles(form: FormData): Promise<void> {
  const paths = form.getAll(STORED_PATHS).map(String).filter(Boolean);
  if (paths.length === 0) return;
  if (paths.length > MAX_STORED_FILES) throw new GenerationInputError("მაქსიმუმ 5 ფაილი.");
  if (!isSupabaseBrowserConfigured()) throw new GenerationInputError(STORED_FILE_SIGNED_OUT);
  const names = form.getAll(STORED_NAMES).map(String);
  const types = form.getAll(STORED_TYPES).map(String);
  const fields = form.getAll(STORED_FIELDS).map(String);

  const supabase = await createServerSupabaseClient();
  const userId = (await supabase.auth.getUser()).data.user?.id;
  if (!userId) throw new GenerationInputError(STORED_FILE_SIGNED_OUT);

  for (const [index, path] of paths.entries()) {
    if (!isOwnPath(path, userId)) throw new GenerationInputError(STORED_FILE_MISSING);
    const { data, error } = await supabase.storage.from(bucketFor(path)).download(path);
    if (error || !data) throw new GenerationInputError(STORED_FILE_MISSING);
    if (data.size > STORED_FILE_MAX_BYTES) throw new GenerationInputError(STORED_FILE_TOO_BIG);
    const name = (names[index] || path.split("/").pop() || "file").slice(0, 200);
    const field = FIELDS.has(fields[index]) ? fields[index] : "file";
    const file = new File([await data.arrayBuffer()], name, { type: types[index] || data.type || "application/octet-stream" });
    if (field === "file") form.set("file", file);
    else form.append("files", file);
  }
  for (const key of [STORED_PATHS, STORED_NAMES, STORED_TYPES, STORED_FIELDS]) form.delete(key);
}
