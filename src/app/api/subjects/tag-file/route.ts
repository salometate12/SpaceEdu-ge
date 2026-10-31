import { z } from "zod";
import type { FilePart, ImagePart, TextPart } from "ai";
import { enforceRateLimit } from "@/lib/rate-limit";
import { requireApiKey } from "@/lib/ai/parse-form-data";
import { generateGeminiObject } from "@/lib/gemini";
import { extractFileContent } from "@/lib/ai/extract-file-text";
import { createClient as createServerSupabaseClient } from "@/utils/supabase/server";
import { isSupabaseBrowserConfigured } from "@/utils/supabase/env";
import { cleanTopicIds, guessKindFromName, SUBJECT_FILE_MAX_BYTES, type SubjectFileKind } from "@/lib/subjects";

export const runtime = "nodejs";
export const maxDuration = 60;

/** What the model reads of a file: enough to tell a lecture from an assignment and find its topic. */
const EXCERPT_CHARS = 4000;

const KINDS = ["lecture", "reading", "assignment", "presentation", "other"] as const;

const TopicsSchema = z.array(z.object({ id: z.string().max(120), title: z.string().max(300) })).max(80);

const AnswerSchema = z.object({
  kind: z.enum(KINDS),
  topicIds: z.array(z.string()),
});

const SYSTEM = `You sort a university student's course files. From the file's name and the start of its text, decide what kind of file it is and which of the course's topics it covers.
kind: "lecture" (lecture notes or slides from class), "reading" (a book chapter, article or other reading), "assignment" (homework, a brief, a task to hand in), "presentation" (a slide deck that isn't a lecture), "other".
topicIds: the ids of the one or two topics from the list that the file is mainly about; an empty list when none fits. Use only ids from the list.
Return ONLY valid JSON matching the schema.`;

/** The file's contents: from the account's storage (only the student's own folder), or as sent. */
async function readFile(form: FormData): Promise<{ name: string; buffer: Buffer } | null> {
  const name = String(form.get("name") ?? "file");
  const path = form.get("storagePath");
  if (typeof path === "string" && path && isSupabaseBrowserConfigured()) {
    const supabase = await createServerSupabaseClient();
    const { data } = await supabase.auth.getUser();
    const userId = data.user?.id;
    if (userId && path.startsWith(`${userId}/`)) {
      const download = await supabase.storage.from("subject-files").download(path);
      if (download.data) return { name, buffer: Buffer.from(await download.data.arrayBuffer()) };
    }
  }
  const file = form.get("file");
  if (file instanceof File && file.size > 0 && file.size <= SUBJECT_FILE_MAX_BYTES) return { name, buffer: Buffer.from(await file.arrayBuffer()) };
  return null;
}

/**
 * A subject file's kind and its one or two topics, guessed by a short, cheap
 * model call on the file's name and the start of its text. No credit is
 * spent. Without an answer (no AI, a failure) the kind comes from the name.
 */
export async function POST(request: Request) {
  const limited = await enforceRateLimit(request, "ai");
  if (limited) return limited;

  const form = await request.formData();
  const name = String(form.get("name") ?? "file").slice(0, 200);
  let topics: z.infer<typeof TopicsSchema> = [];
  try {
    topics = TopicsSchema.parse(JSON.parse(String(form.get("topics") ?? "[]")));
  } catch {
    topics = [];
  }
  const fallback = (): Response => Response.json({ kind: guessKindFromName(name), topicIds: [], guessed: true });

  try {
    requireApiKey("subjects-tag-file");
    const file = await readFile(form);
    const content: (TextPart | FilePart | ImagePart)[] = [];
    let excerpt = "";
    if (file) {
      const read = await extractFileContent(file.name, file.buffer);
      if ("text" in read) excerpt = read.text.replace(/\s+/g, " ").trim().slice(0, EXCERPT_CHARS);
      else if (read.part.type === "image") content.push(read.part);
    }
    content.unshift({
      type: "text",
      text: [
        `File name: ${name}`,
        topics.length ? `Course topics:\n${topics.map((topic) => `${topic.id}: ${topic.title}`).join("\n")}` : "The course has no topics yet: return an empty topicIds list.",
        excerpt ? `Start of the file's text:\n${excerpt}` : "The file's text couldn't be read.",
      ].join("\n\n"),
    });

    const answer = AnswerSchema.parse(
      await generateGeminiObject({
        schema: AnswerSchema,
        system: SYSTEM,
        messages: [{ role: "user", content }],
        // No output cap: Gemini counts its thinking in it, and a small cap cut the answer off.
        temperature: 0,
      }),
    );
    return Response.json({ kind: answer.kind satisfies SubjectFileKind, topicIds: cleanTopicIds(answer.topicIds, topics) });
  } catch (error) {
    console.error("[subjects/tag-file]", error instanceof Error ? error.message : error);
    return fallback();
  }
}
