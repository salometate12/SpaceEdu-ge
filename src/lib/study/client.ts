/**
 * Asking /api/subjects/study for a session's plan, a part or the check
 * questions. A file in storage goes as its path (lib/stored-file); one only
 * on this device goes to storage first, or as it is when small enough
 * (lib/stage-uploads).
 */
import { apiErrorMessage } from "@/lib/assistant-stream-client";
import { getSubjectFileBlob } from "@/lib/subject-files-client";
import { getFile } from "@/lib/subject-store";
import { appendFile, StoredFile } from "@/lib/stored-file";
import { stageFile } from "@/lib/stage-uploads";
import type { CheckQuestion, SourceRef, StudyMode, StudyPart, StudyPlanPart } from "./schemas";
import type { SessionFile } from "./sessions";

export const STUDY_ERROR = "მასალის მომზადება ვერ მოხერხდა. სცადე თავიდან.";

type Kinds = Record<string, "slide" | "page">;

async function sendable(file: SessionFile): Promise<File | null> {
  if (file.storagePath) return new StoredFile(file.name, file.size, file.mime, file.storagePath);
  const record = getFile(file.id);
  const blob = record ? await getSubjectFileBlob(record) : null;
  return blob ? stageFile(blob) : null;
}

async function ask<T>(fields: Record<string, string>, files: SessionFile[]): Promise<T & { kinds: Kinds }> {
  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) form.append(key, value);
  for (const file of files) {
    const ready = await sendable(file);
    if (!ready) continue;
    form.append("fileIds", file.id);
    form.append("fileNames", ready.name);
    appendFile(form, "files", ready);
  }
  const response = await fetch("/api/subjects/study", { method: "POST", body: form });
  const raw = await response.text();
  if (!response.ok) throw new Error(apiErrorMessage(response.status, raw, STUDY_ERROR));
  return JSON.parse(raw) as T & { kinds: Kinds };
}

export function requestPlan(files: SessionFile[], mode: StudyMode, topic?: string, focus?: string[]) {
  return ask<{ parts: StudyPlanPart[] }>({ action: "plan", mode, ...(topic ? { topic } : {}), ...(focus?.length ? { focus: JSON.stringify(focus) } : {}) }, files);
}

export function requestCheck(files: SessionFile[], topic?: string) {
  return ask<{ questions: CheckQuestion[] }>({ action: "check", mode: "check", ...(topic ? { topic } : {}) }, files);
}

/** One part: only the files its slides or pages are in are sent. */
export function requestPart(files: SessionFile[], mode: StudyMode, plan: StudyPlanPart[], index: number, simpler = false) {
  const part = plan[index];
  const used = new Set(part.refs.map((ref: SourceRef) => ref.fileId));
  const needed = used.size ? files.filter((file) => used.has(file.id)) : files;
  return ask<{ part: StudyPart }>(
    {
      action: "part",
      mode,
      title: part.title,
      refs: JSON.stringify(part.refs),
      titles: JSON.stringify(plan.map((item) => item.title)),
      ...(simpler ? { simpler: "1" } : {}),
    },
    needed,
  );
}
