/**
 * The three documents a student keeps on the dashboard.
 *
 * Files live in IndexedDB rather than localStorage: a syllabus PDF or a
 * presentation is megabytes, and localStorage is both a few-megabyte
 * budget shared with everything else and string-only. Nothing leaves the
 * browser — this is a shelf, not an upload.
 */

export const DOCUMENTS_UPDATED_EVENT = "spaceedu-documents-updated";

/** Three, as asked — enough for the ones that matter, few enough to scan. */
export const MAX_DOCUMENTS = 3;

/** Comfortably above a syllabus or a deck, well under IndexedDB's quota. */
export const MAX_DOCUMENT_BYTES = 15 * 1024 * 1024;

export interface ImportantDocument {
  id: string;
  name: string;
  /** MIME type as the browser reported it; may be empty for odd files. */
  type: string;
  size: number;
  addedAt: number;
  blob: Blob;
}

/** Everything but the bytes — what the card needs to render a row. */
export type DocumentMeta = Omit<ImportantDocument, "blob">;

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

/** The row a card renders — everything except the bytes. */
function stripBlob(record: ImportantDocument): DocumentMeta {
  return {
    id: record.id,
    name: record.name,
    type: record.type,
    size: record.size,
    addedAt: record.addedAt,
  };
}

function announce(): void {
  window.dispatchEvent(new Event(DOCUMENTS_UPDATED_EVENT));
}

export async function loadDocuments(): Promise<DocumentMeta[]> {
  if (!isBrowser()) return [];
  try {
    const all = await run<ImportantDocument[]>("readonly", (store) =>
      store.getAll() as IDBRequest<ImportantDocument[]>,
    );
    return all.map(stripBlob).sort((a, b) => b.addedAt - a.addedAt);
  } catch {
    return [];
  }
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

    const record: ImportantDocument = {
      id:
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `doc-${Date.now()}`,
      name: file.name,
      type: file.type,
      size: file.size,
      addedAt: Date.now(),
      blob: file,
    };
    await run("readwrite", (store) => store.put(record));
    announce();
    return { ok: true, meta: stripBlob(record) };
  } catch {
    return { ok: false, reason: "failed" };
  }
}

export async function deleteDocument(id: string): Promise<void> {
  if (!isBrowser()) return;
  try {
    await run("readwrite", (store) => store.delete(id));
    announce();
  } catch {
    /* the shelf stays as it was */
  }
}

/**
 * Hands back an object URL for the stored file. The caller owns it and
 * must revoke it once the browser has opened it.
 */
export async function documentObjectUrl(id: string): Promise<string | null> {
  if (!isBrowser()) return null;
  try {
    const record = await run<ImportantDocument | undefined>(
      "readonly",
      (store) => store.get(id) as IDBRequest<ImportantDocument | undefined>,
    );
    if (!record?.blob) return null;
    return URL.createObjectURL(record.blob);
  } catch {
    return null;
  }
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
