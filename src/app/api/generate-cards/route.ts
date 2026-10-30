import { after } from "next/server";
import { GEORGIAN_FLASHCARD_SYSTEM_PROMPT } from "@/lib/ai/prompts";
import { enforceRateLimit } from "@/lib/rate-limit";
import { FLASHCARD_JSON_OUTPUT_RULE, parseGeneratedFlashcardsJson } from "@/lib/ai/parse-flashcards-json";
import {
  parseGenerationFormData,
  requireApiKey,
} from "@/lib/ai/parse-form-data";
import { errorJsonResponse, generateLlmText, llmTextStreamResponse } from "@/lib/gemini";
import { GenerationInputError } from "@/lib/generation-options";
import { jobCards, nextMissingPart, withPart, type GenerationJob } from "@/lib/generation-jobs";
import { jobStoreForRequest, type JobStore } from "@/lib/generation-jobs-server";

export const dynamic = "force-dynamic";
// The parts a closed tab left behind are finished after the response.
export const maxDuration = 300;

const SYSTEM = `${GEORGIAN_FLASHCARD_SYSTEM_PROMPT}\n${FLASHCARD_JSON_OUTPUT_RULE}`;

/** `jobPart` and `jobCounts` of a deck asked for in parts, when they make sense. */
function parseJobFields(formData: FormData): { part: number; counts: number[] } | null {
  const part = Number(formData.get("jobPart"));
  let counts: unknown;
  try {
    counts = JSON.parse(String(formData.get("jobCounts") ?? ""));
  } catch {
    return null;
  }
  if (!Array.isArray(counts) || counts.length === 0 || counts.length > 4) return null;
  if (!counts.every((count) => Number.isInteger(count) && count > 0 && count <= 50)) return null;
  if (!Number.isInteger(part) || part < 0 || part >= counts.length) return null;
  return { part, counts: counts as number[] };
}

async function readAll(stream: ReadableStream<Uint8Array>): Promise<string> {
  const decoder = new TextDecoder();
  const reader = stream.getReader();
  let text = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    text += decoder.decode(value, { stream: true });
  }
  return text + decoder.decode();
}

/**
 * After the response: this part's cards into the job, and, when the page
 * went away, the parts it never asked for, one by one.
 */
async function finishJob(options: {
  store: JobStore;
  jobId: string;
  part: number;
  counts: number[];
  text: Promise<string>;
  clientGone: () => boolean;
  formData: FormData;
}) {
  const { store, jobId, part, counts, formData } = options;
  const base: GenerationJob = { id: jobId, kind: "cards", status: "generating", counts, parts: counts.map(() => null), updatedAt: Date.now() };
  let job: GenerationJob = (await store.read(jobId)) ?? base;
  if (job.status === "failed") return;
  try {
    const parsed = parseGeneratedFlashcardsJson(await options.text);
    job = withPart({ ...job, counts }, part, parsed.cards, parsed, Date.now());
    await store.write(job);

    while (options.clientGone() && job.status === "generating") {
      const missing = nextMissingPart(job);
      if (missing === -1) break;
      const next = new FormData();
      for (const [key, value] of formData.entries()) next.append(key, value);
      next.set("cardCount", String(counts[missing]));
      next.set("avoidQuestions", JSON.stringify(jobCards(job).map((card) => card.question).slice(0, 50)));
      const { userMessage } = await parseGenerationFormData(next, "flashcards");
      const text = await generateLlmText({ system: SYSTEM, messages: [userMessage], temperature: 0.4 });
      const more = parseGeneratedFlashcardsJson(text);
      job = withPart(job, missing, more.cards, more, Date.now());
      await store.write(job);
    }
  } catch (error) {
    // Only the server's own copy: the open page shows its own error.
    if (options.clientGone()) {
      const message = error instanceof Error ? error.message : "";
      await store.write({ ...job, status: "failed", error: message.slice(0, 300), updatedAt: Date.now() });
    }
  }
}

export async function POST(request: Request) {
  const limited = await enforceRateLimit(request, "ai");
  if (limited) return limited;

  try {
    requireApiKey("generate-cards");

    const formData = await request.formData();
    const { userMessage } = await parseGenerationFormData(
      formData,
      "flashcards",
    );

    const response = llmTextStreamResponse({
      system: SYSTEM,
      messages: [userMessage],
      temperature: 0.4,
      // 50 Georgian cards with hints fit well inside this; it is also under every provider's cap.
      maxOutputTokens: 16_000,
    });

    // A signed-in student's deck: the server keeps a copy (lib/generation-jobs).
    const jobId = formData.get("jobId");
    const fields = parseJobFields(formData);
    const store = fields ? await jobStoreForRequest(jobId) : null;
    if (!store || !fields || !response.body) return response;

    const [toClient, toServer] = response.body.tee();
    let gone = false;
    const reader = toClient.getReader();
    const body = new ReadableStream<Uint8Array>({
      async pull(controller) {
        const { done, value } = await reader.read();
        if (done) controller.close();
        else controller.enqueue(value);
      },
      cancel() {
        gone = true;
        void reader.cancel();
      },
    });
    const text = readAll(toServer);
    after(() =>
      finishJob({
        store,
        jobId: String(jobId),
        part: fields.part,
        counts: fields.counts,
        text,
        clientGone: () => gone || request.signal.aborted,
        formData,
      }),
    );
    return new Response(body, { status: response.status, headers: response.headers });
  } catch (error) {
    if (error instanceof GenerationInputError) {
      return Response.json({ error: error.message, message: error.message }, { status: 400 });
    }
    return errorJsonResponse(error, "generate-cards");
  }
}
