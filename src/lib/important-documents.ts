/**
 * The three documents a student keeps on the dashboard.
 *
 * What's known of each (name, size, type, where it's stored) follows the
 * account (lib/user-data, `spaceedu-documents`); the files themselves are
 * in the account's private storage (lib/user-files: user-files/<user_id>/
 * documents/<id>), so every device and browser has them. IndexedDB keeps a
 * copy on this device as a cache. Documents from before this were only in
 * IndexedDB: they're taken onto the list and uploaded once, in the
 * background, on the next sign-in.
 */
import { userStore } from "./user-data";
import { DOCUMENTS_KEY, DOCUMENTS_UPDATED_EVENT } from "./user-data-keys";
import {
  downloadUserFile,
  isUserFilesConnected,
  onUserFilesConnected,
  pathForDocument,
  removeUserFile,
  uploadUserFile,
} from "./user-files";

export { DOCUMENTS_UPDATED_EVENT };

/** Three, as asked — enough for the ones that matter, few enough to scan. */
export const MAX_DOCUMENTS = 3;

/** Comfortably above a syllabus or a deck, under the bucket's 20 MB. */
export const MAX_DOCUMENT_BYTES = 15 * 1024 * 1024;

const TOMBSTONE_DAYS = 60;

/** What's known of a document — what the card renders. */
export interface DocumentMeta {
  id: string;
  name: string;
  /** MIME type as the browser reported it; may be empty for odd files. */
  type: string;
  size: number;
  addedAt: number;
}

/** The record on the account. */
export interface DocumentRecord extends DocumentMeta {
  /** In storage; null until uploaded (signed out, offline). */
  storagePath: string | null;
  /** „ჩემი საგნები“: the subject it belongs to, when there is one. */
  subjectId?: string;
  createdAt: number;
  updatedAt: number;
  deletedAt?: number;
}

/** The cached copy on this device (the IndexedDB store's old shape). */
interface CachedDocument extends DocumentMeta {
  blob: Blob;
}

const DB_NAME = "spaceedu-documents";
const DB_VERSION = 1;
const STORE = "files";

function isBrowser(): boolean {
  return typeof window !== "undefined" && "indexedDB" in window;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function run<T>(
  mode: IDBTransactionMode,
  work: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(STORE, mode);
        const request = work(tx.objectStore(STORE));
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
        tx.oncomplete = () => db.close();
      }),
  );
}

const cachedAll = () => run<CachedDocument[]>("readonly", (store) => store.getAll() as IDBRequest<CachedDocument[]>).catch(() => [] as CachedDocument[]);
const cached = (id: string) =>
  run<CachedDocument | undefined>("readonly", (store) => store.get(id) as IDBRequest<CachedDocument | undefined>).catch(() => undefined);
const cache = (record: CachedDocument) => run("readwrite", (store) => store.put(record)).catch(() => undefined);
const uncache = (id: string) => run("readwrite", (store) => store.delete(id)).catch(() => undefined);

/** On sign-out this device's copies go too, like the account's other data. */
export function clearDocumentsCache(): void {
  if (isBrowser()) void run("readwrite", (store) => store.clear()).catch(() => undefined);
}

function announce(): void {
  window.dispatchEvent(new Event(DOCUMENTS_UPDATED_EVENT));
}

function readRecords(): DocumentRecord[] {
  const value = userStore.get<unknown>(DOCUMENTS_KEY, []);
  return Array.isArray(value) ? (value as DocumentRecord[]) : [];
}

function writeRecords(records: DocumentRecord[], now: number = Date.now()): void {
  const cutoff = now - TOMBSTONE_DAYS * 86_400_000;
  userStore.set(DOCUMENTS_KEY, records.filter((record) => !record.deletedAt || record.deletedAt > cutoff));
  announce();
}

function updateRecord(id: string, patch: Partial<DocumentRecord>): void {
  const now = Date.now();
  writeRecords(
    readRecords().map((record) => (record.id === id ? { ...record, ...patch, updatedAt: now } : record)),
    now,
  );
}

const toMeta = ({ id, name, type, size, addedAt }: DocumentMeta): DocumentMeta => ({ id, name, type, size, addedAt });

/**
 * Documents kept only in this browser before they followed the account:
 * taken onto the list (once each; uploaded on sign-in by uploadPending).
 */
async function adoptCached(): Promise<void> {
  const records = readRecords();
  const known = new Set(records.map((record) => record.id));
  const orphans = (await cachedAll()).filter((item) => !known.has(item.id));
  if (orphans.length === 0) return;
  const now = Date.now();
  writeRecords(
    [
      ...records,
      ...orphans.map((item): DocumentRecord => ({ ...toMeta(item), storagePath: null, createdAt: item.addedAt, updatedAt: now })),
    ],
    now,
  );
}

/** Uploads what isn't on the account yet (added signed out or offline, or from before). Marked by its storage path. */
async function uploadPending(): Promise<void> {
  await adoptCached();
  for (const record of readRecords().filter((item) => !item.storagePath && !item.deletedAt && item.size <= MAX_DOCUMENT_BYTES)) {
    const copy = await cached(record.id);
    if (!copy?.blob) continue;
    const path = await uploadUserFile(pathForDocument(record.id), copy.blob, record.type);
    if (path) updateRecord(record.id, { storagePath: path });
  }
}

if (typeof window !== "undefined") onUserFilesConnected(() => void uploadPending());

export async function loadDocuments(): Promise<DocumentMeta[]> {
  if (!isBrowser()) return [];
  await adoptCached();
  return readRecords()
    .filter((record) => !record.deletedAt)
    .map(toMeta)
    .sort((a, b) => b.addedAt - a.addedAt);
}

export type AddDocumentResult =
  | { ok: true; meta: DocumentMeta }
  | { ok: false; reason: "full" | "too-large" | "failed" };

export async function addDocument(file: File): Promise<AddDocumentResult> {
  if (!isBrowser()) return { ok: false, reason: "failed" };
  if (file.size > MAX_DOCUMENT_BYTES) return { ok: false, reason: "too-large" };

  try {
    const existing = await loadDocuments();
    if (existing.length >= MAX_DOCUMENTS) return { ok: false, reason: "full" };

    const now = Date.now();
    const meta: DocumentMeta = {
      id: typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `doc-${now}`,
      name: file.name,
      type: file.type,
      size: file.size,
      addedAt: now,
    };
    await cache({ ...meta, blob: file });
    writeRecords([...readRecords(), { ...meta, storagePath: null, createdAt: now, updatedAt: now }], now);
    const path = await uploadUserFile(pathForDocument(meta.id), file, file.type);
    if (path) updateRecord(meta.id, { storagePath: path });
    return { ok: true, meta };
  } catch {
    return { ok: false, reason: "failed" };
  }
}

export async function deleteDocument(id: string): Promise<void> {
  if (!isBrowser()) return;
  const record = readRecords().find((item) => item.id === id);
  updateRecord(id, { deletedAt: Date.now() });
  await uncache(id);
  if (record?.storagePath) await removeUserFile(record.storagePath);
}

/**
 * Hands back an object URL for the file: this device's copy, else fetched
 * from the account (and kept). The caller owns it and must revoke it once
 * the browser has opened it.
 */
export async function documentObjectUrl(id: string): Promise<string | null> {
  if (!isBrowser()) return null;
  const copy = await cached(id);
  if (copy?.blob) return URL.createObjectURL(copy.blob);
  const record = readRecords().find((item) => item.id === id && !item.deletedAt);
  if (!record?.storagePath || !isUserFilesConnected()) return null;
  const blob = await downloadUserFile(record.storagePath);
  if (!blob) return null;
  await cache({ ...toMeta(record), blob });
  return URL.createObjectURL(blob);
}

/** "2.4 MB" — the size as a reader would say it. */
export function formatDocumentSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** A short, human label for the file's kind, from its name or MIME type. */
export function documentKind(doc: DocumentMeta): string {
  const extension = doc.name.split(".").pop()?.toLowerCase() ?? "";
  if (extension) return extension.toUpperCase();
  if (doc.type.includes("pdf")) return "PDF";
  if (doc.type.includes("word")) return "DOC";
  if (doc.type.includes("presentation")) return "PPT";
  return "ფაილი";
}
