/**
 * Daily quests for the abiturient dashboard.
 *
 * Progress resets each calendar day. Completing a quest is a
 * streak-worthy activity, so the first completion of the day feeds
 * `recordDailyActivity()` and the header streak counter goes up.
 */

import { recordDailyActivity } from "@/lib/daily-streak";

const STORAGE_KEY = "spaceedu-daily-quests";

export const DAILY_QUESTS_UPDATED_EVENT = "spaceedu-daily-quests-updated";

export const DAILY_QUEST_IDS = ["solve-test", "analyze-works", "write-essay"] as const;
export type DailyQuestId = (typeof DAILY_QUEST_IDS)[number];

export interface DailyQuestDefinition {
  id: DailyQuestId;
  label: string;
  description: string;
  target: number;
  href: string;
  /** Reward copy shown once the quest is done. */
  reward: string;
}

export const DAILY_QUEST_DEFINITIONS: DailyQuestDefinition[] = [
  {
    id: "solve-test",
    label: "ამოხსენი 1 ტესტი",
    description: "დაასრულე ერთი ვარიანტი ეროვნული გამოცდების არქივიდან",
    target: 1,
    href: "/subject/georgian/past-exams",
    reward: "არქივის ვარიანტი დასრულებულია",
  },
  {
    id: "analyze-works",
    label: "გაარჩიე 2 ნაწარმოები",
    description: "უპასუხე კითხვებს ორ სხვადასხვა ტექსტზე",
    target: 2,
    href: "/subject/georgian/reading-comprehension",
    reward: "ორი ტექსტი გარჩეულია",
  },
  {
    id: "write-essay",
    label: "შეაფასებინე 1 ესე",
    description: "ჩააბარე ესე AI შემფასებელს და მიიღე ქულა",
    target: 1,
    href: "/subject/georgian/essay-grader",
    reward: "ესე შეფასებულია",
  },
];

export interface DailyQuestState {
  id: DailyQuestId;
  progress: number;
}

export interface DailyQuestView extends DailyQuestDefinition {
  progress: number;
  completed: boolean;
}

interface StoredQuests {
  date: string;
  progress: Partial<Record<DailyQuestId, number>>;
}

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function isQuestId(value: string): value is DailyQuestId {
  return (DAILY_QUEST_IDS as readonly string[]).includes(value);
}

function readStored(): StoredQuests {
  const empty: StoredQuests = { date: todayIso(), progress: {} };
  if (!isBrowser()) return empty;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return empty;
    const parsed = JSON.parse(raw) as Partial<StoredQuests>;
    // A stored day that is not today has expired — start fresh.
    if (parsed.date !== todayIso()) return empty;
    const progress: StoredQuests["progress"] = {};
    for (const [key, value] of Object.entries(parsed.progress ?? {})) {
      if (isQuestId(key) && typeof value === "number") {
        progress[key] = Math.max(0, value);
      }
    }
    return { date: todayIso(), progress };
  } catch {
    return empty;
  }
}

function writeStored(stored: StoredQuests): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    window.dispatchEvent(new Event(DAILY_QUESTS_UPDATED_EVENT));
  } catch {
    /* storage unavailable — quests are best-effort */
  }
}

export function loadDailyQuests(): DailyQuestView[] {
  const stored = readStored();
  return DAILY_QUEST_DEFINITIONS.map((definition) => {
    const progress = Math.min(stored.progress[definition.id] ?? 0, definition.target);
    return {
      ...definition,
      progress,
      completed: progress >= definition.target,
    };
  });
}

/**
 * Advances a quest. When the step pushes it over the line, the day is
 * recorded as active so the streak counter moves.
 * Returns the updated quest list.
 */
export function recordQuestProgress(id: DailyQuestId, amount = 1): DailyQuestView[] {
  const definition = DAILY_QUEST_DEFINITIONS.find((quest) => quest.id === id);
  if (!definition || amount <= 0) return loadDailyQuests();

  const stored = readStored();
  const before = Math.min(stored.progress[id] ?? 0, definition.target);
  if (before >= definition.target) return loadDailyQuests();

  const after = Math.min(before + amount, definition.target);
  writeStored({ date: todayIso(), progress: { ...stored.progress, [id]: after } });

  if (after >= definition.target) {
    recordDailyActivity();
  }
  return loadDailyQuests();
}

export function completedQuestCount(quests?: DailyQuestView[]): number {
  return (quests ?? loadDailyQuests()).filter((quest) => quest.completed).length;
}
