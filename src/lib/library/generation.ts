/**
 * Decks and quizzes being made, for „ჩემი მასალები“. A generation is saved
 * the moment it starts (status „generating“) and runs here, outside any
 * page, so moving around the site doesn't stop it; its cards are written
 * into the deck as they arrive. When the tab closes, the server finishes
 * it into a job row (lib/generation-jobs); `reconcileGenerations` reads
 * those rows (polled every 3 seconds while anything is generating) and
 * moves the result into the library. On finishing out of sight: a
 * notification. Nothing here is charged, so a failure has nothing to refund.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { UploadedData } from "@/lib/generation-input";
import { generateFlashcards, GENERATION_ERROR } from "@/lib/generate-flashcards";
import { createDeckFromGenerated, getCustomDeckById, getCustomDecks, saveCustomDeck, updateCustomDeck } from "@/lib/custom-decks";
import { GENERATION_JOB_PREFIX, isStale, jobCards, jobKey, type GenerationJob } from "@/lib/generation-jobs";
import { addSystemNotification } from "@/lib/notifications";
import { getQuizzes, newQuizRecord, saveQuiz, updateQuiz, type QuizQuestion, type SavedQuiz } from "@/lib/quiz-library";
import type { Deck, Flashcard, GenerationRetry, MaterialSourceType } from "@/lib/types";
import type { FlashcardDraft } from "@/lib/ai/parse-flashcards-json";

/* --- The account's job rows ---------------------------------------------- */

let remote: { client: SupabaseClient; userId: string } | null = null;

/** Signed in (UserDataSync): job rows can be read. */
export function connectGenerationJobs(client: SupabaseClient, userId: string): void {
  remote = { client, userId };
  void reconcileGenerations({ cleanup: true });
}

export function disconnectGenerationJobs(): void {
  remote = null;
}

/** The job, null when there's none, undefined when it can't be known (signed out, offline). */
async function readJob(id: string): Promise<GenerationJob | null | undefined> {
  if (!remote) return undefined;
  try {
    const { data, error } = await remote.client
      .from("user_data")
      .select("value")
      .eq("user_id", remote.userId)
      .eq("key", jobKey(id))
      .maybeSingle();
    if (error) return undefined;
    return (data?.value as GenerationJob | undefined) ?? null;
  } catch {
    return undefined;
  }
}

async function deleteJobs(ids: string[]): Promise<void> {
  if (!remote || ids.length === 0) return;
  try {
    await remote.client.from("user_data").delete().eq("user_id", remote.userId).in("key", ids.map(jobKey));
  } catch {
    // Left for the next clean-up.
  }
}

async function listJobIds(): Promise<string[]> {
  if (!remote) return [];
  try {
    const { data } = await remote.client
      .from("user_data")
      .select("key")
      .eq("user_id", remote.userId)
      .like("key", `${GENERATION_JOB_PREFIX}%`);
    return (data ?? []).map((row: { key: string }) => row.key.slice(GENERATION_JOB_PREFIX.length));
  } catch {
    return [];
  }
}

/* --- What this tab is making, and who's looking at it --------------------- */

/** Generations running in this tab, with what was sent (for „თავიდან ცდა“). */
const running = new Set<string>();
const inputs = new Map<string, UploadedData>();
/** Ids a page is showing the progress of: no notification for those. */
const watched = new Set<string>();

export function isGeneratingHere(id: string): boolean {
  return running.has(id);
}

type ProgressListener = (ready: number, latestQuestion: string | null) => void;
const progressListeners = new Map<string, Set<ProgressListener>>();

/** Live progress of a generation running in this tab; returns the unsubscribe. */
export function followProgress(id: string, listener: ProgressListener): () => void {
  let set = progressListeners.get(id);
  if (!set) progressListeners.set(id, (set = new Set()));
  set.add(listener);
  return () => set.delete(listener);
}

/** The page showing `id`'s progress; returns the release. */
export function watchGeneration(id: string): () => void {
  watched.add(id);
  return () => watched.delete(id);
}

/* --- Decks ----------------------------------------------------------------- */

const SOURCE_PREFIX = /^(პრეზენტაცია|YouTube):\s*/;

function newId(prefix: string, now: number): string {
  return `${prefix}-${now.toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function toCards(deckId: string, drafts: FlashcardDraft[]): Flashcard[] {
  return drafts.map((card, index) => ({
    id: `${deckId}-${index}`,
    question: card.question,
    answer: card.answer,
    ...(card.hint?.trim() ? { hint: card.hint.trim() } : {}),
  }));
}

/** What can be sent again without the file (which can't be kept). */
function retryOf(data: UploadedData): GenerationRetry {
  const base: GenerationRetry = { topic: data.topic, difficulty: data.difficulty ?? null };
  if (data.inputType === "text" || (data.inputType === "presentation" && !data.file)) return { ...base, text: data.text };
  if (data.inputType === "youtube") return { ...base, youtubeUrl: data.youtubeUrl, youtubeRange: data.youtubeRange ?? null };
  return base;
}

function deckReady(deck: Deck, notify: boolean) {
  if (!notify) return;
  addSystemNotification({
    id: `deck-ready-${deck.id}`,
    title: `ბარათები მზადაა: ${deck.title}`,
    body: `${deck.cards.length} ბარათი`,
    href: `/deck/${deck.id}`,
  });
}

/**
 * Saves a „generating“ deck and starts filling it. Returns its id at once;
 * `done` settles with the finished deck (or throws).
 */
export function startDeckGeneration(data: UploadedData, existingId?: string): { deckId: string; done: Promise<Deck> } {
  const now = Date.now();
  const deckId = existingId ?? `custom-${now}`;
  const jobId = newId("job", now);
  const title = data.topic.trim() || data.sourceLabel?.replace(SOURCE_PREFIX, "") || "ფლეშბარათები";
  const previous = existingId ? getCustomDeckById(existingId) : undefined;
  saveCustomDeck(
    {
      id: deckId,
      title: previous?.title ?? title,
      description: "",
      category: "georgian",
      cards: [],
      ...(data.sourceLabel ? { source: data.sourceLabel } : {}),
      status: "generating",
      sourceType: data.inputType as MaterialSourceType,
      sourceName: data.sourceLabel?.replace(SOURCE_PREFIX, "") ?? "",
      cardTarget: data.cardCount,
      createdAt: previous?.createdAt ?? now,
      jobId,
      retry: retryOf(data),
    },
    now,
  );
  running.add(deckId);
  inputs.set(deckId, data);

  const done = (async () => {
    let lastWrite = 0;
    let written = 0;
    try {
      const parsed = await generateFlashcards(
        data,
        (ready, latest, cards) => {
          progressListeners.get(deckId)?.forEach((listener) => listener(ready, latest?.question ?? null));
          const at = Date.now();
          if (cards.length === written || at - lastWrite < 1200) return;
          lastWrite = at;
          written = cards.length;
          updateCustomDeck(deckId, { cards: toCards(deckId, cards) }, at);
        },
        { jobId },
      );
      const current = getCustomDeckById(deckId);
      const generated = createDeckFromGenerated(parsed, "georgian", data.sourceLabel, deckId);
      // Renamed while it was being made: that name stays.
      const renamed = current && current.title !== title && current.title !== previous?.title;
      const deck =
        updateCustomDeck(deckId, {
          title: renamed ? current.title : generated.title,
          description: generated.description,
          cards: generated.cards,
          status: "ready",
          retry: undefined,
          jobId: undefined,
        }) ?? generated;
      inputs.delete(deckId);
      deckReady(deck, !watched.has(deckId));
      return deck;
    } catch (error) {
      updateCustomDeck(deckId, { status: "failed" });
      throw error instanceof Error ? error : new Error(GENERATION_ERROR);
    } finally {
      running.delete(deckId);
      void deleteJobs([jobId]);
    }
  })();
  return { deckId, done };
}

/**
 * „თავიდან ცდა“: the same request again, into the same deck. Null when it
 * was made from a file this tab no longer has: the generator opens instead.
 */
export function retryDeckGeneration(deckId: string): { deckId: string; done: Promise<Deck> } | null {
  const deck = getCustomDeckById(deckId);
  if (!deck || running.has(deckId)) return null;
  const known = inputs.get(deckId);
  if (known) return startDeckGeneration(known, deckId);
  const retry = deck.retry;
  const type = deck.sourceType;
  const canResend =
    retry && (type === "text" || type === "youtube" || type === "presentation") && (retry.text || retry.youtubeUrl);
  if (!canResend) return null;
  return startDeckGeneration(
    {
      inputType: type,
      file: null,
      text: retry.text ?? "",
      youtubeUrl: retry.youtubeUrl ?? "",
      youtubeRange: retry.youtubeRange ?? null,
      topic: retry.topic ?? "",
      cardCount: deck.cardTarget ?? 20,
      difficulty: (retry.difficulty as UploadedData["difficulty"]) ?? null,
      sourceLabel: deck.source,
    },
    deckId,
  );
}

/* --- Quizzes --------------------------------------------------------------- */

const QUIZ_GENERATION_ERROR = "AI ახლა გადატვირთულია, სცადე ცოტა ხანში.";

function quizReady(quiz: SavedQuiz, notify: boolean) {
  if (!notify) return;
  addSystemNotification({
    id: `quiz-ready-${quiz.id}`,
    title: `ქვიზი მზადაა: ${quiz.title}`,
    body: `${quiz.questions.length} კითხვა`,
    href: `/quiz?quiz=${encodeURIComponent(quiz.id)}`,
  });
}

/** Saves a „generating“ quiz and asks for it; `done` settles with the saved quiz. */
export function startQuizGeneration(file: File, questionCount: number): { quizId: string; done: Promise<SavedQuiz> } {
  const record = newQuizRecord(file.name.replace(/\.[^.]+$/, ""), questionCount);
  saveQuiz(record);
  running.add(record.id);

  const done = (async () => {
    try {
      const formData = new FormData();
      formData.append("file", file, file.name);
      formData.append("questionCount", String(questionCount));
      formData.append("jobId", record.jobId ?? record.id);
      const response = await fetch("/api/quiz", { method: "POST", body: formData });
      const data = (await response.json()) as { questions?: QuizQuestion[]; error?: string | boolean; message?: string };
      if (!response.ok || !Array.isArray(data.questions)) {
        // Only a real message: some errors come back as `{ error: true }`.
        const message =
          typeof data.message === "string" && data.message
            ? data.message
            : typeof data.error === "string" && data.error
              ? data.error
              : QUIZ_GENERATION_ERROR;
        throw new Error(message);
      }
      const quiz =
        updateQuiz(record.id, { questions: data.questions, questionCount: data.questions.length, status: "ready", jobId: undefined }) ??
        { ...record, questions: data.questions, status: "ready" as const };
      quizReady(quiz, !watched.has(record.id));
      return quiz;
    } catch (error) {
      const message = error instanceof Error && error.message ? error.message : QUIZ_GENERATION_ERROR;
      updateQuiz(record.id, { status: "failed", error: message });
      throw new Error(message);
    } finally {
      running.delete(record.id);
      void deleteJobs([record.jobId ?? record.id]);
    }
  })();
  return { quizId: record.id, done };
}

/* --- Picking up what other tabs (or the server) finished ---------------- */

/** Anything generating that this tab isn't making itself. */
export function hasOutsideGenerations(): boolean {
  return (
    getCustomDecks().some((deck) => deck.status === "generating" && !running.has(deck.id)) ||
    getQuizzes().some((quiz) => quiz.status === "generating" && !running.has(quiz.id))
  );
}

let reconciling = false;

/**
 * Brings each outside generation up to date from its job row: progress,
 * the finished result (with a notification) or the failure. One that has
 * had no word for three minutes is over: kept with the cards it has, or
 * failed when it has none.
 */
export async function reconcileGenerations({ cleanup = false, now = Date.now() }: { cleanup?: boolean; now?: number } = {}): Promise<void> {
  if (reconciling || typeof window === "undefined") return;
  reconciling = true;
  try {
    const finished: string[] = [];

    for (const deck of getCustomDecks()) {
      if (deck.status !== "generating" || running.has(deck.id)) continue;
      const jobId = deck.jobId ?? deck.id;
      const job = await readJob(jobId);
      const cards = job ? jobCards(job) : [];
      if (job?.status === "ready") {
        const ready = updateCustomDeck(deck.id, {
          title: deck.title || job.deckTitle || "ფლეშბარათები",
          description: job.deckDescription ?? "",
          cards: toCards(deck.id, cards),
          status: "ready",
          retry: undefined,
          jobId: undefined,
        });
        if (ready) deckReady(ready, true);
        finished.push(jobId);
      } else if (job?.status === "failed") {
        updateCustomDeck(deck.id, { status: "failed" });
        finished.push(jobId);
      } else if (job && cards.length > deck.cards.length && !isStale(job.updatedAt, now)) {
        updateCustomDeck(deck.id, { cards: toCards(deck.id, cards) });
      } else if (job !== undefined && isStale(Math.max(job?.updatedAt ?? 0, deck.updatedAt ?? 0), now)) {
        const kept = cards.length > deck.cards.length ? toCards(deck.id, cards) : deck.cards;
        const over = updateCustomDeck(deck.id, kept.length > 0 ? { cards: kept, status: "ready", jobId: undefined } : { status: "failed" });
        if (over?.status === "ready") deckReady(over, true);
        finished.push(jobId);
      } else if (job === undefined && isStale(deck.updatedAt, now)) {
        // Signed out: nothing on the server to wait for.
        updateCustomDeck(deck.id, deck.cards.length > 0 ? { status: "ready" } : { status: "failed" });
      }
    }

    for (const quiz of getQuizzes()) {
      if (quiz.status !== "generating" || running.has(quiz.id)) continue;
      const jobId = quiz.jobId ?? quiz.id;
      const job = await readJob(jobId);
      if (job?.status === "ready" && Array.isArray(job.questions) && job.questions.length > 0) {
        const questions = job.questions as QuizQuestion[];
        const ready = updateQuiz(quiz.id, { questions, questionCount: questions.length, status: "ready", jobId: undefined });
        if (ready) quizReady(ready, true);
        finished.push(jobId);
      } else if (job?.status === "failed" || (job !== undefined && isStale(Math.max(job?.updatedAt ?? 0, quiz.updatedAt), now))) {
        updateQuiz(quiz.id, { status: "failed", ...(job?.error ? { error: job.error } : {}) });
        finished.push(jobId);
      } else if (job === undefined && isStale(quiz.updatedAt, now)) {
        updateQuiz(quiz.id, { status: "failed" });
      }
    }

    // Rows nothing is waiting for (finished here before the server wrote them).
    if (cleanup) {
      const waiting = new Set([
        ...getCustomDecks().filter((deck) => deck.status === "generating").map((deck) => deck.jobId ?? deck.id),
        ...getQuizzes().filter((quiz) => quiz.status === "generating").map((quiz) => quiz.jobId ?? quiz.id),
      ]);
      finished.push(...(await listJobIds()).filter((id) => !waiting.has(id)));
    }
    await deleteJobs([...new Set(finished)]);
  } finally {
    reconciling = false;
  }
}

