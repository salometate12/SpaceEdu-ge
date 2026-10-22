/**
 * Wires lib/presentation-sync to this browser's IndexedDB
 * (lib/presentation-store) and to the account: the user_presentations table
 * and the private presentation-photos bucket (<user_id>/<presentation>/<photo>).
 * UserDataSync connects it on sign-in and disconnects it on sign-out.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { UploadedPhoto } from "./presentation-photos";
import {
  clearAllPresentations,
  listPresentations,
  loadPresentation,
  putPresentationRecord,
  removeLocalPresentation,
  setPhotoFetcher,
  setPresentationChangeListener,
  type SavedPresentation,
} from "./presentation-store";
import { createPresentationSync, type PresentationRemote, type PresentationSync } from "./presentation-sync";

/** „ჩემი პრეზენტაციები“ re-reads its list on this. */
export const PRESENTATIONS_UPDATED_EVENT = "spaceedu-presentations-updated";

const BUCKET = "presentation-photos";

let sync: PresentationSync | null = null;

function getSync(): PresentationSync {
  if (sync) return sync;
  sync = createPresentationSync({
    local: {
      list: listPresentations,
      load: loadPresentation,
      putRecord: putPresentationRecord,
      remove: removeLocalPresentation,
      clear: clearAllPresentations,
    },
    storage: window.localStorage,
    isOnline: () => navigator.onLine,
    emit: () => window.dispatchEvent(new Event(PRESENTATIONS_UPDATED_EVENT)),
  });
  const current = sync;
  setPresentationChangeListener(({ type, id }) => (type === "deleted" ? current.deleted(id) : current.changed(id)));
  setPhotoFetcher((presentationId, entry) => current.fetchPhoto(presentationId, entry));
  return sync;
}

/** Decodes a data URL without fetch(): the site's CSP (connect-src) doesn't
 * allow data: URLs, so fetch(dataUrl) fails in the browser. */
export function dataUrlToBlob(dataUrl: string): Blob {
  const [header, payload = ""] = dataUrl.split(",", 2);
  const type = header.match(/^data:([^;,]+)/)?.[1] ?? "application/octet-stream";
  if (!header.includes(";base64")) return new Blob([decodeURIComponent(payload)], { type });
  const binary = atob(payload);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return new Blob([bytes], { type });
}

const blobToDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });

function supabasePresentations(client: SupabaseClient, userId: string): PresentationRemote {
  const path = (presentationId: string, photoId: string) => `${userId}/${presentationId}/${photoId}`;
  return {
    async list() {
      const { data, error } = await client.from("user_presentations").select("data").eq("user_id", userId);
      if (error) throw error;
      return (data ?? []).map((row) => row.data as SavedPresentation);
    },
    async upsert(record) {
      const { error } = await client
        .from("user_presentations")
        .upsert({ user_id: userId, id: record.id, data: record }, { onConflict: "user_id,id" });
      if (error) throw error;
    },
    async remove(id) {
      const { error } = await client.from("user_presentations").delete().eq("user_id", userId).eq("id", id);
      if (error) throw error;
    },
    async uploadPhoto(presentationId, photo: UploadedPhoto) {
      const blob = dataUrlToBlob(photo.dataUrl);
      const { error } = await client.storage
        .from(BUCKET)
        .upload(path(presentationId, photo.id), blob, { upsert: true, contentType: blob.type || "image/jpeg" });
      if (error) throw error;
    },
    async removePhotos(presentationId, photoIds) {
      const { error } = await client.storage.from(BUCKET).remove(photoIds.map((photoId) => path(presentationId, photoId)));
      if (error) throw error;
    },
    async downloadPhoto(presentationId, photoId) {
      const { data, error } = await client.storage.from(BUCKET).download(path(presentationId, photoId));
      if (error || !data) return null;
      return blobToDataUrl(data);
    },
  };
}

export function connectPresentations(client: SupabaseClient, userId: string) {
  return getSync().connect(userId, supabasePresentations(client, userId));
}

export function refreshPresentations() {
  return sync?.refresh();
}

export function flushPresentations() {
  return sync?.flush();
}

export function disconnectPresentations() {
  return getSync().disconnect();
}
