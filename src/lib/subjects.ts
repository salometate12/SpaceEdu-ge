/**
 * „ჩემი საგნები“ as pure functions and types: a subject's topics (from its
 * syllabus or added by hand) and files, the storage limits, the topics a
 * syllabus adds, the next exam, and how a quiz moves a topic along. The
 * subjects themselves are the semester subjects (lib/semester-subjects).
 */
import type { SyllabusMilestone } from "./syllabus-calendar";
import { daysFrom, milestonesForSubject } from "./syllabus-dates";

export type TopicStatus = "new" | "in_progress" | "done";
export type SubjectFileKind = "lecture" | "reading" | "assignment" | "presentation" | "other";

export const FILE_KINDS: { id: SubjectFileKind; label: string }[] = [
  { id: "lecture", label: "ლექციები" },
  { id: "reading", label: "საკითხავი" },
  { id: "assignment", label: "დავალებები" },
  { id: "presentation", label: "პრეზენტაციები" },
  { id: "other", label: "სხვა" },
];

export interface SubjectTopic {
  id: string;
  subjectId: string;
  order: number;
  title: string;
  source: "syllabus" | "manual";
  status: TopicStatus;
  /** The last quiz on this topic, in percent. */
  quizPercent?: number;
  /** ms */
  createdAt: number;
  updatedAt: number;
  deletedAt?: number;
}

export interface SubjectFile {
  id: string;
  subjectId: string;
  name: string;
  size: number;
  mime: string;
  kind: SubjectFileKind;
  topicIds: string[];
  /** YYYY-MM-DD, for an assignment. */
  dueDate?: string;
  /** In the subject-files bucket; null until uploaded (signed out, offline). */
  storagePath: string | null;
  /** Signed in, and the upload to storage failed: the list says so and offers to try again. */
  uploadFailed?: boolean;
  /** The kind and topics are being guessed. */
  tagging?: boolean;
  /** The student set the kind or topics: the guess doesn't overwrite them. */
  tagsByHand?: boolean;
  /** A short title from the file's contents („ლექცია 2: პროცესები“); the list shows it over `name`. */
  displayTitle?: string;
  /** The student renamed it: a later guess doesn't overwrite the title. */
  titleByHand?: boolean;
  /** A title was asked for once (older files are filled in once, in the background). */
  titleTried?: boolean;
  /** ms */
  createdAt: number;
  updatedAt: number;
  deletedAt?: number;
}

/** What a file is called in the lists: its title from the contents, else its name. */
export function fileTitle(file: Pick<SubjectFile, "name" | "displayTitle">): string {
  return file.displayTitle?.trim() || file.name;
}

/** A model's title made fit for a list: one line, no quotes or dashes around it, at most 80 characters. */
export function cleanFileTitle(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const title = raw
    .replace(/\s+/g, " ")
    .replace(/^[\s"'„“«»*#]+|[\s"'„“«»*.]+$/g, "")
    .replace(/\s+[-–—]\s+/g, ": ")
    .trim();
  if (title.length < 2) return null;
  return title.length > 80 ? `${title.slice(0, 79).trimEnd()}…` : title;
}

export const SUBJECT_FILE_MAX_BYTES = 20 * 1024 * 1024;
export const SUBJECT_FILE_TOO_BIG = "ფაილი ძალიან დიდია. მაქსიმუმ 20 MB.";
export const SUBJECT_STORAGE_FULL = "საგნის საცავი სავსეა";
export const SUBJECT_FILE_ACCEPT = ".pdf,.docx,.pptx,.txt,.md,.png,.jpg,.jpeg,.webp";

/** What one subject may hold in all: NEXT_PUBLIC_SUBJECT_STORAGE_LIMIT_MB (200 by default). */
export function subjectStorageLimitBytes(raw: string | undefined = process.env.NEXT_PUBLIC_SUBJECT_STORAGE_LIMIT_MB): number {
  const mb = Number(raw);
  return (Number.isFinite(mb) && mb > 0 ? mb : 200) * 1024 * 1024;
}

export function subjectBytes(files: SubjectFile[], subjectId: string): number {
  return files.filter((file) => file.subjectId === subjectId && !file.deletedAt).reduce((sum, file) => sum + file.size, 0);
}

/** Why a file can't be added (too big, the subject's storage full), or null. */
export function fileProblem(size: number, used: number, limit: number = subjectStorageLimitBytes()): string | null {
  if (size > SUBJECT_FILE_MAX_BYTES) return SUBJECT_FILE_TOO_BIG;
  if (used + size > limit) return SUBJECT_STORAGE_FULL;
  return null;
}

const normalize = (title: string) => title.toLowerCase().replace(/[„“"'«».,:;()]+/g, " ").replace(/\s+/g, " ").trim();

/**
 * The syllabus's topics the subject doesn't have yet (by title), in the
 * syllabus's order, numbered after the ones it has.
 */
export function syllabusTopicsToAdd(
  existing: SubjectTopic[],
  titles: string[],
  subject: { id: string; name: string },
  now: number,
): SubjectTopic[] {
  const have = new Set(existing.filter((topic) => topic.subjectId === subject.id).map((topic) => normalize(topic.title)));
  let order = Math.max(0, ...existing.filter((topic) => topic.subjectId === subject.id && !topic.deletedAt).map((topic) => topic.order));
  return titles
    .filter((title) => {
      const key = normalize(title);
      if (!key || have.has(key)) return false;
      have.add(key);
      return true;
    })
    .map((title, index) => {
      order += 1;
      return {
        id: `topic-${subject.id}-${now.toString(36)}-${index}`,
        subjectId: subject.id,
        order,
        title,
        source: "syllabus" as const,
        status: "new" as const,
        createdAt: now,
        updatedAt: now,
      };
    });
}

/**
 * „თემების თავიდან ამოღება სილაბუსიდან“: the subject's syllabus topics
 * become `titles`, in that order. One with the same title stays (with its
 * status, files and notes); the others go; topics added by hand stay,
 * after them.
 */
export function replaceSyllabusTopicsPlan(
  existing: SubjectTopic[],
  titles: string[],
  subjectId: string,
  now: number,
): { update: SubjectTopic[]; remove: string[]; add: SubjectTopic[] } {
  const mine = existing.filter((topic) => topic.subjectId === subjectId && !topic.deletedAt).sort((a, b) => a.order - b.order);
  const fromSyllabus = new Map(mine.filter((topic) => topic.source === "syllabus").map((topic) => [normalize(topic.title), topic]));
  const update: SubjectTopic[] = [];
  const add: SubjectTopic[] = [];
  const kept = new Set<string>();
  let order = 0;
  titles.forEach((title, index) => {
    const key = normalize(title);
    if (!key || kept.has(key)) return;
    kept.add(key);
    order += 1;
    const current = fromSyllabus.get(key);
    if (current) update.push({ ...current, order, updatedAt: now });
    else
      add.push({
        id: `topic-${subjectId}-${now.toString(36)}-${index}`,
        subjectId,
        order,
        title,
        source: "syllabus",
        status: "new",
        createdAt: now,
        updatedAt: now,
      });
  });
  const remove = [...fromSyllabus.entries()].filter(([key]) => !kept.has(key)).map(([, topic]) => topic.id);
  for (const topic of mine.filter((item) => item.source !== "syllabus")) {
    order += 1;
    update.push({ ...topic, order, updatedAt: now });
  }
  return { update, remove, add };
}

const EXAM_TYPES = new Set(["midterm", "final", "quiz"]);
const EXAM_LABELS: Record<string, string> = { midterm: "შუალედური", final: "ფინალური", quiz: "ქვიზი" };

/** The subject's next exam from its syllabus (today or later), with the days left; null when none. */
export function nextExam(
  milestones: SyllabusMilestone[],
  subjectName: string,
  today: string,
): { title: string; label: string; date: string; days: number } | null {
  const upcoming = milestonesForSubject(milestones, subjectName)
    .filter((item): item is SyllabusMilestone & { date: string } => EXAM_TYPES.has(item.type) && typeof item.date === "string" && item.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date));
  const exam = upcoming[0];
  return exam ? { title: exam.title, label: EXAM_LABELS[exam.type] ?? exam.title, date: exam.date, days: daysFrom(today, exam.date) } : null;
}

/** A topic after a quiz on it: 80% or more is learned, anything else is under way. */
export function statusAfterQuiz(current: TopicStatus, percent: number): TopicStatus {
  if (percent >= 80) return "done";
  return current === "done" ? "done" : "in_progress";
}

/** A first guess from the file's name, until (or if) the AI answers. */
export function guessKindFromName(name: string): SubjectFileKind {
  const lower = name.toLowerCase();
  if (/\.pptx$/.test(lower) || /პრეზენტ|slides?/.test(lower)) return "presentation";
  if (/დავალ|assignment|homework|task|ბრიფ|brief/.test(lower)) return "assignment";
  if (/ლექცი|lecture/.test(lower)) return "lecture";
  if (/საკითხ|reading|article|სტატი|წიგნ|chapter|თავი/.test(lower)) return "reading";
  return "other";
}

/** The topics a tagging answer may name: the subject's own, at most two. */
export function cleanTopicIds(ids: unknown, topics: { id: string }[]): string[] {
  if (!Array.isArray(ids)) return [];
  const known = new Set(topics.map((topic) => topic.id));
  return [...new Set(ids.filter((id): id is string => typeof id === "string" && known.has(id)))].slice(0, 2);
}
