/**
 * A subject's topics and the record of its files, on the account (lib/
 * user-data → user_data, per-user RLS); localStorage is the copy the pages
 * read. Deleted ones stay as empty records for a while, so another device's
 * copy doesn't bring them back.
 */
import { userStore } from "./user-data";
import { SUBJECT_FILES_KEY, SUBJECT_TOPICS_KEY, SUBJECTS_UPDATED_EVENT } from "./user-data-keys";
import { getGeneratedMilestones } from "./syllabus-calendar";
import { statusAfterQuiz, syllabusTopicsToAdd, type SubjectFile, type SubjectTopic, type TopicStatus } from "./subjects";

export { SUBJECTS_UPDATED_EVENT };

const TOMBSTONE_DAYS = 60;

function readList<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  const value = userStore.get<unknown>(key, []);
  return Array.isArray(value) ? (value as T[]) : [];
}

function writeList<T extends { deletedAt?: number }>(key: string, list: T[], now: number): void {
  const cutoff = now - TOMBSTONE_DAYS * 86_400_000;
  userStore.set(key, list.filter((item) => !item.deletedAt || item.deletedAt > cutoff));
  if (typeof window !== "undefined") window.dispatchEvent(new Event(SUBJECTS_UPDATED_EVENT));
}

function patchItem<T extends { id: string; deletedAt?: number; updatedAt: number }>(key: string, id: string, patch: Partial<T>, now: number): T | undefined {
  let updated: T | undefined;
  const list = readList<T>(key).map((item) => {
    if (item.id !== id || item.deletedAt) return item;
    updated = { ...item, ...patch, updatedAt: now };
    return updated;
  });
  if (updated) writeList(key, list, now);
  return updated;
}

/* --- Topics ----------------------------------------------------------------- */

/** A subject's topics in order (or every subject's). */
export function getTopics(subjectId?: string): SubjectTopic[] {
  return readList<SubjectTopic>(SUBJECT_TOPICS_KEY)
    .filter((topic) => !topic.deletedAt && (!subjectId || topic.subjectId === subjectId))
    .sort((a, b) => a.order - b.order);
}

export function getTopic(id: string): SubjectTopic | undefined {
  return getTopics().find((topic) => topic.id === id);
}

export function addTopic(subjectId: string, title: string, now: number = Date.now()): SubjectTopic | undefined {
  const name = title.trim();
  if (!name) return undefined;
  const all = readList<SubjectTopic>(SUBJECT_TOPICS_KEY);
  const order = Math.max(0, ...all.filter((topic) => topic.subjectId === subjectId && !topic.deletedAt).map((topic) => topic.order)) + 1;
  const topic: SubjectTopic = {
    id: `topic-${subjectId}-${now.toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    subjectId,
    order,
    title: name,
    source: "manual",
    status: "new",
    createdAt: now,
    updatedAt: now,
  };
  writeList(SUBJECT_TOPICS_KEY, [...all, topic], now);
  return topic;
}

export function renameTopic(id: string, title: string, now: number = Date.now()): void {
  const name = title.trim();
  if (name) patchItem<SubjectTopic>(SUBJECT_TOPICS_KEY, id, { title: name }, now);
}

export function setTopicStatus(id: string, status: TopicStatus, now: number = Date.now()): void {
  patchItem<SubjectTopic>(SUBJECT_TOPICS_KEY, id, { status }, now);
}

/** Studying a topic started (the AI teacher, a tool opened on it): new becomes under way. */
export function markTopicStarted(id: string, now: number = Date.now()): void {
  const topic = getTopic(id);
  if (topic?.status === "new") setTopicStatus(id, "in_progress", now);
}

/** A quiz on the topic finished: its result on the chip, 80% or more marks it learned. */
export function recordTopicQuiz(id: string, percent: number, now: number = Date.now()): void {
  const topic = getTopic(id);
  if (!topic) return;
  patchItem<SubjectTopic>(SUBJECT_TOPICS_KEY, id, { quizPercent: Math.round(percent), status: statusAfterQuiz(topic.status, percent) }, now);
}

export function deleteTopic(id: string, now: number = Date.now()): void {
  patchItem<SubjectTopic>(SUBJECT_TOPICS_KEY, id, { deletedAt: now }, now);
  // Its files stay in the subject, without this topic.
  for (const file of getFiles().filter((item) => item.topicIds.includes(id))) {
    patchItem<SubjectFile>(SUBJECT_FILES_KEY, file.id, { topicIds: file.topicIds.filter((topicId) => topicId !== id) }, now);
  }
}

/** Adds the topics of the subject's syllabus analysis it doesn't have yet. Returns how many. */
export function syncSyllabusTopics(subject: { id: string; name: string }, now: number = Date.now()): number {
  const all = readList<SubjectTopic>(SUBJECT_TOPICS_KEY);
  const fresh = syllabusTopicsToAdd(all.filter((topic) => !topic.deletedAt), getGeneratedMilestones(), subject, now);
  if (fresh.length > 0) writeList(SUBJECT_TOPICS_KEY, [...all, ...fresh], now);
  return fresh.length;
}

/* --- Files ------------------------------------------------------------------ */

export function getFiles(subjectId?: string): SubjectFile[] {
  return readList<SubjectFile>(SUBJECT_FILES_KEY)
    .filter((file) => !file.deletedAt && (!subjectId || file.subjectId === subjectId))
    .sort((a, b) => b.createdAt - a.createdAt);
}

export function getFile(id: string): SubjectFile | undefined {
  return getFiles().find((file) => file.id === id);
}

export function saveFileRecord(file: SubjectFile, now: number = Date.now()): void {
  const rest = readList<SubjectFile>(SUBJECT_FILES_KEY).filter((item) => item.id !== file.id);
  writeList(SUBJECT_FILES_KEY, [{ ...file, updatedAt: now }, ...rest], now);
}

export function updateFileRecord(id: string, patch: Partial<SubjectFile>, now: number = Date.now()): SubjectFile | undefined {
  return patchItem<SubjectFile>(SUBJECT_FILES_KEY, id, patch, now);
}

/** „თემის შეცვლა“ / „ტიპის შეცვლა“: the student's choice, which a late guess won't overwrite. */
export function setFileTags(id: string, tags: Pick<Partial<SubjectFile>, "kind" | "topicIds" | "dueDate">, now: number = Date.now()): void {
  patchItem<SubjectFile>(SUBJECT_FILES_KEY, id, { ...tags, tagsByHand: true, tagging: false }, now);
}

export function markFileDeleted(id: string, now: number = Date.now()): void {
  patchItem<SubjectFile>(SUBJECT_FILES_KEY, id, { deletedAt: now }, now);
}
