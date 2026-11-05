/**
 * A subject's files in the browser: kept in IndexedDB on this device as a
 * cache (so they open offline) and, signed in, in the account's private
 * storage (lib/user-files: user-files/<user_id>/subjects/<subject>/<file>;
 * older ones in subject-files), where other devices fetch them from.
 * Adding a file also guesses its kind, topics and a title from its contents
 * (/api/subjects/tag-file; no credit is spent); older files get a title once,
 * in the background.
 */
import {
  downloadUserFile,
  isUserFilesConnected,
  onUserFilesConnected,
  removeUserFile,
  uploadSubjectFile,
} from "./user-files";
import { fileProblem, guessKindFromName, subjectBytes, type SubjectFile } from "./subjects";
import { getFile, getFiles, getTopics, markFileDeleted, saveFileRecord, updateFileRecord } from "./subject-store";

const DB_NAME = "spaceedu-subject-files";
const STORE = "blobs";
/** Sent along for tagging when the file isn't in storage yet (the request size the server takes). */
const TAG_UPLOAD_MAX_BYTES = 4 * 1024 * 1024;

/* --- This device's copies -------------------------------------------------- */

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB is unavailable"));
      return;
    }
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE);
    };
    request.onsuccess = () => {
      const db = request.result;
      db.onversionchange = () => {
        db.close();
        dbPromise = null;
      };
      resolve(db);
    };
    request.onerror = () => {
      dbPromise = null;
      reject(request.error);
    };
  });
  return dbPromise;
}

async function withStore<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb();
  return new Promise<T>((resolve, reject) => {
    const request = run(db.transaction(STORE, mode).objectStore(STORE));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

const putLocal = (id: string, blob: Blob) => withStore("readwrite", (store) => store.put(blob, id)).catch(() => undefined);
const getLocal = (id: string) => withStore<Blob | undefined>("readonly", (store) => store.get(id) as IDBRequest<Blob | undefined>).catch(() => undefined);
const removeLocal = (id: string) => withStore("readwrite", (store) => store.delete(id)).catch(() => undefined);

/* --- The account's copies --------------------------------------------------- */

/** On sign-out this device's copies go too, like the account's other data. */
export function clearSubjectFilesCache(): void {
  void withStore("readwrite", (store) => store.clear()).catch(() => undefined);
}

/**
 * To storage, and the record says how it went: its path, or `uploadFailed`
 * for the list's „ვერ აიტვირთა · თავიდან ცდა“. Signed out nothing is tried
 * (it goes up on sign-in) and nothing has failed.
 */
async function upload(file: SubjectFile, blob: Blob): Promise<string | null> {
  if (!isUserFilesConnected()) return null;
  let reason = "";
  try {
    const result = await uploadSubjectFile(file.subjectId, file.id, file.name, blob, file.mime);
    if ("path" in result) {
      updateFileRecord(file.id, { storagePath: result.path, uploadFailed: undefined });
      return result.path;
    }
    reason = result.error;
  } catch (error) {
    reason = error instanceof Error ? error.message : "upload failed";
  }
  console.error("[subject-files] upload failed", file.id, reason);
  updateFileRecord(file.id, { uploadFailed: true });
  return null;
}

// Signed in: files only on this device (added signed out or offline, from before, or that failed) go up now.
if (typeof window !== "undefined") onUserFilesConnected(() => void uploadPendingFiles());

let uploadingPending = false;

/** Every file not in storage yet that this device has, one after another. */
export async function uploadPendingFiles(): Promise<void> {
  if (uploadingPending || !isUserFilesConnected()) return;
  uploadingPending = true;
  try {
    for (const file of getFiles().filter((item) => !item.storagePath)) {
      const blob = await getLocal(file.id);
      if (blob) await upload(file, blob);
    }
  } finally {
    uploadingPending = false;
  }
}

/** „თავიდან ცდა“: null when it went up, else why not. */
export async function retrySubjectFileUpload(file: SubjectFile): Promise<string | null> {
  const blob = await getLocal(file.id);
  if (!blob) return "ფაილი ამ მოწყობილობაზე არ არის. გახსენი იქ, სადაც ატვირთე.";
  return (await upload(file, blob)) ? null : "ვერ აიტვირთა. სცადე ცოტა ხანში.";
}

/** The file's path in storage, uploading it first when this device has only its copy; null when that can't be done. */
export async function ensureSubjectFileStored(file: SubjectFile): Promise<string | null> {
  if (file.storagePath) return file.storagePath;
  const blob = await getLocal(file.id);
  return blob ? upload(file, blob) : null;
}

/* --- Adding, opening, removing ------------------------------------------------ */

interface TagAnswer {
  kind?: SubjectFile["kind"];
  topicIds?: string[];
  displayTitle?: string | null;
  guessed?: boolean;
}

async function askTags(file: SubjectFile, blob: Blob | null): Promise<TagAnswer | null> {
  const topics = getTopics(file.subjectId).map(({ id, title }) => ({ id, title }));
  const form = new FormData();
  form.append("name", file.name);
  form.append("topics", JSON.stringify(topics));
  if (file.storagePath) form.append("storagePath", file.storagePath);
  // Signed out only: signed in, a file reaches the server through storage or not at all.
  else if (blob && !isUserFilesConnected() && blob.size <= TAG_UPLOAD_MAX_BYTES) form.append("file", blob, file.name);
  const response = await fetch("/api/subjects/tag-file", { method: "POST", body: form });
  return response.ok ? ((await response.json()) as TagAnswer) : null;
}

/** The title from the answer, unless the student named the file meanwhile. */
function titlePatch(current: SubjectFile, data: TagAnswer | null): Partial<SubjectFile> {
  if (!data || data.guessed || current.titleByHand) return {};
  return { titleTried: true, ...(data.displayTitle ? { displayTitle: data.displayTitle } : {}) };
}

/** Asks the server for the file's kind, topics and title, and keeps them unless the student set their own meanwhile. */
async function tagFile(file: SubjectFile, blob: Blob): Promise<void> {
  try {
    const data = await askTags(file, blob);
    const current = getFile(file.id);
    if (!current) return;
    updateFileRecord(file.id, {
      tagging: false,
      ...titlePatch(current, data),
      ...(!current.tagsByHand && data?.kind ? { kind: data.kind } : {}),
      ...(!current.tagsByHand && Array.isArray(data?.topicIds) ? { topicIds: data.topicIds } : {}),
    });
  } catch {
    if (getFile(file.id)?.tagging) updateFileRecord(file.id, { tagging: false });
  }
}

/** Older files at most per visit, one after another. */
const TITLE_BACKFILL_PER_RUN = 10;
let backfilling = false;

/**
 * Files from before titles: each gets one from its contents, once, in the
 * background (the kind and topics they have stay). Runs once per visit.
 */
export async function fillMissingFileTitles(): Promise<void> {
  if (backfilling) return;
  backfilling = true;
  const waiting = getFiles()
    .filter((file) => !file.displayTitle && !file.titleTried && !file.titleByHand && !file.tagging)
    .slice(0, TITLE_BACKFILL_PER_RUN);
  for (const file of waiting) {
    try {
      const blob = file.storagePath ? null : await getLocal(file.id);
      if (!file.storagePath && !blob) continue;
      const data = await askTags(file, blob ?? null);
      // No AI here (or it failed): try again on a later visit.
      if (!data || data.guessed) break;
      const current = getFile(file.id);
      if (current) updateFileRecord(file.id, titlePatch(current, data));
    } catch {
      break;
    }
  }
}

/**
 * Adds files to a subject: each checked against 20 MB and the subject's
 * limit, kept here, uploaded when signed in, then tagged. Returns the first
 * problem, or null.
 */
export async function addSubjectFiles(subjectId: string, picked: File[]): Promise<string | null> {
  let problem: string | null = null;
  for (const blob of picked) {
    const issue = fileProblem(blob.size, subjectBytes(getFiles(), subjectId));
    if (issue) {
      problem ??= issue;
      continue;
    }
    const now = Date.now();
    const record: SubjectFile = {
      id: `file-${now.toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      subjectId,
      name: blob.name,
      size: blob.size,
      mime: blob.type,
      kind: guessKindFromName(blob.name),
      topicIds: [],
      storagePath: null,
      tagging: true,
      createdAt: now,
      updatedAt: now,
    };
    await putLocal(record.id, blob);
    saveFileRecord(record, now);
    const path = await upload(record, blob);
    void tagFile({ ...record, storagePath: path }, blob);
  }
  return problem;
}

/** The file's contents: this device's copy, else fetched from storage (and kept). Null when neither has it. */
export async function getSubjectFileBlob(file: SubjectFile): Promise<File | null> {
  const local = await getLocal(file.id);
  if (local) return new File([local], file.name, { type: file.mime || local.type });
  if (!isUserFilesConnected() || !file.storagePath) return null;
  const data = await downloadUserFile(file.storagePath);
  if (!data) return null;
  await putLocal(file.id, data);
  return new File([data], file.name, { type: file.mime || data.type });
}

export async function removeSubjectFile(file: SubjectFile): Promise<void> {
  markFileDeleted(file.id);
  await removeLocal(file.id);
  if (file.storagePath) await removeUserFile(file.storagePath);
}
