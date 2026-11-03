/**
 * What the subject page's buttons do: each opens an existing tool with the
 * topic already filled in (its files, the subject), so nothing is uploaded
 * twice; the tool then tags what it makes with the subject and topic.
 */
import { aiTeacherHrefForSpace } from "./access-control";
import { AI_TEACHER_CONTEXT_KEY, AI_TEACHER_PROMPT_KEY, AI_TEACHER_TITLE_KEY } from "./syllabus-calendar";
import { getSubjectFileBlob } from "./subject-files-client";
import { getFiles, getTopic, markTopicStarted } from "./subject-store";
import { handOffPresentation } from "./tool-handoff";
import { newPresentationId } from "./presentation-store";
import { fileTitle, type SubjectFile, type SubjectTopic } from "./subjects";
import { StoredFile } from "./stored-file";

/** The files sent along for their text when they aren't in storage (the size the server takes in a request). */
const SEND_MAX_BYTES = 4 * 1024 * 1024;

export type TopicTool = "quiz" | "cards" | "summary" | "presentation";

/** A topic's files, newest first. */
export function topicFiles(topic: Pick<SubjectTopic, "id" | "subjectId">): SubjectFile[] {
  return getFiles(topic.subjectId).filter((file) => file.topicIds.includes(topic.id));
}

/** The first message the AI teacher sends for a topic. */
export function studyPrompt(topic: string, subject: string): string {
  return `მოდი ვისწავლოთ თემა „${topic}“ საგნიდან „${subject}“. დაიწყე მთავარი ცნებებით.`;
}

/** The files' text (at most `budget` characters, shared equally), from storage or this device. */
export async function fetchExcerpts(files: SubjectFile[], budget = 12_000): Promise<{ name: string; text: string }[]> {
  if (files.length === 0) return [];
  const form = new FormData();
  form.append("budget", String(budget));
  for (const file of files.slice(0, 5)) {
    form.append("names", file.name);
    form.append("paths", file.storagePath ?? "");
    if (!file.storagePath) {
      const blob = await getSubjectFileBlob(file);
      // Too big to send: left out (it reaches the AI once it's in storage).
      form.append("files", blob && blob.size <= SEND_MAX_BYTES ? blob : new Blob([]), file.name);
    }
  }
  try {
    const response = await fetch("/api/subjects/excerpt", { method: "POST", body: form });
    const data = (await response.json()) as { excerpts?: { name: string; text: string }[] };
    return response.ok ? (data.excerpts ?? []) : [];
  } catch {
    return [];
  }
}

export const joinExcerpts = (excerpts: { name: string; text: string }[]) =>
  excerpts.map((item) => `### ${item.name}\n${item.text}`).join("\n\n");

/** „დაიწყე სწავლა“: the AI teacher, in a new conversation on the topic, with its files as reference. Returns where to go. */
export async function prepareStudy(subject: { name: string }, topic: SubjectTopic): Promise<string> {
  markTopicStarted(topic.id);
  const context = joinExcerpts(await fetchExcerpts(topicFiles(topic)));
  const prompt = studyPrompt(topic.title, subject.name);
  const href = aiTeacherHrefForSpace("student");
  try {
    window.sessionStorage.setItem(AI_TEACHER_PROMPT_KEY, prompt);
    window.sessionStorage.setItem(AI_TEACHER_TITLE_KEY, topic.title);
    if (context) window.sessionStorage.setItem(AI_TEACHER_CONTEXT_KEY, context);
    else window.sessionStorage.removeItem(AI_TEACHER_CONTEXT_KEY);
  } catch {
    // No sessionStorage (private mode): the query string carries the prompt.
    return `${href}?prompt=${encodeURIComponent(prompt)}`;
  }
  return href;
}

/** Where a tool opens for a topic; a presentation is filled in here first. */
export async function toolHref(tool: TopicTool, subject: { id: string; name: string }, topic: SubjectTopic): Promise<string> {
  markTopicStarted(topic.id);
  const params = `subject=${encodeURIComponent(subject.id)}&topic=${encodeURIComponent(topic.id)}`;
  if (tool === "quiz") return `/quiz?tab=new&${params}`;
  if (tool === "cards") return `/generate?tab=new&mode=cards&${params}`;
  if (tool === "summary") return `/generate?tab=new&mode=summary&${params}`;
  const notes = joinExcerpts(await fetchExcerpts(topicFiles(topic), 1500));
  handOffPresentation({
    topic: topic.title,
    subject: subject.name,
    subjectId: subject.id,
    topicId: topic.id,
    ...(notes ? { extraInstructions: `ამ თემის მასალიდან:\n${notes}` } : {}),
  });
  return `/presentation?id=${encodeURIComponent(newPresentationId())}`;
}

/**
 * A topic's file for a generator: in storage, only its name, size and path
 * (the server reads it there; nothing is downloaded here); not uploaded yet
 * (signed out, offline), this device's copy.
 */
async function sourceFile(file: SubjectFile): Promise<File | null> {
  if (file.storagePath) return new StoredFile(fileTitleFor(file), file.size, file.mime, file.storagePath);
  return getSubjectFileBlob(file);
}

/** The name a generator lists: the title from the contents, with the file's own extension (the server reads the type from it). */
function fileTitleFor(file: SubjectFile): string {
  const extension = file.name.match(/\.[a-z0-9]{1,8}$/i)?.[0] ?? "";
  const title = fileTitle(file).replace(/[\\/:*?"<>|]+/g, " ").trim();
  return title.toLowerCase().endsWith(extension.toLowerCase()) ? title : `${title}${extension}`;
}

/** The topic a tool was opened on (`?subject=&topic=`), its files and the link to put on what's made. */
export async function topicSources(subjectId: string | null, topicId: string | null): Promise<{
  topic: SubjectTopic;
  files: File[];
  link: { subjectId: string; topicId: string };
} | null> {
  if (!subjectId || !topicId) return null;
  const topic = getTopic(topicId);
  if (!topic || topic.subjectId !== subjectId) return null;
  const files = await Promise.all(topicFiles(topic).map(sourceFile));
  return { topic, files: files.filter((file): file is File => Boolean(file)), link: { subjectId, topicId } };
}
