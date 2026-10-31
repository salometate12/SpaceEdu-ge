/**
 * Saved assignments („დავალების დამხმარე“), on the account (lib/user-data →
 * user_data, per-user RLS) like the other materials; localStorage is the
 * copy the pages read. One record per assignment: the input, the result,
 * the steps ticked off, the idea chosen and the chat.
 */
import type { TaskHelperResult, TaskSection, TaskType } from "@/lib/ai/task-helper-schema";
import { TASK_INPUT_MAX_CHARS } from "./task-helper";
import { userStore } from "./user-data";
import { TASK_HELPERS_KEY, TASK_HELPERS_LIMIT, TASK_HELPERS_UPDATED_EVENT } from "./user-data-keys";

export { TASK_HELPERS_UPDATED_EVENT };

const TOMBSTONE_DAYS = 60;

export interface TaskChatMessage {
  role: "user" | "assistant";
  content: string;
  /** ms */
  at: number;
}

export interface TaskHelper {
  id: string;
  title: string;
  taskType: TaskType;
  sections: TaskSection[];
  /** A semester subject (lib/semester-subjects) it belongs to. */
  subjectId?: string;
  subjectName?: string;
  /** YYYY-MM-DD */
  dueDate?: string;
  /** The assignment's text (cut to TASK_INPUT_MAX_CHARS) and what the student wrote. */
  inputText: string;
  note?: string;
  fileName?: string;
  /** A file in the account's storage it was made from (the subject page's files). */
  filePath?: string;
  result: TaskHelperResult;
  /** Indexes of the steps done. */
  doneSteps: number[];
  /** Index of the idea chosen, or null. */
  chosenIdea: number | null;
  messages: TaskChatMessage[];
  /** ms */
  createdAt: number;
  updatedAt: number;
  lastOpenedAt?: number;
  deletedAt?: number;
}

function readAll(): TaskHelper[] {
  if (typeof window === "undefined") return [];
  const value = userStore.get<unknown>(TASK_HELPERS_KEY, []);
  return Array.isArray(value) ? (value as TaskHelper[]) : [];
}

function writeAll(list: TaskHelper[], now: number): void {
  const cutoff = now - TOMBSTONE_DAYS * 86_400_000;
  userStore.set(
    TASK_HELPERS_KEY,
    list.filter((item) => !item.deletedAt || item.deletedAt > cutoff).slice(0, TASK_HELPERS_LIMIT),
  );
  if (typeof window !== "undefined") window.dispatchEvent(new Event(TASK_HELPERS_UPDATED_EVENT));
}

export function getTaskHelpers(): TaskHelper[] {
  return readAll().filter((item) => !item.deletedAt);
}

export function getTaskHelper(id: string): TaskHelper | undefined {
  return getTaskHelpers().find((item) => item.id === id);
}

export function newTaskHelperId(now: number = Date.now()): string {
  return `task-${now.toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function saveTaskHelper(item: TaskHelper, now: number = Date.now()): void {
  const rest = readAll().filter((entry) => entry.id !== item.id);
  writeAll([{ ...item, inputText: item.inputText.slice(0, TASK_INPUT_MAX_CHARS), updatedAt: now }, ...rest], now);
}

export function updateTaskHelper(id: string, patch: Partial<TaskHelper>, now: number = Date.now()): TaskHelper | undefined {
  let updated: TaskHelper | undefined;
  const list = readAll().map((item) => {
    if (item.id !== id || item.deletedAt) return item;
    updated = { ...item, ...patch, updatedAt: now };
    return updated;
  });
  if (updated) writeAll(list, now);
  return updated;
}

/** Ticks a step on or off. */
export function toggleTaskStep(id: string, step: number, now: number = Date.now()): TaskHelper | undefined {
  const item = getTaskHelper(id);
  if (!item) return undefined;
  const done = item.doneSteps.includes(step) ? item.doneSteps.filter((value) => value !== step) : [...item.doneSteps, step].sort((a, b) => a - b);
  return updateTaskHelper(id, { doneSteps: done }, now);
}

export function chooseTaskIdea(id: string, idea: number | null, now: number = Date.now()): TaskHelper | undefined {
  return updateTaskHelper(id, { chosenIdea: idea }, now);
}

export function addTaskMessages(id: string, messages: TaskChatMessage[], now: number = Date.now()): TaskHelper | undefined {
  const item = getTaskHelper(id);
  if (!item) return undefined;
  // The last 40 turns: plenty for one assignment, kept inside the row.
  return updateTaskHelper(id, { messages: [...item.messages, ...messages].slice(-40) }, now);
}

export function renameTaskHelper(id: string, title: string): void {
  const next = title.trim();
  if (next) updateTaskHelper(id, { title: next });
}

export function markTaskHelperOpened(id: string, now: number = Date.now()): void {
  updateTaskHelper(id, { lastOpenedAt: now }, now);
}

/** Removes it everywhere: the record stays, empty, until the tombstone expires. */
export function deleteTaskHelper(id: string, now: number = Date.now()): void {
  const list = readAll().map((item): TaskHelper =>
    item.id === id ? { ...item, inputText: "", messages: [], deletedAt: now, updatedAt: now } : item,
  );
  writeAll(list, now);
}
