/**
 * A subject's files in the browser: kept in IndexedDB on this device (so
 * they open offline and signed out) and, signed in, in the private
 * subject-files bucket (<user_id>/<subject_id>/<file_id>), where other
 * devices fetch them from. Adding a file also guesses its kind and topics
 * (/api/subjects/tag-file; no credit is spent).
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { fileProblem, guessKindFromName, subjectBytes, type SubjectFile } from "./subjects";
import { getFile, getFiles, getTopics, markFileDeleted, saveFileRecord, updateFileRecord } from "./subject-store";

const BUCKET = "subject-files";
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

let remote: { client: SupabaseClient; userId: string } | null = null;

/** Signed in (UserDataSync): files can go to storage; ones added while signed out go now. */
export function connectSubjectFiles(client: SupabaseClient, userId: string): void {
  remote = { client, userId };
  void uploadPending();
}

/** Not signed in now; on sign-out (`clear`) this device's copies go too, like the account's other data. */
export function disconnectSubjectFiles({ clear = false }: { clear?: boolean } = {}): void {
  remote = null;
  if (clear) void withStore("readwrite", (store) => store.clear()).catch(() => undefined);
}

async function upload(file: SubjectFile, blob: Blob): Promise<string | null> {
  if (!remote) return null;
  const path = `${remote.userId}/${file.subjectId}/${file.id}`;
  const { error } = await remote.client.storage.from(BUCKET).upload(path, blob, { upsert: true, contentType: file.mime || "application/octet-stream" });
  return error ? null : path;
}

async function uploadPending(): Promise<void> {
  for (const file of getFiles().filter((item) => !item.storagePath)) {
    const blob = await getLocal(file.id);
    if (!blob) continue;
    const path = await upload(file, blob);
    if (path) updateFileRecord(file.id, { storagePath: path });
  }
}

/* --- Adding, opening, removing ------------------------------------------------ */

/** Asks the server for the file's kind and topics, and keeps them unless the student set their own meanwhile. */
async function tagFile(file: SubjectFile, blob: Blob): Promise<void> {
  const topics = getTopics(file.subjectId).map(({ id, title }) => ({ id, title }));
  const form = new FormData();
  form.append("name", file.name);
  form.append("topics", JSON.stringify(topics));
  if (file.storagePath) form.append("storagePath", file.storagePath);
  else if (blob.size <= TAG_UPLOAD_MAX_BYTES) form.append("file", blob, file.name);
  try {
    const response = await fetch("/api/subjects/tag-file", { method: "POST", body: form });
    const data = (await response.json()) as { kind?: SubjectFile["kind"]; topicIds?: string[] };
    const current = getFile(file.id);
    if (!current || current.tagsByHand) return;
    updateFileRecord(file.id, {
      tagging: false,
      ...(response.ok && data.kind ? { kind: data.kind } : {}),
      ...(response.ok && Array.isArray(data.topicIds) ? { topicIds: data.topicIds } : {}),
    });
  } catch {
    if (getFile(file.id)?.tagging) updateFileRecord(file.id, { tagging: false });
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
    if (path) updateFileRecord(record.id, { storagePath: path });
    void tagFile({ ...record, storagePath: path }, blob);
  }
  return problem;
}

/** The file's contents: this device's copy, else fetched from storage (and kept). Null when neither has it. */
export async function getSubjectFileBlob(file: SubjectFile): Promise<File | null> {
  const local = await getLocal(file.id);
  if (local) return new File([local], file.name, { type: file.mime || local.type });
  if (!remote || !file.storagePath) return null;
  const { data, error } = await remote.client.storage.from(BUCKET).download(file.storagePath);
  if (error || !data) return null;
  await putLocal(file.id, data);
  return new File([data], file.name, { type: file.mime || data.type });
}

export async function removeSubjectFile(file: SubjectFile): Promise<void> {
  markFileDeleted(file.id);
  await removeLocal(file.id);
  if (remote && file.storagePath) await remote.client.storage.from(BUCKET).remove([file.storagePath]);
}
