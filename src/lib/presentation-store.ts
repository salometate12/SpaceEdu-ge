/**
 * „ჩემი პრეზენტაციები“: every presentation is kept on this device in
 * IndexedDB (photos would overflow localStorage). Photos live in their own
 * store, keyed per presentation, so the list loads without them. Plain
 * records with ids and timestamps, so syncing them to a server later is a
 * copy, not a migration.
 */

import type { UploadedPhoto } from "@/lib/presentation-photos";
import type { GeneratedSlide, PresentationForm, QAAnswers } from "@/lib/presentation-types";

export const MAX_PRESENTATIONS = 30;

export interface SavedPresentation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  status: "draft" | "generated";
  step: 1 | 2 | 3 | 4;
  form: PresentationForm;
  templateId: string;
  qa: QAAnswers;
  slides: GeneratedSlide[] | null;
  /** In order; the photos themselves are in the photos store. */
  photoIds: string[];
  thumbnail?: string;
}

interface PhotoRecord {
  key: string;
  presentationId: string;
  photo: UploadedPhoto;
}

const DB_NAME = "spaceedu-presentations";
const DB_VERSION = 1;
const PRESENTATIONS = "presentations";
const PHOTOS = "photos";

const photoKey = (presentationId: string, photoId: string) => `${presentationId}/${photoId}`;

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB is unavailable"));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(PRESENTATIONS)) db.createObjectStore(PRESENTATIONS, { keyPath: "id" });
      if (!db.objectStoreNames.contains(PHOTOS)) {
        db.createObjectStore(PHOTOS, { keyPath: "key" }).createIndex("presentationId", "presentationId");
      }
    };
    request.onsuccess = () => {
      const db = request.result;
      // Another tab upgrading the schema: let it, and reopen next time.
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

const done = (tx: IDBTransaction) =>
  new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error ?? new Error("transaction aborted"));
  });

const result = <T>(request: IDBRequest<T>) =>
  new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

/** Short, URL-safe and unique enough for one device. */
export function newPresentationId(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

/** Newest first. */
export async function listPresentations(): Promise<SavedPresentation[]> {
  const db = await openDb();
  const all = await result(db.transaction(PRESENTATIONS).objectStore(PRESENTATIONS).getAll() as IDBRequest<SavedPresentation[]>);
  return all.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function countPresentations(): Promise<number> {
  const db = await openDb();
  return result(db.transaction(PRESENTATIONS).objectStore(PRESENTATIONS).count());
}

export async function loadPresentation(
  id: string,
): Promise<{ presentation: SavedPresentation; photos: UploadedPhoto[] } | null> {
  const db = await openDb();
  const tx = db.transaction([PRESENTATIONS, PHOTOS]);
  const [presentation, records] = await Promise.all([
    result(tx.objectStore(PRESENTATIONS).get(id) as IDBRequest<SavedPresentation | undefined>),
    result(tx.objectStore(PHOTOS).index("presentationId").getAll(id) as IDBRequest<PhotoRecord[]>),
  ]);
  if (!presentation) return null;
  const byId = new Map(records.map((record) => [record.photo.id, record.photo]));
  const photos = presentation.photoIds.map((photoId) => byId.get(photoId)).filter((p): p is UploadedPhoto => Boolean(p));
  return { presentation, photos };
}

/** Photo objects already written, so a save rewrites only new or changed ones. */
const writtenPhotos = new WeakMap<UploadedPhoto, string>();

/**
 * Saves the presentation and exactly these photos for it (photos it no
 * longer has are removed). Unchanged photos aren't written again.
 */
export async function savePresentation(presentation: SavedPresentation, photos: UploadedPhoto[]): Promise<void> {
  const db = await openDb();
  const tx = db.transaction([PRESENTATIONS, PHOTOS], "readwrite");
  const photoStore = tx.objectStore(PHOTOS);
  tx.objectStore(PRESENTATIONS).put({ ...presentation, photoIds: photos.map((photo) => photo.id) });

  const keep = new Set(photos.map((photo) => photoKey(presentation.id, photo.id)));
  const existing = (await result(photoStore.index("presentationId").getAllKeys(presentation.id))) as string[];
  for (const key of existing) if (!keep.has(key)) photoStore.delete(key);
  for (const photo of photos) {
    if (writtenPhotos.get(photo) === presentation.id && existing.includes(photoKey(presentation.id, photo.id))) continue;
    photoStore.put({ key: photoKey(presentation.id, photo.id), presentationId: presentation.id, photo } satisfies PhotoRecord);
  }
  await done(tx);
  for (const photo of photos) writtenPhotos.set(photo, presentation.id);
}

export async function deletePresentation(id: string): Promise<void> {
  const db = await openDb();
  const tx = db.transaction([PRESENTATIONS, PHOTOS], "readwrite");
  tx.objectStore(PRESENTATIONS).delete(id);
  const photoStore = tx.objectStore(PHOTOS);
  const keys = (await result(photoStore.index("presentationId").getAllKeys(id))) as string[];
  for (const key of keys) photoStore.delete(key);
  await done(tx);
}

export async function renamePresentation(id: string, title: string): Promise<void> {
  const db = await openDb();
  const tx = db.transaction(PRESENTATIONS, "readwrite");
  const store = tx.objectStore(PRESENTATIONS);
  const presentation = await result(store.get(id) as IDBRequest<SavedPresentation | undefined>);
  if (presentation) store.put({ ...presentation, title, updatedAt: Date.now() });
  await done(tx);
}

/** A full copy (photos too) under a new id; returns it. */
export async function duplicatePresentation(id: string, title?: string): Promise<SavedPresentation | null> {
  const loaded = await loadPresentation(id);
  if (!loaded) return null;
  const now = Date.now();
  const copy: SavedPresentation = {
    ...structuredClone(loaded.presentation),
    id: newPresentationId(),
    title: title ?? `${loaded.presentation.title} (ასლი)`,
    createdAt: now,
    updatedAt: now,
  };
  await savePresentation(copy, loaded.photos);
  return copy;
}

/** True when the browser says this site has used over 90% of its storage. */
export async function storageAlmostFull(): Promise<boolean> {
  try {
    const estimate = await navigator.storage?.estimate?.();
    if (!estimate?.quota || estimate.usage === undefined) return false;
    return estimate.usage / estimate.quota > 0.9;
  } catch {
    return false;
  }
}

/** The title shown in the list: the deck's, else the topic. */
export function presentationTitle(title: string | undefined, topic: string): string {
  return title?.trim() || topic.trim() || "უსათაურო პრეზენტაცია";
}
