/**
 * The activity log: every counted action, tagged with the space it
 * happened in. It lives in the account's `user_data` (lib/user-data, the
 * same synced store as the streak and the quiz history, with the
 * user-only RLS of migration 003), so the stats pages, the badges and the
 * overview all read one list, on every device.
 *
 * Writing is `logActivity({ type, … })` from the place where the action
 * finishes; reading is `readActivityLog()`. The aggregation lives in
 * lib/stats/* and is pure.
 */
import { spaceOwningPath } from "./access-control";
import { readActiveSpaceCookie } from "./active-space";
import { readSpaceeduSpace } from "./space-back-navigation";
import { userStore } from "./user-data";
import { ACTIVITY_LOG_KEY, ACTIVITY_LOG_LIMIT, ACTIVITY_LOG_UPDATED_EVENT, QUIZ_STATS_KEY, TOOL_USAGE_KEY } from "./user-data-keys";

export { ACTIVITY_LOG_UPDATED_EVENT };

export type StatsSpace = "student" | "abiturient";

export type ActivityType =
  | "tool_open"
  | "quiz_completed"
  | "ai_message"
  | "ai_session"
  | "plan_day_done"
  | "mock_exam_completed"
  | "past_test_solved"
  | "essay_graded"
  | "presentation_created"
  | "material_analyzed"
  | "journal_entry";

/** The tools the stats pages count, by one name each. */
export type ToolKey =
  | "ai_teacher"
  | "quiz"
  | "study_plan"
  | "presentation"
  | "material_analysis"
  | "eli5"
  | "cv"
  | "syllabus"
  | "journal"
  | "lecture_notes"
  | "conspectus"
  | "open_grader"
  | "practice"
  | "other";

export interface ActivityEvent {
  id: string;
  space: StatsSpace;
  type: ActivityType;
  tool: ToolKey | null;
  subject: string | null;
  /** A % for quizzes and simulations, a count for solved tasks. */
  value: number | null;
  meta: Record<string, unknown> | null;
  /** epoch ms. */
  createdAt: number;
}

export interface LogInput {
  type: ActivityType;
  tool?: ToolKey | null;
  subject?: string | null;
  value?: number | null;
  meta?: Record<string, unknown> | null;
  /** Defaults to the space the user is working in now. */
  space?: StatsSpace;
}

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function toStatsSpace(space: string | null | undefined): StatsSpace | null {
  if (space === "student") return "student";
  if (space === "abiturient" || space === "school") return "abiturient";
  return null;
}

/** The space the user is working in: the page's own, the remembered one, the device's last. */
export function currentStatsSpace(): StatsSpace {
  if (!isBrowser()) return "student";
  return (
    toStatsSpace(spaceOwningPath(window.location.pathname)) ??
    toStatsSpace(readActiveSpaceCookie()) ??
    toStatsSpace(readSpaceeduSpace()) ??
    "student"
  );
}

/** A tool id as the app records it („abit-history-open“, „ai-teacher“) → its stats name. */
export function toolKey(toolId: string): ToolKey {
  const id = toolId.toLowerCase();
  if (id.includes("ai-teacher") || id === "ai") return "ai_teacher";
  if (id.includes("quiz") || id.includes("flashcard")) return "quiz";
  if (id.includes("study-plan") || id.includes("plan")) return "study_plan";
  if (id.includes("presentation") || id.includes("deck")) return "presentation";
  if (id.includes("research") || id.includes("material") || id.includes("analy")) return "material_analysis";
  if (id.includes("eli5")) return "eli5";
  if (id.includes("cv")) return "cv";
  if (id.includes("syllabus")) return "syllabus";
  if (id.includes("journal")) return "journal";
  if (id.includes("lecture-notes")) return "lecture_notes";
  if (id.includes("conspectus")) return "conspectus";
  if (id.includes("-open")) return "open_grader";
  if (id.includes("practice") || id.includes("mcq")) return "practice";
  return "other";
}

function isEvent(value: unknown): value is ActivityEvent {
  const event = value as ActivityEvent;
  return (
    !!event &&
    typeof event.id === "string" &&
    (event.space === "student" || event.space === "abiturient") &&
    typeof event.type === "string" &&
    typeof event.createdAt === "number"
  );
}

/**
 * The tool opens and quiz runs saved before the log existed, as events of
 * `space` (they carry none of their own). Imported once, into an empty log,
 * so nobody's history starts from zero.
 */
export function legacyEvents(toolUsage: unknown, quizAttempts: unknown, space: StatsSpace): ActivityEvent[] {
  const events: ActivityEvent[] = [];
  if (Array.isArray(toolUsage)) {
    for (const raw of toolUsage as { id?: string; toolId?: string; subject?: string | null; timestamp?: number }[]) {
      if (typeof raw?.toolId !== "string" || typeof raw.timestamp !== "number") continue;
      events.push({
        id: `legacy-tool-${raw.id ?? raw.timestamp}`,
        space,
        type: "tool_open",
        tool: toolKey(raw.toolId),
        subject: raw.subject ?? null,
        value: null,
        meta: null,
        createdAt: raw.timestamp,
      });
    }
  }
  if (Array.isArray(quizAttempts)) {
    for (const raw of quizAttempts as { at?: number; correct?: number; total?: number; subject?: string | null }[]) {
      if (typeof raw?.at !== "number" || !raw.total) continue;
      events.push({
        id: `legacy-quiz-${raw.at}`,
        space,
        type: "quiz_completed",
        tool: "quiz",
        subject: raw.subject ?? null,
        value: Math.round(((raw.correct ?? 0) / raw.total) * 100),
        meta: { questions: raw.total },
        createdAt: raw.at,
      });
    }
  }
  return events;
}

let imported = false;

/** The whole log, oldest first. */
export function readActivityLog(): ActivityEvent[] {
  if (!isBrowser()) return [];
  const stored = userStore.get<unknown>(ACTIVITY_LOG_KEY, null);
  if (Array.isArray(stored)) return (stored.filter(isEvent) as ActivityEvent[]).sort((a, b) => a.createdAt - b.createdAt);
  if (!imported) {
    imported = true;
    const legacy = legacyEvents(
      userStore.get<unknown>(TOOL_USAGE_KEY, null),
      userStore.get<unknown>(QUIZ_STATS_KEY, null),
      currentStatsSpace(),
    );
    if (legacy.length > 0) {
      userStore.set(ACTIVITY_LOG_KEY, legacy.slice(-ACTIVITY_LOG_LIMIT));
      return legacy.sort((a, b) => a.createdAt - b.createdAt);
    }
  }
  return [];
}

/** Records one action. Safe to call from anywhere on the client; no-op on the server. */
export function logActivity(input: LogInput): void {
  if (!isBrowser()) return;
  try {
    const event: ActivityEvent = {
      id: crypto.randomUUID(),
      space: input.space ?? currentStatsSpace(),
      type: input.type,
      tool: input.tool ?? null,
      subject: input.subject ?? null,
      value: typeof input.value === "number" && Number.isFinite(input.value) ? input.value : null,
      meta: input.meta ?? null,
      createdAt: Date.now(),
    };
    const next = [...readActivityLog(), event].slice(-ACTIVITY_LOG_LIMIT);
    userStore.set(ACTIVITY_LOG_KEY, next);
    window.dispatchEvent(new Event(ACTIVITY_LOG_UPDATED_EVENT));
  } catch {
    /* stats are a convenience: never break the action itself */
  }
}
