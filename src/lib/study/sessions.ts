/**
 * „სწავლის სესია“ in the browser: each session on the account (lib/
 * user-data, one user_items row per session; `spaceedu-study-sessions`),
 * so it goes on from the same part on another device. Pure helpers first
 * (progress, time, the finish screen's numbers), then the store.
 */
import { userStore } from "@/lib/user-data";
import { STUDY_SESSIONS_KEY, STUDY_SESSIONS_UPDATED_EVENT } from "@/lib/user-data-keys";
import type { CheckQuestion, SourceRef, StudyMode, StudyPart, StudyPlanPart } from "./schemas";

export { STUDY_SESSIONS_KEY, STUDY_SESSIONS_UPDATED_EVENT };

const TOMBSTONE_DAYS = 60;
/** „ჰკითხე ამ მასალას“ keeps the last messages with the session. */
export const STUDY_CHAT_LIMIT = 20;

export const MODE_LABELS: Record<StudyMode, string> = {
  full: "სრული გავლა",
  quick: "სწრაფი გამეორება",
  check: "შემამოწმე",
};

export interface SessionFile {
  id: string;
  name: string;
  size: number;
  mime: string;
  storagePath: string | null;
}

export interface StudyChatMessage {
  role: "user" | "assistant";
  text: string;
}

export interface StudySession {
  id: string;
  subjectId: string;
  topicId?: string;
  files: SessionFile[];
  mode: StudyMode;
  /** Null until the plan is made. */
  plan: StudyPlanPart[] | null;
  /** Each part once made (null before); index as in the plan. */
  parts: (StudyPart | null)[];
  /** The option chosen for each part's question (null before). */
  answers: (number | null)[];
  /** „შემამოწმე“: the eight questions and the answers, before the plan. */
  checkQuestions?: CheckQuestion[];
  checkAnswers?: (number | null)[];
  /** Whether each file's units are slides or pages, for the source chip. */
  kinds?: Record<string, "slide" | "page">;
  currentIndex: number;
  chat?: StudyChatMessage[];
  /** Minutes the whole session is expected to take. */
  estimateMinutes: number;
  /** ms */
  startedAt: number;
  finishedAt?: number;
  updatedAt: number;
  deletedAt?: number;
}

/* --- Pure ------------------------------------------------------------------ */

/** About how long the files take: a few minutes each, more for bigger ones (pages and slides aren't counted here). */
export function estimateMinutes(files: Pick<SessionFile, "size">[], mode: StudyMode = "full"): number {
  if (mode === "quick") return 15;
  const minutes = files.reduce((sum, file) => sum + Math.min(25, 6 + Math.round((file.size / (1024 * 1024)) * 2)), 0);
  const total = mode === "check" ? Math.max(10, Math.round(minutes * 0.6)) : minutes;
  return Math.max(5, Math.round(total / 5) * 5);
}

/** About how many parts a full pass will have. */
export function estimateParts(minutes: number): number {
  return Math.min(10, Math.max(5, Math.round(minutes / 4)));
}

/** Parts done (answered) of all. */
export function progressOf(session: Pick<StudySession, "plan" | "answers">): { done: number; total: number } {
  const total = session.plan?.length ?? 0;
  const done = session.answers.slice(0, total).filter((answer) => answer !== null).length;
  return { done, total };
}

/** Minutes still to go, from the estimate and the parts left. */
export function remainingMinutes(session: Pick<StudySession, "plan" | "answers" | "estimateMinutes">): number {
  const { done, total } = progressOf(session);
  if (total === 0) return session.estimateMinutes;
  return Math.max(1, Math.round((session.estimateMinutes * (total - done)) / total));
}

/** Answered right the first time, of all the parts' questions. */
export function scoreOf(session: Pick<StudySession, "parts" | "answers">): { correct: number; total: number; wrong: number[] } {
  const wrong: number[] = [];
  let correct = 0;
  session.parts.forEach((part, index) => {
    const answer = session.answers[index];
    if (!part || answer === null || answer === undefined) return;
    if (answer === part.check.correctIndex) correct += 1;
    else wrong.push(index);
  });
  return { correct, total: session.parts.filter(Boolean).length, wrong };
}

/** „შემამოწმე“: the topics of the questions answered wrongly (what the parts are then made for). */
export function missedTopics(questions: CheckQuestion[], answers: (number | null)[]): string[] {
  return [...new Set(questions.filter((question, index) => answers[index] !== null && answers[index] !== question.correctIndex).map((question) => question.topic))];
}

export function isFinished(session: Pick<StudySession, "finishedAt">): boolean {
  return typeof session.finishedAt === "number";
}

/** „{file}, სლაიდი {k}“ for a part's first source. */
export function sourceLabel(ref: SourceRef | undefined, session: Pick<StudySession, "files" | "kinds">): string | null {
  if (!ref) return null;
  const file = session.files.find((item) => item.id === ref.fileId);
  if (!file) return null;
  const kind = session.kinds?.[ref.fileId] === "slide" ? "სლაიდი" : "გვერდი";
  return `${file.name.replace(/\.[a-z0-9]{1,8}$/i, "")}, ${kind} ${ref.unit}`;
}

export function sessionHref(session: Pick<StudySession, "id" | "subjectId">): string {
  return `/subjects/${encodeURIComponent(session.subjectId)}/study/${encodeURIComponent(session.id)}`;
}

export function newSessionHref(subjectId: string, fileIds: string[], topicId?: string): string {
  const params = new URLSearchParams({ files: fileIds.join(",") });
  if (topicId) params.set("topic", topicId);
  return `/subjects/${encodeURIComponent(subjectId)}/study/new?${params.toString()}`;
}

/* --- Store ----------------------------------------------------------------- */

function readAll(): StudySession[] {
  if (typeof window === "undefined") return [];
  const value = userStore.get<unknown>(STUDY_SESSIONS_KEY, []);
  return Array.isArray(value) ? (value as StudySession[]).filter((item) => typeof item?.id === "string" && Array.isArray(item.files)) : [];
}

function writeAll(sessions: StudySession[], now: number): void {
  const cutoff = now - TOMBSTONE_DAYS * 86_400_000;
  userStore.set(STUDY_SESSIONS_KEY, sessions.filter((item) => !item.deletedAt || item.deletedAt > cutoff));
  window.dispatchEvent(new Event(STUDY_SESSIONS_UPDATED_EVENT));
}

export function getSessions(subjectId?: string): StudySession[] {
  return readAll()
    .filter((item) => !item.deletedAt && (!subjectId || item.subjectId === subjectId))
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

export function getSession(id: string): StudySession | undefined {
  return readAll().find((item) => item.id === id && !item.deletedAt);
}

/** The subject's latest session not finished yet, for „გააგრძელე სესია“. */
export function unfinishedSession(subjectId: string): StudySession | undefined {
  return getSessions(subjectId).find((item) => !isFinished(item) && (item.plan?.length ?? 0) > 0);
}

export function createSession(input: { subjectId: string; topicId?: string; files: SessionFile[]; mode: StudyMode }, now: number = Date.now()): StudySession {
  const session: StudySession = {
    id: typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `study-${now.toString(36)}`,
    subjectId: input.subjectId,
    ...(input.topicId ? { topicId: input.topicId } : {}),
    files: input.files,
    mode: input.mode,
    plan: null,
    parts: [],
    answers: [],
    currentIndex: 0,
    estimateMinutes: estimateMinutes(input.files, input.mode),
    startedAt: now,
    updatedAt: now,
  };
  writeAll([session, ...readAll()], now);
  return session;
}

/** Saves the session as it is now (a part made, an answer, the place). */
export function saveSession(session: StudySession, now: number = Date.now()): StudySession {
  const next = { ...session, updatedAt: now };
  writeAll([next, ...readAll().filter((item) => item.id !== session.id)], now);
  return next;
}

export function deleteSession(id: string, now: number = Date.now()): void {
  const session = readAll().find((item) => item.id === id);
  if (session) writeAll([{ ...session, deletedAt: now, updatedAt: now }, ...readAll().filter((item) => item.id !== id)], now);
}
