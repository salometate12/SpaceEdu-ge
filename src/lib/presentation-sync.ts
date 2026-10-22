/**
 * „ჩემი პრეზენტაციები“ on the account. IndexedDB (lib/presentation-store)
 * stays the fast, offline copy; the account keeps one row per presentation
 * (user_presentations) and its photos as files (presentation-photos).
 *
 * - A save marks the presentation changed; ~2s later it's uploaded — new
 *   photos first, then the record (photo data replaced by their ids and
 *   sizes). A delete removes the row and its photos.
 * - On sign-in (and when the tab comes back) the account's list is pulled:
 *   what's newer there is written here (photos are fetched when the
 *   presentation is opened); what's only here is uploaded (the one-time
 *   migration); what was synced but is gone there was deleted elsewhere.
 * - Offline, changes wait (the queue is stored) and go once back online.
 *
 * Pure apart from what's injected, so it's testable without a browser;
 * lib/presentation-sync-client.ts wires it to IndexedDB and Supabase.
 */

import type { UploadedPhoto } from "./presentation-photos";
import type { PhotoMeta, SavedPresentation } from "./presentation-store";
import type { KeyValueStorage } from "./user-store";

export interface LocalPresentations {
  list(): Promise<SavedPresentation[]>;
  /** The record and the photos that are on this device. */
  load(id: string): Promise<{ presentation: SavedPresentation; photos: UploadedPhoto[] } | null>;
  /** Writes the record only (its photos come later, on open). */
  putRecord(record: SavedPresentation): Promise<void>;
  remove(id: string): Promise<void>;
  clear(): Promise<void>;
}

export interface PresentationRemote {
  list(): Promise<SavedPresentation[]>;
  upsert(record: SavedPresentation): Promise<void>;
  remove(id: string): Promise<void>;
  uploadPhoto(presentationId: string, photo: UploadedPhoto): Promise<void>;
  removePhotos(presentationId: string, photoIds: string[]): Promise<void>;
  /** The photo as a data URL, or null if it isn't there. */
  downloadPhoto(presentationId: string, photoId: string): Promise<string | null>;
}

export const PRESENTATION_SYNC_KEY = "spaceedu-presentations-sync";

interface Meta {
  owner: string | null;
  /** updatedAt of each presentation as of its last sync. */
  synced: Record<string, number>;
  /** Photo ids already on the account, per presentation. */
  photos: Record<string, string[]>;
  /** Changed here, not yet uploaded. */
  dirty: Record<string, true>;
  /** Deleted here, not yet deleted there. */
  deleted: Record<string, true>;
}

const photoMeta = ({ id, width, height, name, caption }: UploadedPhoto): PhotoMeta => ({ id, width, height, name, caption });

export function createPresentationSync({
  local,
  storage,
  debounceMs = 2000,
  isOnline = () => true,
  emit,
}: {
  local: LocalPresentations;
  storage: KeyValueStorage;
  debounceMs?: number;
  isOnline?: () => boolean;
  /** The list changed because of the account (re-read it). */
  emit?: () => void;
}) {
  let remote: PresentationRemote | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let queue: Promise<void> = Promise.resolve();

  const readMeta = (): Meta => {
    try {
      const parsed = JSON.parse(storage.getItem(PRESENTATION_SYNC_KEY) ?? "{}") as Partial<Meta>;
      return {
        owner: parsed.owner ?? null,
        synced: parsed.synced ?? {},
        photos: parsed.photos ?? {},
        dirty: parsed.dirty ?? {},
        deleted: parsed.deleted ?? {},
      };
    } catch {
      return { owner: null, synced: {}, photos: {}, dirty: {}, deleted: {} };
    }
  };
  const writeMeta = (meta: Meta) => storage.setItem(PRESENTATION_SYNC_KEY, JSON.stringify(meta));
  const update = (change: (meta: Meta) => void) => {
    const meta = readMeta();
    change(meta);
    writeMeta(meta);
  };

  const run = (task: () => Promise<void>) => {
    queue = queue.then(task, task);
    return queue;
  };

  const schedule = () => {
    if (!remote) return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      void run(push);
    }, debounceMs);
  };

  /** Uploads one presentation: photos the account doesn't have, then the record. */
  const upload = async (id: string) => {
    const loaded = await local.load(id);
    if (!loaded || !remote) return;
    const { presentation, photos } = loaded;
    const meta = readMeta();
    const onAccount = new Set(meta.photos[id] ?? []);
    for (const photo of photos) {
      if (!onAccount.has(photo.id)) await remote.uploadPhoto(id, photo);
    }
    const kept = new Set(presentation.photoIds);
    const gone = [...onAccount].filter((photoId) => !kept.has(photoId));
    if (gone.length) await remote.removePhotos(id, gone);
    // Sizes and captions of photos not downloaded here yet come from the record.
    const known = new Map((presentation.photoMeta ?? []).map((entry) => [entry.id, entry]));
    photos.forEach((photo) => known.set(photo.id, photoMeta(photo)));
    const record: SavedPresentation = {
      ...presentation,
      photoMeta: presentation.photoIds.map((photoId) => known.get(photoId)).filter((entry): entry is PhotoMeta => Boolean(entry)),
    };
    await remote.upsert(record);
    update((latest) => {
      latest.synced[id] = record.updatedAt;
      latest.photos[id] = [...presentation.photoIds];
    });
  };

  const push = async () => {
    if (!remote || !isOnline()) return;
    const meta = readMeta();
    try {
      for (const id of Object.keys(meta.deleted)) {
        await remote.remove(id);
        if (meta.photos[id]?.length) await remote.removePhotos(id, meta.photos[id]);
        update((latest) => {
          delete latest.deleted[id];
          delete latest.synced[id];
          delete latest.photos[id];
        });
      }
      for (const id of Object.keys(meta.dirty)) {
        await upload(id);
        update((latest) => {
          delete latest.dirty[id];
        });
      }
    } catch {
      // Stays queued; tried again on the next change, focus or reconnect.
    }
  };

  const pull = async (userId: string) => {
    if (!remote) return;
    let meta = readMeta();
    if (meta.owner && meta.owner !== userId) {
      // Someone else's presentations on this device: never show or upload them.
      await local.clear();
      meta = { owner: null, synced: {}, photos: {}, dirty: {}, deleted: {} };
      emit?.();
    }
    meta.owner = userId;
    writeMeta(meta);
    if (!isOnline()) return;

    let remoteList: SavedPresentation[];
    try {
      remoteList = await remote.list();
    } catch {
      return;
    }
    const localList = await local.list();
    const here = new Map(localList.map((presentation) => [presentation.id, presentation]));
    let changed = false;

    for (const record of remoteList) {
      if (meta.deleted[record.id]) continue;
      const mine = here.get(record.id);
      if (!mine || (record.updatedAt > mine.updatedAt && !meta.dirty[record.id])) {
        await local.putRecord(record);
        changed = true;
      } else if (mine.updatedAt > record.updatedAt) {
        meta.dirty[record.id] = true;
      }
      if (!meta.dirty[record.id]) meta.synced[record.id] = record.updatedAt;
      meta.photos[record.id] = [...record.photoIds];
    }
    const there = new Set(remoteList.map((record) => record.id));
    for (const mine of localList) {
      if (there.has(mine.id)) continue;
      if (mine.id in meta.synced && !meta.dirty[mine.id]) {
        // Deleted on another device.
        await local.remove(mine.id);
        delete meta.synced[mine.id];
        delete meta.photos[mine.id];
        changed = true;
      } else {
        // Only here: upload it (also the first-time migration).
        meta.dirty[mine.id] = true;
      }
    }
    writeMeta(meta);
    if (changed) emit?.();
    await push();
  };

  return {
    /** A presentation was saved, renamed or duplicated here. */
    changed(id: string) {
      update((meta) => {
        meta.dirty[id] = true;
        delete meta.deleted[id];
      });
      schedule();
    },
    /** A presentation was deleted here. */
    deleted(id: string) {
      update((meta) => {
        delete meta.dirty[id];
        if (id in meta.synced || meta.photos[id]?.length) meta.deleted[id] = true;
      });
      schedule();
    },
    connect(userId: string, connection: PresentationRemote) {
      remote = connection;
      return run(() => pull(userId));
    },
    refresh() {
      const owner = readMeta().owner;
      if (!remote || !owner) return Promise.resolve();
      return run(() => pull(owner));
    },
    flush: () => run(push),
    /** A photo of a presentation pulled from the account, fetched on open. */
    async fetchPhoto(presentationId: string, entry: PhotoMeta): Promise<UploadedPhoto | null> {
      if (!remote) return null;
      try {
        const dataUrl = await remote.downloadPhoto(presentationId, entry.id);
        return dataUrl ? { ...entry, dataUrl } : null;
      } catch {
        return null;
      }
    },
    /** Signed out: stop, and drop the account's presentations from this device. */
    async disconnect() {
      if (timer) clearTimeout(timer);
      timer = null;
      remote = null;
      if (readMeta().owner) {
        await local.clear();
        storage.removeItem(PRESENTATION_SYNC_KEY);
        emit?.();
      }
    },
  };
}

export type PresentationSync = ReturnType<typeof createPresentationSync>;
